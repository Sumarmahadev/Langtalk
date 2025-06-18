import React, { useEffect, useRef } from "react";

function Video({ currentUser, friend }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    // 1. Setup WebSocket
    socket.current = new WebSocket(`ws://localhost:8000/ws/${currentUser}`);

    // 2. Setup WebRTC
    peerConnection.current = new RTCPeerConnection();

    // 3. Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.send(JSON.stringify({
          type: "ice",
          to: friend,
          from: currentUser,
          candidate: event.candidate,
        }));
      }
    };

    // 4. Handle remote stream
    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // 5. Get local media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // If caller, create offer
        if (currentUser < friend) {
          peerConnection.current.createOffer()
            .then(offer => peerConnection.current.setLocalDescription(offer))
            .then(() => {
              socket.current.send(JSON.stringify({
                type: "offer",
                offer: peerConnection.current.localDescription,
                to: friend,
                from: currentUser
              }));
            });
        }
      })
      .catch((err) => {
        console.error("⚠️ getUserMedia failed:", err);
        alert("⚠️ Please allow camera and mic access.");
      });

    // 6. Handle incoming socket messages
    socket.current.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "offer") {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(msg.offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.current.send(JSON.stringify({
          type: "answer",
          answer,
          to: msg.from,
          from: currentUser
        }));
      }

      if (msg.type === "answer") {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(msg.answer));
      }

      if (msg.type === "ice" && msg.candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
      }

      if (msg.type === "hangup") {
        // Cleanup on receiving hangup
        if (localVideoRef.current?.srcObject) {
          localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
          localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current?.srcObject) {
          remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
          remoteVideoRef.current.srcObject = null;
        }
        if (peerConnection.current) {
          peerConnection.current.close();
          peerConnection.current = null;
        }
        alert(`📴 ${msg.from} ended the call`);
      }
    };

    return () => {
      // Cleanup on component unmount
      if (peerConnection.current) peerConnection.current.close();
      if (socket.current) socket.current.close();
    };
  }, [currentUser, friend]);

  const handleHangUp = () => {
    // 1. Stop local stream
    const stream = localVideoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }

    // 2. Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // 3. Send hang-up message
    if (socket.current) {
      socket.current.send(JSON.stringify({
        type: "hangup",
        to: friend,
        from: currentUser
      }));
    }

    // 4. Clear remote stream
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }

    alert("📞 Call ended");
  };

  return (
    <div>
      <h2>📹 Video Call Between {currentUser} and {friend}</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <video ref={localVideoRef} autoPlay muted style={{ width: '45%' }} />
        <video ref={remoteVideoRef} autoPlay style={{ width: '45%' }} />
      </div>
      <button onClick={handleHangUp} style={{ padding: '10px 20px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px' }}>
        📴 Hang Up
      </button>
    </div>
  );
}

export default Video;
