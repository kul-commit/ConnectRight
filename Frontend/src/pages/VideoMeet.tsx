import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Badge, IconButton, TextField, Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import styles from "../styles/videoComponent.module.css";
import server from "../enviornment";

const server_url = server;

// Mapping socketId -> RTCPeerConnection
const connections: Record<string, RTCPeerConnection> = {};

const peerConfigConnections: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

interface VideoStream {
  socketId: string;
  stream: MediaStream;
  autoplay?: boolean;
  playsinline?: boolean;
}

interface ChatMessage {
  sender: string;
  data: string;
}

export default function VideoMeetComponent() {
  const socketRef = useRef<Socket | null>(null);
  const socketIdRef = useRef<string>("");

  const localVideoref = useRef<HTMLVideoElement | null>(null);

  const [videoAvailable, setVideoAvailable] = useState<boolean>(true);
  const [audioAvailable, setAudioAvailable] = useState<boolean>(true);

  const [video, setVideo] = useState<boolean>(true);
  const [audio, setAudio] = useState<boolean>(true);

  const [screen, setScreen] = useState<boolean>(false);
  const [screenAvailable, setScreenAvailable] = useState<boolean>(false);

  const [showModal, setModal] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");

  const [newMessages, setNewMessages] = useState<number>(0);
  const [askForUsername, setAskForUsername] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");

  const videoRef = useRef<VideoStream[]>([]);
  const [videos, setVideos] = useState<VideoStream[]>([]);

  useEffect(() => {
    getPermissions();
  }, []);

  const getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setVideoAvailable(!!videoPermission);

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setAudioAvailable(!!audioPermission);

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          (window as any).localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const getUserMediaSuccess = (stream: MediaStream) => {
    try {
      (window as any).localStream
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
    } catch (e) {
      console.error(e);
    }

    (window as any).localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      const conn = connections[id];
      const localStream = (window as any).localStream;
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          conn.addTrack(track, localStream);
        });
      }

      conn.createOffer().then((description) => {
        conn.setLocalDescription(description).then(() => {
          socketRef.current?.emit(
            "signal",
            id,
            JSON.stringify({ sdp: conn.localDescription })
          );
        });
      });
    }
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video, audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e));
    } else {
      try {
        localVideoref.current?.srcObject &&
          (localVideoref.current.srcObject as MediaStream)
            .getTracks()
            .forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  const getDislayMediaSuccess = (stream: MediaStream) => {
    try {
      (window as any).localStream
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
    } catch (e) {
      console.log(e);
    }

    (window as any).localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      const conn = connections[id];
      const localStream = (window as any).localStream;
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          conn.addTrack(track, localStream);
        });
      }

      conn.createOffer().then((description) => {
        conn.setLocalDescription(description).then(() => {
          socketRef.current?.emit(
            "signal",
            id,
            JSON.stringify({ sdp: conn.localDescription })
          );
        });
      });
    }
  };

  const gotMessageFromServer = (fromId: string, message: string) => {
    const signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId].createAnswer().then((description) => {
                connections[fromId]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current?.emit(
                      "signal",
                      fromId,
                      JSON.stringify({
                        sdp: connections[fromId].localDescription,
                      })
                    );
                  });
              });
            }
          });
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch(console.error);
      }
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current?.id ?? "";

      socketRef.current?.on("chat-message", addMessage);

      socketRef.current?.on("user-left", (id: string) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current?.on("user-joined", (id: string, clients: string[]) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current?.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          connections[socketListId].ontrack = (event: RTCTrackEvent) => {
            const stream = event.streams[0];
            let videoExists = videoRef.current.find(
              (v) => v.socketId === socketListId
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              const newVideo: VideoStream = {
                socketId: socketListId,
                stream: stream,
                autoplay: true,
                playsinline: true,
              };
              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if ((window as any).localStream) {
            const localStream = (window as any).localStream;
            if (localStream) {
              localStream.getTracks().forEach((track: MediaStreamTrack) => {
                connections[socketListId].addTrack(track, localStream);
              });
            }
          }
        });
      });
    });
  };

  const handleVideo = () => setVideo(!video);
  const handleAudio = () => setAudio(!audio);

  useEffect(() => {
    if (screen !== undefined) getDislayMedia();
  }, [screen]);

  const handleScreen = () => setScreen(!screen);

  const handleEndCall = () => {
    try {
      localVideoref.current?.srcObject &&
        (localVideoref.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  const addMessage = (data: string, sender: string, socketIdSender: string) => {
    setMessages((prev) => [...prev, { sender, data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  const sendMessage = () => {
    socketRef.current?.emit("chat-message", message, username);
    setMessage("");
  };

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>Enter into Lobby </h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>
          <div>
            <video ref={localVideoref} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginBottom: "20px" }} key={index}>
                        <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>
                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your chat"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={999} color="warning">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
          ></video>

          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
