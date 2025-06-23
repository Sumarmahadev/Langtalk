import React, { useEffect, useState } from "react";

function AddFriend({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    //fetch(`http://localhost:8000/available-users/${currentUser}`)
	//fetch(` https://metal-buckets-burn.loca.lt/available-users/${currentUser}`)
    fetch(`https://langtalk.onrender.com/available-users/${currentUser}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Available users:", data);
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        setLoading(false);
      });
  }, [currentUser]);

  const sendRequest = async (to_user) => {
    console.log("Sending friend request from:", currentUser, "to:", to_user);
    try {
      //const res = await fetch("http://localhost:8000/friend-request", {
	//const res = await fetch(" https://metal-buckets-burn.loca.lt/friend-request", {
      const res = await fetch("https://langtalk.onrender.com/friend-request", 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_user: currentUser, to_user }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        alert("❌ Error: " + responseData.detail);
      } else {
        alert("✅ Friend request sent to " + to_user);
      }
    } catch (err) {
      console.error("Request failed:", err);
      alert("❌ Error sending friend request");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>👥 Add Friends</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users
              .filter((user) => user.username !== currentUser)
              .map((user) => (
                <div
                  key={user.username}
                  style={{
                    margin: "10px 0",
                    padding: "10px",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>{user.username}</span>
                  <button onClick={() => sendRequest(user.username)}>
                    ➕ Add Friend
                  </button>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}

export default AddFriend;
