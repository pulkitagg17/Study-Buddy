import { timeStamp } from "console";
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  from: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },

  text: {
    type: String,
    required: true,
  },

  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  mode: {
    type: String,
    enum: ["interviewer", "mentor", "motivator"],
    required: true,
  },

  problemTitle: {
    type: String,
    default: "",
  },

  problemText: {
    type: String,
    default: "",
  },

  transcript: [messageSchema],

  isActive: {
    type: Boolean,
    default: true,
  },

  startedAt: {
    type: Date,
    default: Date.now,
  },

  endedAt: {
    type: Date,
  },
});

export const Session = mongoose.model("Session", sessionSchema);
