import React, { useState, useRef } from "react";
import socket from "../../utils/socket"; // Import socket connection
import "./videoCall.css";

const VideoCall = () => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const myVideo = useRef();
  const userVideo = useRef();
  const peerConnection = useRef(new RTCPeerConnection());

  const startVideo = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setStream(localStream);
    myVideo.current.srcObject = localStream;

    // Add local stream to peer connection
    localStream.getTracks().forEach((track) => peerConnection.current.addTrack(track, localStream));
  };

  const callUser = (userId) => {
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      userVideo.current.srcObject = event.streams[0];
    };

    peerConnection.current.createOffer().then((offer) => {
      peerConnection.current.setLocalDescription(offer);
      socket.emit("callUser", { offer, to: userId });
    });

    socket.on("callAccepted", ({ answer }) => {
      peerConnection.current.setRemoteDescription(answer);
    });
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <video playsInline muted ref={myVideo} autoPlay />
        <video playsInline ref={userVideo} autoPlay />
      </div>
      <button onClick={startVideo}>Start Video</button>
      <button onClick={() => callUser("target-user-id")}>Call User</button>
    </div>
  );
};

export default VideoCall;
