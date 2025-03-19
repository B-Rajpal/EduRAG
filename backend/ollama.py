from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_ngrok import run_with_ngrok  # Ngrok for Colab
import os
import json
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
import ollama
print(dir(ollama))
# Initialize Flask App
app = Flask(__name__)
run_with_ngrok(app)  # Enable Ngrok for public access
CORS(app)

UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variables
ollama_llm = None
vector_stores = {}

# Custom LLM Wrapper
class OllamaLLM(LLM, BaseModel):
    model_name: str  # Explicitly declare the model_name field

    def _call(self, prompt: str, stop=None):
        response = ollama.generate(model=self.model_name, prompt=prompt)
        return response["response"]

    @property
    def _llm_type(self):
        return "ollama"

@app.route('/')
def home():
    return jsonify({"message": "AI Classroom Platform is Running on Colab!"})

if __name__ == '__main__':
    app.run()
