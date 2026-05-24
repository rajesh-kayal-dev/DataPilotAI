import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { sendPaymentSuccessEmail } from "../services/emailService.js";
import { logger } from "../utils/logger.js";

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_PRICES = {
    'pro_monthly': 149,
    'pro_6month': 499,
};

const PLAN_NAMES = {
    'pro_monthly': 'Monthly Pro',
    'pro_6month': '6-Month Saver',
};

const PLAN_DURATIONS = {
    'pro_monthly': 30, // days
    'pro_6month': 180, // days
};

export const createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        
        if (!PLAN_PRICES[planId]) {
            return res.status(400).json({ message: "Invalid Plan ID" });
        }

        const amount = PLAN_PRICES[planId];

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                planId: planId,
                userId: req.user.id
            }
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).send("Error creating order");
        }

        res.json(order);
    } catch (error) {
        console.error("Order creation error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // 1. Save Secure Transaction
            const transaction = new Transaction({
                userId: user._id,
                planId,
                amount: PLAN_PRICES[planId],
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                status: 'captured'
            });
            await transaction.save();

            // 2. Queue & Stacking Logic
            const durationDays = PLAN_DURATIONS[planId] || 30;
            const now = new Date();
            
            // Check if there is an existing active subscription
            const isCurrentlyActive = user.subscriptionExpiry && user.subscriptionExpiry > now;

            if (isCurrentlyActive) {
                // Keep current planId, but queue the next one and extend expiry
                user.queuedPlanId = planId;
                const extendedExpiry = new Date(user.subscriptionExpiry);
                extendedExpiry.setDate(extendedExpiry.getDate() + durationDays);
                user.subscriptionExpiry = extendedExpiry;
            } else {
                // Set as active immediately
                user.plan = 'pro';
                user.planId = planId;
                user.queuedPlanId = null;
                const newExpiry = new Date(now);
                newExpiry.setDate(newExpiry.getDate() + durationDays);
                user.subscriptionExpiry = newExpiry;
            }

            await user.save();

            // 2.5 Invalidate Redis cache so plan reflects immediately
            try {
                const { redisClient } = await import('../config/redis.js');
                await redisClient.del(`user_model_id:${user._id}`);
            } catch (cacheErr) {
                // non-blocking
            }

            // 3. Send success email
            try {
                const planName = PLAN_NAMES[planId] || 'Premium';
                await sendPaymentSuccessEmail(user.email, user.name, planName);
                logger.info(`Payment success email sent to ${user.email} for ${planName}`);
            } catch (emailError) {
                logger.error('Failed to send payment success email', { error: emailError.message });
            }

            return res.status(200).json({ 
                message: "Payment verified successfully", 
                plan: user.plan,
                planId: user.planId,
                queuedPlanId: user.queuedPlanId,
                expiry: user.subscriptionExpiry
            });
        } else {
            return res.status(400).json({ message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
