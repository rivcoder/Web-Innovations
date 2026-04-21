from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import database, ai_service
from datetime import datetime
import sqlite3

database.init_db()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestModel(BaseModel):
    prompt: str
    mode: str = "chat"
    personality: str = None
    mood: str = None

@app.post("/api/ai")
def ai_endpoint(req: RequestModel):
    # Get weak topics from DB
    conn = sqlite3.connect(database.DB_FILE)
    c = conn.cursor()
    c.execute("SELECT topic FROM weak_topics")
    weak_topics = [row[0] for row in c.fetchall()]
    conn.close()

    response = ai_service.generate_response(
        role="user",
        prompt=req.prompt,
        mode=req.mode,
        personality=req.personality,
        mood=req.mood,
        weak_topics=weak_topics
    )

    # Save to chat history
    conn = sqlite3.connect(database.DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO chat_history (role, message, timestamp) VALUES (?,?,?)",
              ("user", req.prompt, datetime.now().isoformat()))
    c.execute("INSERT INTO chat_history (role, message, timestamp) VALUES (?,?,?)",
              ("ai", response, datetime.now().isoformat()))
    conn.commit()
    conn.close()

    return {"response": response}

@app.get("/api/history")
def get_history():
    conn = sqlite3.connect(database.DB_FILE)
    c = conn.cursor()
    c.execute("SELECT role, message, timestamp FROM chat_history ORDER BY id ASC")
    data = [{"role": r, "message": m, "timestamp": t} for r, m, t in c.fetchall()]
    conn.close()
    return {"history": data}

@app.post("/api/mood")
def add_mood(mood: str, note: str = ""):
    conn = sqlite3.connect(database.DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO mood_journal (mood, note, date) VALUES (?,?,?)",
              (mood, note, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"status": "ok"}
