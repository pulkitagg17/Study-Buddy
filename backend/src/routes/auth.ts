import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        error: "Email Already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      passwordHash,
      name,
    });

    await newUser.save();

    res.status(200).json({
      message: "Registration successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Registration failed",
    });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        error: "Invalid credentials",
      });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(400).json({
        error: "Invalid credentials",
      });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Login failed'
    });
  }
});

export default router;
