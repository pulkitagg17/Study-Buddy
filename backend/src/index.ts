import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db';

import authRoutes from './routes/auth';
import sessionRoutes from './routes/session';
import userRoutes from './routes/user';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

connectDB();

// Test Route
app.get('/', (req, res) => {
    res.json({ message: "Study buddy is running" });
})

app.use("/auth", authRoutes);
app.use("/session", sessionRoutes);
app.use("/user", userRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:4000`);
});
