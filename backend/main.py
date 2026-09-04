from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from rag.retriever import search, build_context
from rag.generator import generate_answer


app = FastAPI(title="PersonalBot")


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://siddbot.onrender.com/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# CHAT MODELS
# --------------------------------------------------

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[Message] = Field(default_factory=list)


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "PersonalBot is running!"
    }


# --------------------------------------------------
# CHAT
# --------------------------------------------------

@app.post("/chat")
def chat(request: ChatRequest):

    # --------------------------------------------------
    # 1. SEARCH FOR RELEVANT INFORMATION
    # --------------------------------------------------

    results = search(
        request.question
    )

    # --------------------------------------------------
    # 2. BUILD CONTEXT
    # --------------------------------------------------

    context = build_context(
        results
    )

    # --------------------------------------------------
    # 3. CONVERT PYDANTIC HISTORY TO DICTIONARIES
    # --------------------------------------------------

    history = [
        message.model_dump()
        for message in request.history
    ]

    # --------------------------------------------------
    # 4. CREATE LLM STREAM
    # --------------------------------------------------

    answer_stream = generate_answer(
        question=request.question,
        context=context,
        history=history
    )

    # --------------------------------------------------
    # 5. STREAM RESPONSE TO CLIENT
    # --------------------------------------------------

    return StreamingResponse(
        answer_stream,
        media_type="text/plain"
    )