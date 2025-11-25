import express from "express";
import { auth } from "../middleware/auth";
import { User } from "../models/User";

const router = express.Router();

router.get("/settings", auth, async (req, res) => {
  try {
    const user = await User.findById((req as any).userId).select("settings");
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({ settings: user.settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Could not fetch settings",
    });
  }
});

router.post("/settings/update", auth, async (req, res) => {
  try {
    const {
      tone,
      defaultMode,
      defaultHintLevel,
      motivation,
      preferredLanguage,
    } = req.body;

    const validTones = ["strict", "neutral", "soft"];
    const validModes = ["interviewer", "mentor", "motivator"];
    const validLanguages = ["javascript", "cpp", "python"];

    if (tone && !validTones.includes(tone)) {
      return res.status(400).json({ error: "Invalid tone" });
    }

    if (defaultMode && !validModes.includes(defaultMode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }

    if (defaultHintLevel && ![1, 2, 3].includes(defaultHintLevel)) {
      return res.status(400).json({ error: "Invalid hint level" });
    }

    if (preferredLanguage && !validLanguages.includes(preferredLanguage)) {
      return res.status(400).json({ error: "Invalid preferred language" });
    }

    const user = await User.findById((req as any).userId);
    if(!user) return res.status(404).json({
        error: "User not found"
    });

    user.settings = {
        ...user.settings,
        ...(tone && { tone }),
        ...(defaultMode && {defaultMode}),
        ...(defaultHintLevel && { defaultHintLevel}),
        ...(motivation !== undefined && {motivation}),
        ...(preferredLanguage && { preferredLanguage }),
    };

    await user.save();

    res.json({
        message: "Settings updated",
        settings: user.settings,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
        error: "Failed to update settings"
    });
  }
});

export default router;
