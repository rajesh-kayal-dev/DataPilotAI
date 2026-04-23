import express from 'express';
import googleAuthController from '../controllers/googleAuthController.js';

const router = express.Router();

router.post('/auth/google', googleAuthController.handleGoogleAuth);

export default router;