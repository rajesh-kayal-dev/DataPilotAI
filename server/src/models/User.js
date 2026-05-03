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
        sparse: true 
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local" 
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free',
    },
    // Detailed plan tracking
    planId: {
        type: String,
        enum: ['free', 'pro_monthly', 'pro_6month'],
        default: 'free'
    },
    subscriptionExpiry: {
        type: Date,
    },
    // For "stacking" plans
    queuedPlanId: {
        type: String,
        enum: [null, 'pro_monthly', 'pro_6month'],
        default: null
    },
    selectedModel: {
        type: String,
        default: 'mimo-flash',
    },
    ragMode: {
        type: String,
        enum: ['hybrid', 'strict'],
        default: 'hybrid',
    },
}, { timestamps: true })

export default mongoose.model("User", userSchema);