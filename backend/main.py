from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from dotenv import load_dotenv
import json
import os

load_dotenv()  # Only needed locally

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://langtalk.netlify.app", "https://6857f6d42182a33772735a71--langtalk.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Define get_connection()
def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT"))
    )

# ✅ Models
class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class FriendRequest(BaseModel):
    from_user: str
    to_user: str

class AcceptRequest(BaseModel):
    from_user: str
    to_user: str

# ✅ WebSocket Connections
connections = {}

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket.accept()
    connections[username] = websocket
    print(f"✅ {username} connected")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            to_user = message.get("to")
            if to_user in connections:
                await connections[to_user].send_text(json.dumps(message))
    except WebSocketDisconnect:
        print(f"🔌 {username} disconnected")
        if username in connections:
            del connections[username]

# ✅ REST APIs
@app.post("/register")
def register(data: RegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username=%s", (data.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (data.username, data.password))
        conn.commit()
        return {"message": "User registered successfully"}
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
def login(data: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username=%s AND password=%s", (data.username, data.password))
        user = cursor.fetchone()
        if user:
            return {"user": user["username"], "id": user["id"]}
        raise HTTPException(status_code=401, detail="Invalid credentials")
    finally:
        cursor.close()
        conn.close()

# ✅ Other endpoints (friend request, get friends, etc.)
# Keep your remaining endpoints as-is...

