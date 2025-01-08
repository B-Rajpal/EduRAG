from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pydantic import BaseModel
from langchain.text_splitter import TokenTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from sentence_transformers import SentenceTransformer
from langchain.embeddings import HuggingFaceEmbeddings
import ollama
from langchain.llms.base import LLM
import markdown
from sklearn.manifold import TSNE
import numpy as np

# Flask app setup
app = Flask(__name__)
CORS(app)

# Define the directory to save uploaded files
UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variables to hold processed data
ollama_llm = None
vector_stores = {}
chunked_data = {}

# Define a custom LLM wrapper for Ollama to integrate with LangChain
class OllamaLLM(LLM, BaseModel):
    model_name: str  # Explicitly declare the model_name field

    def _call(self, prompt: str, stop=None):
        response = ollama.generate(model=self.model_name, prompt=prompt)
        return response["response"]

    @property
    def _llm_type(self):
        return "ollama"


# Define the prompt template
prompt_template = """Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Answer:"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "question"]
)


@app.route('/initialize', methods=['POST'])
def initialize_model():
    """Endpoint to initialize the Ollama model."""
    global ollama_llm

    # Initialize the Ollama model if not already initialized
    if ollama_llm is None:
        ollama_llm = OllamaLLM(model_name="llama3.2")
        return jsonify({"message": "Model initialized successfully"}), 200
    else:
        return jsonify({"message": "Model already initialized"}), 200


@app.route('/upload', methods=['POST'])
def upload_file():
    """Endpoint to upload and save the file."""
    if 'files' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['files']
    subject = request.form.get('subject')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    
    subject_path = os.path.join(UPLOAD_FOLDER, subject)
    os.makedirs(subject_path, exist_ok=True)  # Ensure the directory is created

    file_path = os.path.join(subject_path, "uploaded_" + file.filename)
    file.save(file_path)

    return jsonify({"message": "File uploaded successfully", "filePath": file_path}), 200

@app.route('/delete', methods=['DELETE'])
def delete_file():
    """Endpoint to delete a file."""
    data = request.get_json()
    file_name = data.get("fileName")
    subject = data.get("subject")

    if not file_name or not subject:
        return jsonify({"error": "File name and subject are required"}), 400

    subject_folder = os.path.join(UPLOAD_FOLDER, subject)
    if not os.path.exists(subject_folder):
        return jsonify({"error": f"Subject folder '{subject}' does not exist."}), 404

    file_path = os.path.join(subject_folder, file_name)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({"message": f"File '{file_name}' deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": f"File '{file_name}' not found."}), 404
@app.route('/chunk', methods=['POST'])
def chunk_files():
    """Endpoint to process multiple uploaded files into chunks and return embeddings for t-SNE."""
    data = request.get_json()
    file_paths = data.get("filePaths")
    subject = data.get("subject")

    if not file_paths or not isinstance(file_paths, list):
        return jsonify({"error": "Invalid or missing file paths"}), 400
    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    subject_folder = os.path.join(UPLOAD_FOLDER, subject)
    vector_store_file = os.path.join(subject_folder, "vector_store")
    os.makedirs(subject_folder, exist_ok=True)

    try:
        embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
        vector_store = None
        chunk_embeddings = []
        chunk_texts = []
        
        # Process each file
        for file_path in file_paths:
            if os.path.exists(file_path):
                loader = PyPDFLoader(file_path)
                documents = loader.load()

                token_splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=50)
                texts = token_splitter.split_documents(documents)

                vector_store = FAISS.from_documents(texts, embedding=embedding_model)

                for text in texts:
                    chunk_texts.append(text.page_content)
                    embedding = embedding_model.embed_documents([text.page_content])[0]
                    chunk_embeddings.append(embedding)
            else:
                return jsonify({"error": f"File not found: {file_path}"}), 400

        # Save the vector store
        vector_store.save_local(vector_store_file)
        vector_stores[subject] = vector_store  # Cache the vector store in memory
        chunked_data[subject] = {
            "texts": chunk_texts,
            "embeddings": chunk_embeddings,
        }

        return jsonify({
            "message": "Files processed and vector store updated successfully",
            "data": {
                "texts": chunk_texts,
                "embeddings": chunk_embeddings,
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/tsne', methods=['POST'])
def tsne_visualization():
    """Endpoint to generate t-SNE embeddings for visualization."""
    data = request.get_json()
    subject = data.get("subject")

    if not subject:
        return jsonify({"error": "Subject is required"}), 400
    if subject not in chunked_data:
        return jsonify({"error": f"No chunked data available for subject '{subject}'"}), 404

    try:
        embeddings = np.array(chunked_data[subject]["embeddings"])
        if embeddings.ndim != 2:
            return jsonify({"error": "Embeddings should be a 2D array."}), 400

        texts = chunked_data[subject]["texts"]

        # Perform t-SNE
        tsne = TSNE(n_components=2, random_state=42)
        tsne_results = tsne.fit_transform(embeddings)

        tsne_data = [
            {"x": float(coord[0]), "y": float(coord[1]), "text": text}
            for coord, text in zip(tsne_results, texts)
        ]

        return jsonify({"data": tsne_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/preview', methods=['GET'])
def preview_files():
    """Endpoint to preview files for a given subject."""
    subject = request.args.get("subject")

    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    subject_folder = os.path.join(UPLOAD_FOLDER, subject)
    if not os.path.exists(subject_folder):
        return jsonify({"error": f"Subject folder '{subject}' does not exist."}), 404

    try:
        files = os.listdir(subject_folder)
        return jsonify({"subject": subject, "files": files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/rag', methods=['POST'])
def rag_pipeline():
    """Endpoint to handle the RAG pipeline for queries and return query point."""
    data = request.get_json()
    query = data.get("query")
    subject = data.get("subject")

    if not query:
        return jsonify({"error": "Query is required"}), 400
    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    try:
        # Use the cached vector store if available
        if subject in vector_stores:
            vector_store = vector_stores[subject]
        else:
            # Reload from disk if not in memory
            subject_folder = os.path.join(UPLOAD_FOLDER, subject)
            vector_store_file = os.path.join(subject_folder, "vector_store")
            if not os.path.exists(vector_store_file):
                return jsonify({"error": f"No data available for the subject '{subject}'."}), 400

            embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
            vector_store = FAISS.load_local(vector_store_file, embedding_model)
            vector_stores[subject] = vector_store

        # Generate embedding for the query
        embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
        query_embedding = embedding_model.embed_documents([query])[0]

        # Define the RetrievalQA chain
        qa = RetrievalQA.from_chain_type(
            llm=ollama_llm,
            chain_type="stuff",
            retriever=vector_store.as_retriever(search_kwargs={"k": 5}),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=False
        )

        result = qa({"query": query})
        answer = result['result']

        # Return the answer along with the query point embedding
        return jsonify({
            "answer": markdown.markdown(answer),
            "query_point": query_embedding # Convert NumPy array to list for JSON serialization
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/makedir", methods=["GET"])
def make_directory():
    try:
        subject = request.args.get("subject")
        if not subject:
            return jsonify({"error": "Subject is required"}), 400
        subject_path = os.path.join(UPLOAD_FOLDER, subject)
        os.makedirs(subject_path, exist_ok=True)
        return jsonify({"message": f"Directory '{subject}' created successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
