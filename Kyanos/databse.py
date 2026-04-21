import sqlite3
from datetime import datetime

DB_FILE = "kyanos.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Chat history
    c.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT,
        message TEXT,
        timestamp TEXT
    )
    """)
    # Weak topics tracking
    c.execute("""
    CREATE TABLE IF NOT EXISTS weak_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT,
        score INTEGER,
        last_seen TEXT
    )
    """)
    # Mood journal
    c.execute("""
    CREATE TABLE IF NOT EXISTS mood_journal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood TEXT,
        note TEXT,
        date TEXT
    )
    """)
    conn.commit()
    conn.close()
