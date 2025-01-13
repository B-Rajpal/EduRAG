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

# Flask app setup
app = Flask(__name__)
CORS(app)

# Define the directory to save uploaded files
UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variables
ollama_llm = None
vector_stores = {}

# Define a custom LLM wrapper for Ollama to integrate with LangChain
class OllamaLLM(LLM, BaseModel):
    model_name: str

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
    """Endpoint to process multiple uploaded files into chunks."""
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
        all_texts = []

        # Process each file
        for file_path in file_paths:
            if os.path.exists(file_path):
                loader = PyPDFLoader(file_path)
                documents = loader.load()

                token_splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=50)
                texts = token_splitter.split_documents(documents)

                all_texts.extend(texts)  # Collect all texts
            else:
                return jsonify({"error": f"File not found: {file_path}"}), 400

        # Create the vector store from all combined texts
        vector_store = FAISS.from_documents(all_texts, embedding=embedding_model)

        # Save the vector store
        vector_store.save_local(vector_store_file)
        vector_stores[subject] = vector_store  # Cache the vector store in memory

        return jsonify({"message": "All files processed and vector store updated successfully"}), 200
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
    """Endpoint to handle the RAG pipeline for queries."""
    global ollama_llm

    data = request.get_json()
    query = data.get("query")
    subject = data.get("subject")

    if not query:
        return jsonify({"error": "Query is required"}), 400
    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    try:
        # Ensure the Ollama LLM is initialized
        if ollama_llm is None:
            ollama_llm = OllamaLLM(model_name="llama3.2")

        # Path to the vector store file
        subject_folder = os.path.join(UPLOAD_FOLDER, subject)
        vector_store_file = os.path.join(subject_folder, "vector_store")

        # Check if the vector store file exists
        if not os.path.exists(vector_store_file):
            return jsonify({"error": f"Vector store for '{subject}' not found."}), 404

        # Perform safe deserialization for trusted files
        embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
        try:
            vector_store = FAISS.load_local(vector_store_file, embedding_model, allow_dangerous_deserialization=True)
        except Exception as e:
            return jsonify({"error": f"Failed to load vector store: {str(e)}"}), 500

        # Cache the vector store in memory
        vector_stores[subject] = vector_store

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

        return jsonify({"answer": markdown.markdown(answer)}), 200

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
