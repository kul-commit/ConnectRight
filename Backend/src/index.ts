import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager";
import cors from "cors";
import userRoutes from "./routes/users.routes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

const io = connectToSocket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 8000;

app.use("/api/v1/users", userRoutes);

const start = async () => {
  const connectDB = async () => {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in .env file");
      }

      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "ConnectRight",
      });

      console.log("Connected to MongoDB");
    } catch (err: any) {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    }
  };

  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

start();
