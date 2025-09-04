import { Request, Response } from "express";
import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const login = async (req: Request, res: Response): Promise<Response> => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide username and password" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(httpStatus.OK).json({ token });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: `Something went wrong: ${err.message}` });
    }
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An unknown error occurred" });
  }
};

const register = async (req: Request, res: Response): Promise<Response> => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: `Something went wrong: ${err.message}` });
    }
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An unknown error occurred" });
  }
};

export { login, register };
