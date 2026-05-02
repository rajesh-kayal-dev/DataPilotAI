import express from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { procted } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-order", procted, createOrder);
router.post("/verify-payment", procted, verifyPayment);

export default router;
