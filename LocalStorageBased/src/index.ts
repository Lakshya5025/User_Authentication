import * as dotenv from "dotenv";
dotenv.config();

import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import mongoose, { MongooseError } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { userModel } from "./db.js";

const app = express();
app.use(express.json());

declare module "express-serve-static-core" {
  interface Request {
    userName?: string;
  }
}
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 10);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not defined in env");
}

app.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body as { name?: string; password?: string };

    if (!name || !password) {
      return res.status(400).json({ message: "name and password required" });
    }

    const existing = await userModel.findOne({ name }).lean();
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new userModel({ name, password: hashed });
    await newUser.save();

    const safeUser = { _id: newUser._id, name: newUser.name };

    return res.status(201).json({ user: safeUser });
  } catch (e) {
    console.error("Signup error:", e instanceof Error ? e.message : e);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/signin", async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body as { name?: string; password?: string };
    if (!name || !password) {
      return res.status(400).json({ message: "name and password required" });
    }

    const findUser = await userModel.findOne({ name });
    if (!findUser || !findUser.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, findUser.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ _id: findUser._id.toString() }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({ token });
  } catch (e) {
    console.error("Signin error:", e instanceof Error ? e.message : e);
    return res.status(500).json({ message: "Server error" });
  }
});

async function auth(req: Request, res: Response, next: NextFunction) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not defined in env");
  }
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - token missing" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload | string;

    const userId =
      typeof payload === "string" ? undefined : (payload as any)._id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized - invalid token payload" });
    }

    const user = await userModel.findById(userId).lean();
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - user not found" });
    }
    if (!user.name) return;

    req.userName = user.name;
    next();
  } catch (e) {
    console.error("Auth error:", e instanceof Error ? e.message : e);
    return res
      .status(401)
      .json({ message: "Unauthorized - token invalid or expired" });
  }
}

app.get("/protected", auth, (req: Request, res: Response) => {
  const username = req.userName ?? "unknown";
  return res.json({ message: `You are authorized as ${username}` });
});

(async () => {
  const MONGO_URL = process.env.MONGO_URL;
  if (!MONGO_URL) throw new Error("MONGO_URL not defined");

  try {
    await mongoose.connect(MONGO_URL);
    console.log("Database connected successfully");
    app.listen(3000, () => {
      console.log(`app is running on http://localhost:3000`);
    });
  } catch (e) {
    console.error("Startup error:", e);
    process.exit(1);
  }
})();
