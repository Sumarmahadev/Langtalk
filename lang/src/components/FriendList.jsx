import React, { useEffect, useState } from "react";

function FriendList({ currentUser }) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetch(`https://langtalk.onrender.com/friends/${currentUser}`)
      .then((res) => res.json())
      .then((data) => {
        setFriends(data);
      })
      .catch((err) => console.error("Failed to load friends:", err));
  }, [currentUser]);

  const startCall = async (friend) => {
    try {
 
      const res = await fetch("https://langtalk.onrender.com/start-call", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: currentUser,
          to: friend,
        }),
      });

      if (res.ok) {
        window.location.href = `/video?from=${friend}`;
      } else {
        const data = await res.json();
        alert("❌ Failed to call: " + data.detail);
      }
    } catch (err) {
      alert("❌ Error making call");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>👥 Your Friends</h2>
      {friends.length === 0 ? (
        <p>No friends yet. Start by adding some!</p>
      ) : (
        friends.map((friend) => (
          <div key={friend} style={{ margin: "10px 0", padding: "10px", borderBottom: "1px solid #ccc" }}>
            <span style={{ marginRight: "10px" }}>{friend}</span>
            <button onClick={() => startCall(friend)}>📞 Start Call</button>
          </div>
        ))
      )}
    </div>
  );
}

export default FriendList;
