import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import path from "path";
import questionsRoute from "./routes/questions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
// Use environment variable for frontend URL in production
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Questions API
app.use("/api/questions", questionsRoute);

app.listen(PORT, () => {
	connectDB();
	console.log("Server is running on port: ", PORT);
});

