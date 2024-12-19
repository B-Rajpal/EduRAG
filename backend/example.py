from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from langchain_ibm import WatsonxLLM, WatsonxEmbeddings
from ibm_watsonx_ai.foundation_models.utils.enums import EmbeddingTypes
from langchain.text_splitter import TokenTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)

load_dotenv()

class QueryRequest(BaseModel):
    query: str

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

credentials = {
    "name": "dummy",
    "description": "1st_key",
    "createdAt": "today",
    "apikey": os.getenv("API_KEY", None),
    "url": os.getenv("IBM_CLOUD_URL", 'https://eu-de.ml.cloud.ibm.com'),
    "project_id": os.getenv("PROJECT_ID", None)
}

parameters = {
    "decoding_method": "greedy",
    "max_new_tokens": 512,
    "repetition_penalty": 1
}
llm_model = WatsonxLLM(
    model_id='mistralai/mixtral-8x7b-instruct-v01',
    url=credentials.get("url"),
    apikey=credentials.get("apikey"),
    project_id=credentials.get("project_id"),
    params=parameters
)

embeddings = WatsonxEmbeddings(
    model_id=EmbeddingTypes.IBM_SLATE_30M_ENG.value,
    url=credentials["url"],
    apikey=credentials["apikey"],
    project_id=credentials['project_id']
)

loader = PyPDFLoader("sample_document_hr.pdf")
documents = loader.load()

text_splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=50)
texts = text_splitter.split_documents(documents)
db = FAISS.from_documents(texts, embeddings)

prompt_template = """Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Answer:"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "question"]
)

qa = RetrievalQA.from_chain_type(
    llm=llm_model,
    chain_type="stuff",
    retriever=db.as_retriever(),
    chain_type_kwargs={"prompt": PROMPT},
    return_source_documents=True
)

def rag_pipeline(query):
    result = qa({"query": query})
    answer = result['result']
    source_documents = result['source_documents']
    context = [doc.page_content for doc in source_documents]
    return {"answer": answer, "context": context}

@app.get("/", response_class=HTMLResponse)
async def get(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/query")
def query(request: QueryRequest):
    try:
        response = rag_pipeline(request.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if name == "main":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)