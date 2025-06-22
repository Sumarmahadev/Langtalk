import React, { useEffect, useState } from "react";

function Notifications({ currentUser }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8000/friend-requests/${currentUser}`)
	//fetch(` https://metal-buckets-burn.loca.lt/friend-requests/${currentUser}`)
      .then((res) => res.json())
      .then((data) => setRequests(data));
  }, [currentUser]);

  const acceptRequest = async (fromUser) => {
    const res = await fetch("http://localhost:8000/accept-request", {
    // const res = await fetch(" https://metal-buckets-burn.loca.lt/accept-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user: fromUser, to_user: currentUser }),
    });

    const result = await res.json();
    if (res.ok) {
      alert(`✅ Accepted friend request from ${fromUser}`);
      setRequests((prev) => prev.filter((user) => user !== fromUser));
    } else {
      alert("❌ " + result.detail);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔔 Friend Requests</h2>
      {requests.length === 0 ? (
        <p>No new friend requests</p>
      ) : (
        requests.map((user) => (
          <div key={user} style={{ marginBottom: "10px" }}>
            {user}
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => acceptRequest(user)}
            >
              ✅ Accept
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;
