import os
import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import AsyncIterable

# LangGraph & Gemini Imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing import Annotated
from typing_extensions import TypedDict

# 1. Load API Key
load_dotenv()
if "GOOGLE_API_KEY" not in os.environ:
    raise ValueError("GOOGLE_API_KEY not found in .env")

# 2. Setup LangGraph Agent
class State(TypedDict):
    messages: Annotated[list, add_messages]

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", streaming=True)

# --- FIX START: Change to async def and use await llm.ainvoke ---
async def chatbot_node(state: State):
    # Use 'ainvoke' (async invoke) so it doesn't block the stream
    response = await llm.ainvoke(state["messages"])
    return {"messages": [response]}
# --- FIX END ---

graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot_node)
graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("chatbot", END)
graph = graph_builder.compile()

# 3. Setup FastAPI Server
app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    history: list = []

# Generator function for streaming
async def generate_response(user_message: str) -> AsyncIterable[str]:
    # Stream events from LangGraph
    async for event in graph.astream_events(
        {"messages": [("user", user_message)]}, 
        version="v1"
    ):
        kind = event["event"]
        
        # Check if this is a streaming token event
        if kind == "on_chat_model_stream":
            # Extract content
            chunk = event["data"]["chunk"]
            if chunk.content:
                # OPTIONAL: Print to terminal to verify it's working
                print(chunk.content, end="|", flush=True) 
                yield chunk.content

@app.post("/stream_chat")
async def stream_chat(request: ChatRequest):
    return StreamingResponse(
        generate_response(request.message), 
        media_type="text/plain"
    )

if __name__ == "__main__":
    print("UniConnect Chatbot Server running on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)