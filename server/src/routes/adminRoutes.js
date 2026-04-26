import express from 'express';
import { getSystemMetrics } from '../controllers/adminController.js';
// import { isAdmin } from '../middlewares/authMiddleware.js'; // Placeholder for admin check

const router = express.Router();

/**
 * Admin Metrics API
 * Protected route for system monitoring.
 */
router.get('/metrics', getSystemMetrics);

export default router;
