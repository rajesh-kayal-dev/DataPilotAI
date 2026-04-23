import express from "express";
import { login, register, verifyEmail } from "../controllers/authController.js";
import { procted } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.get("/verify/:token", verifyEmail);

router.get("/dashboard", procted, (req, res) => {
    res.json({
        message: "Welcome to dashboard",
        user: req.user
    })
})

export default router;