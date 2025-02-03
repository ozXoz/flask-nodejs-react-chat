// src/chat/videoCall/VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import socket from "../utils/socket"; // Adjust path
import "./videoCall.css";
import CONFIG from "../utils/config"; // Import our dynamic config

const VideoCall = ({ currentUser, targetUser, onCloseCall }) => {
  const [callState, setCallState] = useState("idle"); // "idle" | "calling" | "incoming" | "in-call"

  // Keep a record of the local/remote streams in state (so we can show them in UI)
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // For toggling mic/camera
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // A simple STUN server (add TURN in production)
  const iceServers = {
    iceServers: [{ urls: "stun:stun1.l.google.com:19302" }],
  };

  // On mount, join call
  useEffect(() => {
    socket.emit("joinCall", currentUser);

    // Socket event handlers
    socket.on("callMade", handleIncomingCall);
    socket.on("callAnswered", handleCallAnswered);
    socket.on("iceCandidate", handleRemoteICECandidate);
    socket.on("callEnded", handleCallEnded);

    return () => {
      socket.off("callMade", handleIncomingCall);
      socket.off("callAnswered", handleCallAnswered);
      socket.off("iceCandidate", handleRemoteICECandidate);
      socket.off("callEnded", handleCallEnded);
    };
  }, [currentUser]);

  /** =====================================
   *  CREATE RTCPeerConnection
   * ===================================== */
  const createPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    const pc = new RTCPeerConnection(iceServers);

    // Listen for remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    // Send our ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          candidate: event.candidate,
          from: currentUser,
          to: targetUser,
        });
      }
    };

    peerConnectionRef.current = pc;
  };

  /** =====================================
   *  START LOCAL STREAM (returns the MediaStream)
   * ===================================== */
  const startLocalStream = async (audioOnly = false) => {
    try {
      const constraints = audioOnly
        ? { audio: true, video: false }
        : { audio: true, video: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Show in local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      // Also store in state (optional, for toggling mic/video in UI)
      setLocalStream(stream);

      return stream; // IMPORTANT: we return it so we can add tracks immediately
    } catch (err) {
      console.error("[startLocalStream] error:", err);
      alert("Could not access camera/microphone. Check permissions.");
      return null;
    }
  };

  /** =====================================
   *  CALL USER (Caller Flow)
   * ===================================== */
  const callUser = async (audioOnly = false) => {
    if (!currentUser || !targetUser) return;
    setCallState("calling");

    // 1) Create peer connection
    createPeerConnection();

    // 2) Start (or re-use) local stream
    let stream = localStream;
    if (!stream) {
      // If we haven't started local stream yet
      stream = await startLocalStream(audioOnly);
    }
    if (!stream) return; // if user denied permissions

    // 3) Add local tracks directly using the returned stream
    stream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, stream);
    });

    // 4) Create offer + setLocalDescription
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    // 5) Send offer to target
    socket.emit("callUser", {
      offer,
      from: currentUser,
      to: targetUser,
    });
  };

  /** =====================================
   *  HANDLE INCOMING CALL (Callee Flow)
   * ===================================== */
  const handleIncomingCall = async ({ offer, from }) => {
    if (callState !== "idle") {
      // Already in a call or calling
      return;
    }
    setCallState("incoming");

    // Prompt accept/reject
    const accept = window.confirm(`Incoming call from ${from}. Accept?`);
    if (!accept) {
      console.log("User rejected the call");
      setCallState("idle");
      return;
    }
    // Accept
    setCallState("in-call");

    // 1) Create PC
    createPeerConnection();

    // 2) Start local stream if not done
    let stream = localStream;
    if (!stream) {
      stream = await startLocalStream(false);
    }
    if (!stream) return;

    // 3) Set remote description (the caller's offer)
    await peerConnectionRef.current.setRemoteDescription(offer);

    // 4) Add local tracks
    stream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, stream);
    });

    // 5) Create answer
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    // 6) Send answer back to caller
    socket.emit("answerCall", {
      answer,
      from: currentUser,
      to: from,
    });
  };

  /** =====================================
   *  CALLER RECEIVES ANSWER
   * ===================================== */
  const handleCallAnswered = async ({ answer, from }) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(answer);
    setCallState("in-call");
  };

  /** =====================================
   *  EXCHANGE ICE CANDIDATES
   * ===================================== */
  const handleRemoteICECandidate = async ({ candidate, from }) => {
    if (!candidate || !peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (err) {
      console.error("[handleRemoteICECandidate] error:", err);
    }
  };

  /** =====================================
   *  TOGGLE AUDIO / VIDEO
   * ===================================== */
  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  /** =====================================
   *  END CALL
   * ===================================== */
  const endCall = () => {
    // Notify remote side to end
    socket.emit("endCall", {
      from: currentUser,
      to: targetUser,
    });
    cleanupCall();
  };

  const handleCallEnded = ({ from }) => {
    console.log("Call ended by", from);
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    if (onCloseCall) onCloseCall();
  };

  // RENDER
  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        <h3>Video/Audio Call - {callState.toUpperCase()}</h3>

        <div className="videos">
          {/* local video preview */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
          {/* remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        </div>

        <div className="controls">
          {callState === "idle" && (
            <>
              <button onClick={() => callUser(false)}>Start Video Call</button>
              <button onClick={() => callUser(true)}>Start Audio Call</button>
            </>
          )}

          {callState === "calling" && <p>Calling {targetUser} ...</p>}

          {(callState === "calling" || callState === "in-call") && (
            <>
              <button onClick={toggleMic}>
                {micEnabled ? "Mute Mic" : "Unmute Mic"}
              </button>
              <button
                onClick={toggleVideo}
                disabled={
                  !localStream || localStream.getVideoTracks().length === 0
                }
              >
                {videoEnabled ? "Stop Video" : "Start Video"}
              </button>
              <button onClick={endCall}>End Call</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
