from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import json

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MySQL Connection

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="boss",
        database="videocallapp"
    )

# Models
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

# Global connections store
connections = {}

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket.accept()
    connections[username] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                to_user = message.get("to")
                if to_user and to_user in connections:
                    await connections[to_user].send_text(json.dumps(message))
            except Exception as e:
                print("Invalid message format:", data, e)
    except WebSocketDisconnect:
        print(f"🔌 {username} disconnected")
        del connections[username]

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

@app.get("/available-users/{username}")
def get_available_users(username: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = result["id"]

        cursor.execute("""
            SELECT 
                CASE 
                    WHEN from_user_id = %s THEN to_user_id 
                    ELSE from_user_id 
                END as friend_id
            FROM friends
            WHERE from_user_id = %s OR to_user_id = %s
        """, (user_id, user_id, user_id))

        friend_ids = [row["friend_id"] for row in cursor.fetchall()]
        friend_ids.append(user_id)

        if friend_ids:
            format_strings = ','.join(['%s'] * len(friend_ids))
            cursor.execute(f"SELECT username FROM users WHERE id NOT IN ({format_strings})", tuple(friend_ids))
        else:
            cursor.execute("SELECT username FROM users")

        available_users = cursor.fetchall()
        return available_users
    finally:
        cursor.close()
        conn.close()

@app.post("/friend-request")
async def send_request(req: FriendRequest):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE username=%s", (req.from_user,))
        sender = cursor.fetchone()
        cursor.execute("SELECT id FROM users WHERE username=%s", (req.to_user,))
        receiver = cursor.fetchone()

        if not sender or not receiver:
            raise HTTPException(status_code=404, detail="User(s) not found")

        cursor.execute("""
            INSERT INTO friend_requests (from_user_id, to_user_id)
            VALUES (%s, %s)
        """, (sender['id'], receiver['id']))
        conn.commit()

        if req.to_user in connections:
            try:
                await connections[req.to_user].send_text(f"🔔 Friend request from {req.from_user}")
            except Exception as e:
                print(f"Error sending WebSocket message: {e}")

        return {"message": "Friend request sent"}
    finally:
        cursor.close()
        conn.close()

@app.get("/friends/{username}")
async def get_friends(username: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user["id"]

        cursor.execute("""
            SELECT DISTINCT u.username
            FROM friend_requests fr
            JOIN users u ON (
                (fr.from_user_id = u.id AND fr.to_user_id = %s)
                OR (fr.to_user_id = u.id AND fr.from_user_id = %s)
            )
            WHERE fr.status = 'accepted' AND u.id != %s
        """, (user_id, user_id, user_id))

        friends = cursor.fetchall()
        return [f["username"] for f in friends]
    finally:
        cursor.close()
        conn.close()

@app.post("/accept-request")
async def accept_request(data: AcceptRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username=%s", (data.from_user,))
        from_user = cursor.fetchone()
        cursor.execute("SELECT id FROM users WHERE username=%s", (data.to_user,))
        to_user = cursor.fetchone()

        if not from_user or not to_user:
            raise HTTPException(status_code=404, detail="User(s) not found")

        cursor.execute("""
            UPDATE friend_requests
            SET status='accepted'
            WHERE from_user_id=%s AND to_user_id=%s
        """, (from_user[0], to_user[0]))
        conn.commit()
        return {"message": "Friend request accepted"}
    finally:
        cursor.close()
        conn.close()

@app.get("/friend-requests/{username}")
async def get_friend_requests(username: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute("""
            SELECT u.username AS from_user
            FROM friend_requests fr
            JOIN users u ON fr.from_user_id = u.id
            WHERE fr.to_user_id = %s AND fr.status = 'pending'
        """, (user['id'],))
        requests = cursor.fetchall()
        return [r["from_user"] for r in requests]
    finally:
        cursor.close()
        conn.close()

@app.post("/start-call")
async def start_video_call(request: Request):
    data = await request.json()
    from_user = data.get("from")
    to_user = data.get("to")

    if not from_user or not to_user:
        raise HTTPException(status_code=400, detail="Missing 'from' or 'to'")

    if to_user in connections:
        try:
            await connections[to_user].send_text(
                json.dumps({
                    "type": "incoming_call",
                    "from": from_user
                })
            )
            return {"message": "Call initiated"}
        except Exception as e:
            print(f"WebSocket error: {e}")
            raise HTTPException(status_code=500, detail="Failed to send call notification")
    else:
        raise HTTPException(status_code=404, detail=f"{to_user} is not online")
