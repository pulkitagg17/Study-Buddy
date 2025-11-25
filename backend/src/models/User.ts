import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    name:{
        type: String,
    },

    settings: {
        tone: {
            type: String,
            default: "strict",
        },
        defaultMode: {
            type: String,
            default: "interviewer"
        },
        defaultHintLevel:{
            type: Number,
            default: 1,
        },
        motivation: {
            type: Boolean,
            default: true
        },
        preferredLanguage: {
            type: String,
            default: 'cpp'
        }
    },

    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export const User = mongoose.model("User", userSchema);
