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

# Global variables to hold processed data
ollama_llm = None


def process_pdf(file_path, subject):
    """Process the PDF and update the vector store for a subject."""
    subject_folder = os.path.join(UPLOAD_FOLDER, subject)
    vector_store_file = os.path.join(subject_folder, "vector_store")
    os.makedirs(subject_folder, exist_ok=True)

    loader = PyPDFLoader(file_path)
    documents = loader.load()

    token_splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=50)
    embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
    texts = token_splitter.split_documents(documents)

    if os.path.exists(vector_store_file):
        vector_store = FAISS.load_local(vector_store_file, embedding_model)
    else:
        vector_store = FAISS()

    vector_store.add_documents(texts)
    vector_store.save_local(vector_store_file)


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
def upload_files():
    """Endpoint to upload and save multiple files under a subject folder."""
    subject = request.form.get('subject')  # Retrieve subject from form data
    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400

    files = request.files.getlist('files')
    if not files:
        return jsonify({"error": "No selected files"}), 400

    subject_folder = os.path.join(UPLOAD_FOLDER, subject)
    os.makedirs(subject_folder, exist_ok=True)

    file_paths = []
    for file in files:
        if file.filename:
            file_path = os.path.join(subject_folder, "uploaded_" + file.filename)
            file.save(file_path)
            file_paths.append(file_path)

    return jsonify({"message": "Files uploaded successfully", "filePaths": file_paths}), 200


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

    try:
        for file_path in file_paths:
            if os.path.exists(file_path):
                process_pdf(file_path, subject)
            else:
                return jsonify({"error": f"File not found: {file_path}"}), 400

        return jsonify({"message": "Files processed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/rag', methods=['POST'])
def rag_pipeline():
    """Endpoint to handle the RAG pipeline for queries."""
    data = request.get_json()
    query = data.get("query")
    subject = data.get("subject")

    if not query:
        return jsonify({"error": "Query is required"}), 400
    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    subject_folder = os.path.join(UPLOAD_FOLDER, subject)
    vector_store_file = os.path.join(subject_folder, "vector_store")

    if not os.path.exists(vector_store_file):
        return jsonify({"error": f"No data available for the subject '{subject}'."}), 400

    try:
        # Load vector store for the subject
        embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
        vector_store = FAISS.load_local(vector_store_file, embedding_model)

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


if __name__ == '__main__':
    app.run(debug=True, port=5000)
