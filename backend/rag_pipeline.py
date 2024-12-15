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

# Flask app setup
app = Flask(__name__)
CORS(app)

# Define the directory to save uploaded files
UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variables to hold processed data
vector_store = None

def process_pdf(file_path):
    """Process the PDF and update the global vector store."""
    global vector_store
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    token_splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=50)
    embedding_model = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
    texts = token_splitter.split_documents(documents)

    vector_store = FAISS.from_documents(texts, embedding=embedding_model)

# Define a custom LLM wrapper for Ollama to integrate with LangChain
class OllamaLLM(LLM, BaseModel):
    model_name: str  # Explicitly declare the model_name field

    def _call(self, prompt: str, stop=None):
        response = ollama.generate(model=self.model_name, prompt=prompt)
        print(response)
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

@app.route('/upload', methods=['POST'])
def upload_file():
    """Endpoint to upload and save the file."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, "uploaded_" + file.filename)
    file.save(file_path)

    return jsonify({"message": "File uploaded successfully", "filePath": file_path}), 200

@app.route('/chunk', methods=['POST'])
def chunk_file():
    """Endpoint to process the uploaded file into chunks."""
    data = request.get_json()
    file_path = data.get("filePath")

    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid or missing file path"}), 400

    try:
        process_pdf(file_path)
        return jsonify({"message": "File processed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag', methods=['POST'])
def rag_pipeline():
    """Endpoint to handle the RAG pipeline for queries."""
    global vector_store

    if vector_store is None:
        return jsonify({"error": "Vector store is not initialized. Please process a file first."}), 400

    data = request.get_json()
    query = data.get("query")

    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        # Initialize the Ollama model using the custom LLM wrapper
        ollama_llm = OllamaLLM(model_name="llama3.2")

        # Define the RetrievalQA chain
        qa = RetrievalQA.from_chain_type(
            llm=ollama_llm,
            chain_type="stuff",
            retriever=vector_store.as_retriever(),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )

        result = qa({"query": query})
        answer = result['result']
        source_documents = result['source_documents']
        context = [doc.page_content for doc in source_documents]

        return jsonify({"answer": answer, "context": context}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
