import { Server as HTTPServer } from "http";
import { Server, ServerOptions, Socket } from "socket.io";

type ChatMessage = {
  sender: string;
  data: string;
  "socket-id-sender": string;
};

let connections: Record<string, string[]> = {}; // room -> list of socket ids
let messages: Record<string, ChatMessage[]> = {}; // room -> chat history
let timeOnline: Record<string, Date> = {}; // socket.id -> join time

export const connectToSocket = (
  server: HTTPServer,
  options?: Partial<ServerOptions>
) => {
  const io = new Server(server, options);

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // User joins a call/room
    socket.on("join-call", (path: string) => {
      socket.join(path); // join a real Socket.IO room
      socket.data.path = path; // remember room on this socket

      if (!connections[path]) connections[path] = [];
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      console.log(`👥 ${socket.id} joined room ${path}`);

      // Notify everyone else in the room
      socket.to(path).emit("user-joined", socket.id, connections[path]);

      // Send chat history to the joining user
      if (messages[path]) {
        messages[path].forEach((msg) => {
          socket.emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    // WebRTC signaling messages (relay only)
    socket.on("signal", (toId: string, message: any) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Chat messages
    socket.on("chat-message", (data: string, sender: string) => {
      const path = socket.data.path;
      if (!path) return; // not in a room

      if (!messages[path]) messages[path] = [];

      const chatMsg: ChatMessage = {
        sender,
        data,
        "socket-id-sender": socket.id,
      };

      messages[path].push(chatMsg);

      // Optional: limit stored messages to last 200
      if (messages[path].length > 200) {
        messages[path].shift();
      }

      // Broadcast to everyone in the room (including sender)
      io.to(path).emit("chat-message", data, sender, socket.id);
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      const path = socket.data.path;
      if (!path) return;

      console.log(`User disconnected: ${socket.id}`);

      // Remove from room connections
      connections[path] = connections[path].filter((id) => id !== socket.id);

      // Notify remaining users
      socket.to(path).emit("user-left", socket.id);

      // Clean up empty room
      if (connections[path].length === 0) {
        delete connections[path];
        delete messages[path];
      }

      delete timeOnline[socket.id];
    });
  });

  return io;
};
