import express from "express";
import { auth } from "../middleware/auth";
import { Session } from "../models/Session";
import { ai } from "../services/gemini";
import { buildPrompt } from "../services/prompt";
import { buildHintPrompt } from "../services/hints";

const router = express.Router();

// Start Session
router.post("/start", auth, async (req, res) => {
  try {
    const { problemTitle, problemText, mode } = req.body;

    const session = await Session.create({
      userId: (req as any).userId,
      problemTitle,
      problemText,
      mode: mode || "interviewer",
      transcript: [],
    });

    res.json({
      sessionId: session._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Could not start session",
    });
  }
});

// Ask (Send a msg)
router.post("/ask", auth, async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    const session = await Session.findById(sessionId);
    if (!session)
      return res.status(404).json({
        error: "Session not found",
      });

    session.transcript.push({
      from: "user",
      text: message,
    });

    const prompt = buildPrompt(
      session.mode,
      session.transcript,
      message,
      session.problemTitle || "General",
      session.problemText || "No description"
    );

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const aiReply = result.text;

    session.transcript.push({
      from: "assistant",
      text: aiReply,
    });

    await session.save();

    res.json({
      reply: aiReply,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to process message",
    });
  }
});

// Reveal final solution
router.post("/reveal", auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);
    if (!session)
      return res.status(404).json({
        error: "Session not found",
      });

    const revealPrompt = `You are Study Buddy in REVEAL ANSWER MODE.
        Now the user explicitly asked for the full solution.
        You MUST:
        - Provide the complete thought process.
        - Give clear step-by-step reasoning.
        - Provide the optimal algorithm.
        - Provide time and space complexity.
        - Provide clean final code in C++.
        - Keep explanations structured and clear.

        Problem:
        ${session.problemTitle}

        Description:
        ${session.problemText}

        Transcript so far:
        ${session.transcript.map((m) => `${m.from}: ${m.text}`).join("\n")}

        Now produce the full correct solution:
        `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: revealPrompt,
    });

    const finalAnswer = result.text;

    session.transcript.push({
      from: "assistant",
      text: finalAnswer,
    });

    await session.save();

    res.json({ solution: finalAnswer });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to reveal answer",
    });
  }
});

//HINT (LEVEL 1,2,3)
router.post("/hint", auth, async (req, res) => {
  try {
    const { sessionId, level } = req.body;

    if (![1, 2, 3].includes(level)) {
      return res.status(400).json({
        error: "Hint level must be 1, 2, or 3.",
      });
    }

    const session = await Session.findById(sessionId);
    if (!session)
      return res.status(404).json({
        error: "Session not found",
      });

    const lastUserMessage: string =
      session.transcript.filter((m) => m.from === "user").slice(-1)[0]?.text ??
      "";

    const hintPromt = buildHintPrompt(
      level,
      session.transcript,
      session.problemTitle ?? "",
      session.problemText ?? "",
      lastUserMessage
    );

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: hintPromt }] }],
    });

    const hint = result.text;

    session.transcript.push({
      from: "assistant",
      text: `[HINT LEVEL ${level}]: ${hint}`
    });

    await session.save();

    res.json({ hint });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to generate hint"
    });
  }
});

// Finish session
router.post("/finish", auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    await Session.findByIdAndUpdate(sessionId, {
      isActive: false,
      endedAt: new Date(),
    });

    res.json({
      message: "Session ended",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Could not end session",
    });
  }
});

export default router;
