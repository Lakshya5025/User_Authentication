dotenv.config();
import express, {} from "express";
import * as dotenv from "dotenv";
import mongoose, { MongooseError } from "mongoose";
import bcrypt from "bcrypt";
import { userModel } from "./db.js";
import jwt from "jsonwebtoken";
const app = express();
app.use(express.json());
app.post("/signup", async (req, res) => {
    try {
        const { name, password } = req.body;
        if (!name || !password)
            return res.status(400).json({
                message: "name and password required",
            });
        const updatedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            name,
            password: updatedPassword,
        });
        await newUser.save();
        res.status(201).json({
            message: newUser,
        });
    }
    catch (e) {
        if (e instanceof MongooseError || e instanceof TypeError)
            console.log(e.message);
        console.log(e);
    }
});
app.post("/signin", async (req, res) => {
    if (!process.env.JWT_SECRET) {
        console.log("jwt secret not found in .env");
        process.exit(1);
    }
    try {
        const { name, password } = req.body;
        if (!name || !password)
            return res.status(400).json({
                message: "name and password required",
            });
        try {
            const findUser = await userModel.findOne({
                name,
            });
            if (findUser &&
                findUser.password &&
                (await bcrypt.compare(password, findUser.password))) {
                const token = jwt.sign({ _id: findUser._id }, process.env.JWT_SECRET, {
                    expiresIn: "1d",
                });
                res.status(200).json({
                    message: token,
                });
            }
        }
        catch (e) {
            if (e instanceof MongooseError) {
                return res.status(400).json({
                    message: "Server Error",
                });
            }
            console.log(e);
        }
    }
    catch (e) {
        console.log(e);
    }
});
async function auth(req, res, next) {
    if (!process.env.JWT_SECRET) {
        console.log("jwt secret not round");
        process.exit(1);
    }
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(402).json({
            message: "Unautharize",
        });
    }
    try {
        console.log(process.env.JWT_SECRET);
        const id = jwt.verify(token, process.env.JWT_SECRET);
        console.log(id);
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(402).json({
                message: "unautharize",
            });
        }
        //@ts-ignore
        req.userName = user.name;
        next();
    }
    catch (e) {
        if (e instanceof MongooseError) {
            console.log(e.message);
        }
        return res.json({
            message: "server error",
        });
    }
}
app.get("/protected", auth, (req, res) => {
    //@ts-ignore
    const username = req.userName;
    res.json({
        message: "You are autharize",
    });
});
(async () => {
    if (!process.env.MONGO_URL) {
        console.log("Mongodb url is not defined");
        process.exit(1);
    }
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database connected successfully");
        app.listen(3000, () => {
            console.log(`app is running on http://localhost:3000`);
        });
    }
    catch (e) {
        console.log(e);
    }
})();
//# sourceMappingURL=index.js.map