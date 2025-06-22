import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function Video({ currentUser, friend, isCaller }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const localStream = useRef(null);
  const ringtone = useRef(new Audio("/ringtone.mp3"));
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);

  useEffect(() => {
    //socket.current = new WebSocket(`ws://localhost:8000/ws/${currentUser}`);
    // 1. Setup WebSocket
   // socket.current = new WebSocket(`ws://langtalk.onrender.com/ws/${currentUser}`);
    socket.current = new WebSocket(`wss://langtalk.onrender.com/ws/${currentUser}`);


    // 2. Setup WebRTC
    peerConnection.current = new RTCPeerConnection();
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.send(
          JSON.stringify({
            type: "ice",
            to: friend,
            from: currentUser,
            candidate: event.candidate,
          })
        );
      }
    };

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    socket.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("📥 Message received:", message);

      switch (message.type) {
        case "offer":
          ringtone.current.play();
          setIncomingCall(message);
          break;

        case "answer":
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
          break;

        case "ice":
          if (message.candidate) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(message.candidate)
            );
          }
          break;

        case "hangup":
          handleHangUp(true);
          break;

        case "incoming_call":
          if (!isCaller) {
            startCall();
          }
          break;

        default:
          console.warn("Unhandled message type:", message.type);
      }
    };

    if (isCaller) {
      startCall();
    }

    return () => cleanup();
  }, []);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.current.send(
        JSON.stringify({
          type: "offer",
          offer,
          to: friend,
          from: currentUser,
        })
      );
    } catch (err) {
      console.error("Failed to start call:", err);
    }
  };

  const acceptCall = async () => {
    ringtone.current.pause();
    setCallAccepted(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });

    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.current.send(
      JSON.stringify({
        type: "answer",
        answer,
        to: incomingCall.from,
        from: currentUser,
      })
    );
  };

  const rejectCall = () => {
    ringtone.current.pause();
    setIncomingCall(null);
  };

  const handleHangUp = (isRemote = false) => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection.current) peerConnection.current.close();

    if (!isRemote && socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          type: "hangup",
          from: currentUser,
          to: friend,
        })
      );
    }

    //fetch("http://localhost:8000/end-call", {
	fetch(" https://langtalk.onrender.com/end-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: currentUser, to: friend }),
    });

    setTimeout(() => {
      if (socket.current) socket.current.close();
      navigate("/call-ended");
    }, 300);
  };

  const cleanup = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) peerConnection.current.close();
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.close();
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      {incomingCall && !callAccepted ? (
        <div>
          <h2>📞 Incoming Call from {incomingCall.from}</h2>
          <button onClick={acceptCall}>✅ Accept</button>
          <button onClick={rejectCall}>❌ Reject</button>
        </div>
      ) : (
        <>
          <h2>📹 Video Call Between {currentUser} and {friend}</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "45%" }} />
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "45%" }} />
          </div>
          <button onClick={() => handleHangUp(false)} style={{ marginTop: "20px", padding: "10px 20px" }}>
            🔴 Hang Up
          </button>
        </>
      )}
    </div>
  );
}

export default Video;
