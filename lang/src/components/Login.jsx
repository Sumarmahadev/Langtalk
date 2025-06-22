import React, { useState } from "react";

function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:8000/login", {
	//	const res = await fetch(" https://metal-buckets-burn.loca.lt/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      if (data.user) {
        onLogin(data.user);
      } else {
        alert("Invalid username or password!");
      }
    } catch (err) {
      alert("Login failed!");
    }
  };

  return (
    <div style={{ padding: 50 }}>
      <h2>Login</h2>
      <input type="text" placeholder="Enter your username" value={name} onChange={(e) => setName(e.target.value)} />
      <br /><br />
      <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <br /><br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;