from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from pydantic import BaseModel
from langchain.text_splitter import TokenTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from sentence_transformers import SentenceTransformer
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.llms.base import LLM
import markdown
from sklearn.manifold import TSNE
import numpy as np
import re
# Flask app setup
app = Flask(__name__)
CORS(app)

# Define the directory to save uploaded files
UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variables
ollama_llm = None
vector_stores = {}
chunked_data = {}

# Define a custom LLM wrapper for Ollama to integrate with LangChain
class OllamaLLM(LLM, BaseModel):
    model_name: str

    def _call(self, prompt: str, stop=None):
        response = Ollama.generate(model=self.model_name, prompt=prompt)
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
        ollama_llm = Ollama(model="llama3.2")
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

    file_path = os.path.join(subject_path,  file.filename)
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
        all_texts = []
        embeddings = []

        # Process each file
        for file_path in file_paths:
            if os.path.exists(file_path):
                loader = PyPDFLoader(file_path)
                documents = loader.load()

                token_splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=50)
                texts = token_splitter.split_documents(documents)
                all_texts.extend(texts)  # Collect all texts

                # Generate embeddings for each text chunk
                embeddings.extend(embedding_model.embed_documents([text.page_content for text in texts]))
            else:
                return jsonify({"error": f"File not found: {file_path}"}), 400

        # Create the vector store from all combined texts
        vector_store = FAISS.from_documents(all_texts, embedding=embedding_model)

        # Save the vector store
        vector_store.save_local(vector_store_file)
        vector_stores[subject] = vector_store  # Cache the vector store in memory

        # Store chunked data in memory
        chunked_data[subject] = {
            "embeddings": embeddings,
            "texts": [text.page_content for text in all_texts]
        }

        return jsonify({"message": "All files processed and vector store updated successfully"}), 200
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
        # # Debug: Log the chunked_data structure
        # print(f"Chunked data keys: {chunked_data.keys()}")
        # print(f"Chunked data for subject: {chunked_data[subject]}")

        # Retrieve embeddings and texts
        embeddings = np.array(chunked_data[subject]["embeddings"])
        texts = chunked_data[subject]["texts"]

        # Validate embeddings
        if embeddings.ndim != 2:
            return jsonify({"error": "Embeddings should be a 2D array."}), 400

        # Perform t-SNE
        n_samples = len(embeddings)
        perplexity = min(30, n_samples - 1)
        tsne = TSNE(n_components=2, perplexity=min(30,perplexity-1),random_state=42)
        tsne_results = tsne.fit_transform(embeddings)

        tsne_data = [
            {"x": float(coord[0]), "y": float(coord[1]), "text": text}
            for coord, text in zip(tsne_results, texts)
        ]

        return jsonify({"data": tsne_data}), 200
    except Exception as e:
        # Debug: Log the exact error
        print(f"Error during t-SNE: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/preview', methods=['GET'])
def preview_files():
    """Endpoint to preview files for a given subject or all subjects."""
    subject = request.args.get("subject")

    try:
        if subject:  # If subject is provided, return files for that subject
            subject_folder = os.path.join(UPLOAD_FOLDER, subject)
            if not os.path.exists(subject_folder):
                return jsonify({"error": f"Subject folder '{subject}' does not exist."}), 404

            files = os.listdir(subject_folder)
            return jsonify({"subject": subject, "files": files}), 200
        else:  # If no subject is provided, return files from all subjects
            all_files = []
            for subject in os.listdir(UPLOAD_FOLDER):
                subject_folder = os.path.join(UPLOAD_FOLDER, subject)
                if os.path.isdir(subject_folder):
                    files = os.listdir(subject_folder)
                    all_files.append({"subject": subject, "files": files})

            return jsonify({"files": all_files}), 200

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
        if ollama_llm is None:
            ollama_llm = OllamaLLM(model_name="llama3.2")

        subject_folder = os.path.join(UPLOAD_FOLDER, subject)
        vector_store_file = os.path.join(subject_folder, "vector_store")

        if not os.path.exists(vector_store_file):
            return jsonify({"error": f"Vector store for '{subject}' not found."}), 404

        embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

        try:
            vector_store = FAISS.load_local(vector_store_file, embedding_model, allow_dangerous_deserialization=True)
        except Exception as e:
            return jsonify({"error": f"Failed to load vector store: {str(e)}"}), 500

        vector_stores[subject] = vector_store

        # Generate embedding for the query
        query_embedding = np.array(embedding_model.embed_documents([query]))

        # Retrieve reference content
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})
        retrieved_docs = retriever.get_relevant_documents(query)
        reference_texts = [doc.page_content for doc in retrieved_docs]
        reference_embeddings = np.array(embedding_model.embed_documents(reference_texts))

        # Load existing embeddings
        existing_embeddings = np.array(chunked_data[subject]["embeddings"])
        existing_texts = chunked_data[subject]["texts"]

        # Perform t-SNE
        all_embeddings = np.concatenate([existing_embeddings, reference_embeddings, query_embedding], axis=0)
        n_samples = len(all_embeddings)
        perplexity = min(30, n_samples - 1)
        tsne = TSNE(n_components=2, perplexity=perplexity, random_state=42)
        tsne_result = tsne.fit_transform(all_embeddings)

        # Split t-SNE results
        tsne_existing = tsne_result[:len(existing_embeddings)]
        tsne_reference = tsne_result[len(existing_embeddings):-1]
        tsne_query = tsne_result[-1]

        # Run LLM for response
        qa = RetrievalQA.from_chain_type(
            llm=ollama_llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )

        result = qa.invoke({"query": query})
        answer = result['result']

        # Prepare t-SNE data
        tsne_existing_data = [
            {"x": float(coord[0]), "y": float(coord[1]), "text": text}
            for coord, text in zip(tsne_existing, existing_texts)
        ]
        tsne_reference_data = [
            {"x": float(coord[0]), "y": float(coord[1]), "text": text}
            for coord, text in zip(tsne_reference, reference_texts)
        ]

        return jsonify({
            "answer": markdown.markdown(answer),
            "query_point": {
                "x": float(tsne_query[0]),
                "y": float(tsne_query[1]),
                "text": query
            },
            "existing_embeddings": tsne_existing_data,
            "reference_embeddings": tsne_reference_data
        }), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route("/makedir", methods=["GET"])
