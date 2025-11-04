import * as dotenv from "dotenv";
dotenv.config();
import express, {} from "express";
import bcrypt from "bcrypt";
import mongoose, {} from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import { userModel } from "./db.js";
const app = express();
app.use(express.json());
if (!process.env.SESSION_SECRET)
    throw new Error("SESSION_SECRET missing");
if (!process.env.MONGO_URL)
    throw new Error("MONGO_URL missing");
const { MONGO_URL, SESSION_SECRET } = process.env;
await mongoose.connect(MONGO_URL);
console.log("Mongo connected");
app.use(session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // won’t save empty sessions – good
    store: MongoStore.create({
        client: mongoose.connection.getClient(),
        collectionName: "sessionIdStoredHere",
        ttl: 60 * 60 * 24,
    }),
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 },
}));
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email & password required" });
    const exists = await userModel.findOne({ email });
    if (exists)
        return res.status(409).json({ error: "Email already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ email, password: passwordHash });
    req.session.userId = user._id.toString();
    res.json({ ok: true, message: "Registered & logged in" });
});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    if (!user.password)
        return;
    const match = await bcrypt.compare(password, user.password);
    if (!match)
        return res.status(401).json({ error: "Invalid credentials" });
    req.session.userId = user._id.toString();
    res.json({ ok: true, message: "Logged in" });
});
app.get("/profile", async (req, res) => {
    if (!req.session.userId)
        return res.status(401).json({ error: "Not authenticated" });
    const user = await userModel.findById(req.session.userId).select("-password");
    res.json({ ok: true, user });
});
app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ ok: true, message: "Logged out" });
    });
});
app.get("/", (_req, res) => res.send("Server OK"));
app.listen(3000, () => console.log("http://localhost:3000"));
//# sourceMappingURL=index.js.map