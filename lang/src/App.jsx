import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import pic from './img/videolog.jpg';
import Main2 from './components/Main2';
import Logout from './components/Logout';
import Video from './components/Video';
import Login from './components/Login';
import Register from './components/Register';
import AddFriend from './components/Addfriend';
import Notifications from './components/Notifications';
import FriendList from './components/FriendList';
import { useState, useEffect, useRef } from 'react';
import CallEnded from './components/CallEnded';


function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const socketRef = useRef(null);

  // Check localStorage for user on load
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setUser(username);
    }
  }, []);

  // Setup WebSocket after login
  useEffect(() => {
    if (user && !socketRef.current) {
      //const ws = new WebSocket(`ws://langtalk.onrender.com/ws/${user}`);
      const ws = new WebSocket(`wss://langtalk.onrender.com/ws/${user}`);

      socketRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // 🎯 Handle incoming video call
          if (message.type === "incoming_call") {
            const caller = message.from;
            const accept = window.confirm(`📞 Incoming video call from ${caller}. Accept?`);

            if (accept) {
              window.location.href = `/video?from=${caller}`;
            }
          } else {
            alert(event.data); // for friend request or other plain messages
          }
        } catch (e) {
          console.log("🟡 Non-JSON message:", event.data);
          alert(event.data);
        }
      };

      ws.onclose = () => {
        console.log("❌ WebSocket closed");
        socketRef.current = null;
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    }
  }, [user]);

  // If not logged in
  if (!user) {
    return showRegister ? (
      <Register onRegister={() => setShowRegister(false)} />
    ) : (
      <>
        <Login
          onLogin={(username) => {
            setUser(username);
            localStorage.setItem("username", username);
          }}
        />
        <p style={{ textAlign: "center" }}>
          Don't have an account?{" "}
          <button onClick={() => setShowRegister(true)}>Register</button>
        </p>
      </>
    );
  }

  const friend = new URLSearchParams(window.location.search).get('from');

  return (
    <>
      {/* Top Header */}
      <div
        className="header"
        style={{
          border: '2px solid white',
          height: '90px',
          display: 'flex',
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        }}
      >
        <img
          style={{
            width: '100px',
            height: '100px',
            marginTop: '20px',
            borderRadius: '50%',
            marginLeft: "40px"
          }}
          src={pic}
          alt="logo"
        />
        <div
          style={{
            marginLeft: 'auto',
            marginRight: '50px',
            marginTop: '65px',
            fontSize: '30px'
          }}
        >
          <a
            style={{ textDecoration: 'none', fontWeight: 'bold', color: 'black' }}
            href="#"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* App Routing */}
      <Routes>
        <Route path="/" element={<Navbar />}>
          <Route index element={<Main2 />} />
          <Route path="video" element={<Video currentUser={user} friend={friend} />} />
          <Route path="logout" element={<Logout />} />
          <Route path="add-friend" element={<AddFriend currentUser={user} />} />
          <Route path="notifications" element={<Notifications currentUser={user} />} />
          <Route path="friends" element={<FriendList currentUser={user} />} />
          <Route path="/call-ended" element={<CallEnded />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