def make_directory():
    try:
        subject = request.args.get("subject")
        if not subject:
            return jsonify({"error": "Subject is required"}), 400
        subject_path = os.path.join(UPLOAD_FOLDER, subject)
        os.makedirs(subject_path, exist_ok=True)
        return jsonify({"message": f"Directory created successfully for subject: {subject}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    """Generate a quiz based on the subject."""
    data = request.get_json()
    subject = data.get("subject")
    num_questions = data.get("num_questions", 10)  # Default to 10 if not provided

    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    try:
        if ollama_llm is None:
            return jsonify({"error": "Ollama model is not initialized. Please initialize the model first."}), 500

        subject_folder = os.path.join(UPLOAD_FOLDER, subject)
        vector_store_file = os.path.join(subject_folder, "vector_store")

        if not os.path.exists(vector_store_file):
            return jsonify({"error": f"No data available for the subject '{subject}'."}), 400

        embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
        vector_store = FAISS.load_local(vector_store_file, embedding_model, allow_dangerous_deserialization=True)

        if vector_store.index.ntotal == 0:
            return jsonify({"error": "No vectors found in FAISS. Please upload content first."}), 400

        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        query = f"Key concepts of {subject}"
        result = retriever.invoke(query)
        context = result[0].page_content if result else "No relevant content found."

        # Preprocess context to ensure better formatting
        context = preprocess_text_for_quiz(context)

        # Updated prompt to generate strictly formatted JSON
        question_prompt = f"""
        You are an expert quiz generator. Generate exactly {num_questions} multiple-choice questions based on the following content.

        ### Content:
        "{context}"

        ### Instructions:
        - Each question must have exactly 4 answer choices.
        - Clearly indicate the correct answer in the options.
        - **Return only valid JSON (no extra text, no code blocks, no explanations).**
        - Ensure no newlines or special characters like tabs are included.

        Format:
        [
            {{
                "question": "What is the capital of France?",
                "options": ["Paris", "London", "Berlin", "Madrid"],
                "answer": "Paris"
            }},
            ...
        ]
        """

        # Get LLM response
        response = ollama_llm.invoke(question_prompt).strip()

        # Check if the response is empty or invalid
        if not response:
            return jsonify({"error": "LLM did not return a response"}), 500

        # Clean up response (strip unwanted characters)
        cleaned_response = response.replace("\n", " ").replace("\t", " ").replace("\r", " ").strip()

        # Check for missing commas or common formatting issues
        cleaned_response = fix_json_format(cleaned_response)

        # Try parsing the cleaned response as JSON
        try:
            quiz = json.loads(cleaned_response)

            # Convert answer indices to actual answer texts if necessary
            for item in quiz:
                if isinstance(item["answer"], int) or (isinstance(item["answer"], str) and item["answer"].isdigit()):
                    answer_index = int(item["answer"])  # Convert to integer
                    if 0 <= answer_index < len(item["options"]):  # Ensure index is valid
                        item["answer"] = item["options"][answer_index]  # Replace index with actual text

            # Validate the quiz structure
            valid_quiz = [
                item for item in quiz if isinstance(item, dict) and
                all(k in item for k in ["question", "options", "answer"]) and
                isinstance(item["options"], list) and len(item["options"]) == 4 and
                item["answer"] in item["options"]
            ]

            if not valid_quiz:
                return jsonify({"error": "Generated quiz format is incorrect", "details": cleaned_response}), 500

            return jsonify({"quiz": valid_quiz}), 200

        except json.JSONDecodeError as e:
            return jsonify({"error": "Invalid JSON format from LLM", "details": f"Error: {e} - {cleaned_response}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def preprocess_text_for_quiz(text):
    """
    Preprocess text to improve its suitability for quiz generation.
    This function will clean the text and enhance it for better formatting.
    """
    # Remove unnecessary newlines or excessive whitespaces
    text = re.sub(r'\s+', ' ', text.strip())

    # Optionally, enhance the text with specific instructions for better content parsing.
    text = f"Here are the key concepts: {text[:1000]}..."  # Truncate the text if it's too long

    return text

def fix_json_format(response):
    """
    Attempt to fix common issues in the response, such as missing commas or extraneous characters.
    """
    # Simple heuristic to fix missing commas or other issues
    response = re.sub(r'(\{|\[)(\s*)([^\}\],\]]+)(\s*)(\}|\])', r'\1\3\5', response)  # Attempt to fix structure
    
    # Return the fixed response
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)
