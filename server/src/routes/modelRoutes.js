import express from 'express';
import { getModels, setUserModel, getUserModel } from '../controllers/modelController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getModels);                        // Public — dropdown list
router.get('/user', procted, getUserModel);        // Auth — get user's model
router.patch('/user', procted, setUserModel);      // Auth — set user's model

export default router;
