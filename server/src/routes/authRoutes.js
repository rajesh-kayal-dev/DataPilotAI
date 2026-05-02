import express from "express";
import { login, register, verifyEmail } from "../controllers/authController.js";
import { procted } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.get("/verify/:token", verifyEmail);

import User from "../models/User.js";

router.get("/dashboard", procted, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json({
            message: "Welcome to dashboard",
            user: user
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data" });
    }
});

export default router;