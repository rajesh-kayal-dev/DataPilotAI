import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });

        if (exists) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashed = await bcrypt.hash(password, 10);


        const token = jwt.sign(
            { name, email, password: hashed },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        await sendVerificationEmail(email, token, name);

        res.json({ message: "Check your email to verify account" })

    } catch (err) {
        console.log("REGISTER ERROR:", err.message);
        res.status(500).json({ error: err.message })
    }
}

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const existingUser = await User.findOne({ email: decoded.email });
    if (existingUser) {
      return res.redirect(`http://localhost:5173/signup#error=User already exists`);
    }

    const newUser = await User.create({
      name: decoded.name,
      email: decoded.email,
      password: decoded.password,
      isVerified: true,
    });

    const loginToken = jwt.sign(
      { id: newUser._id, name: newUser.name, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Redirect to signup page with token in hash
    res.redirect(`http://localhost:5173/signup#token=${loginToken}&verified=true`);
  } catch (error) {
    res.redirect(`http://localhost:5173/signup#error=Invalid or expired link`);
  }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "user not found" });

        const match = await bcrypt.compare(password, user.password);

        if (!match) return res.status(400).json({ message: "Wrong password" });

        const token = jwt.sign(
            {
                id: user._id,
                name: user.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login success",
            token: token
        })

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}