import React, { useEffect, useState } from "react";

function FriendList({ currentUser }) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
<<<<<<< HEAD
    fetch(`http://localhost:8000/friends/${currentUser}`)
	//fetch(` https://metal-buckets-burn.loca.lt/friends/${currentUser}`)
=======
    fetch(`https://langtalk.onrender.com/friends/${currentUser}`)
>>>>>>> 785191aab9744e6b93c17f84774dfba6f38a4432
      .then((res) => res.json())
      .then((data) => {
        setFriends(data);
      })
      .catch((err) => console.error("Failed to load friends:", err));
  }, [currentUser]);

  const startCall = async (friend) => {
    try {
<<<<<<< HEAD
      const res = await fetch("http://localhost:8000/start-call", {
	//	  const res = await fetch(" https://metal-buckets-burn.loca.lt/start-call", {
=======
 
      const res = await fetch("https://langtalk.onrender.com/start-call", {

>>>>>>> 785191aab9744e6b93c17f84774dfba6f38a4432
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
