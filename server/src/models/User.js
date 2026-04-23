import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true, 
        required: true,
        lowercase: true 
    },
    password: {
        type: String,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Vital: allows multiple users to have NO googleId (local login) without unique errors
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local" // Helps you identify how the user originally joined
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

export default mongoose.model("User", userSchema);