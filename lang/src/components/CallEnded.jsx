import React from "react";
import { useNavigate } from "react-router-dom";

function CallEnded() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>📴 Call Ended</h2>
      <button onClick={() => navigate("/home")} style={{ marginTop: "20px", padding: "10px 20px" }}>
        🔙 Back to Home
      </button>
    </div>
  );
}

export default CallEnded;
