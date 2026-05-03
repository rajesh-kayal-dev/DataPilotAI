import express from 'express';
import { getModels, setUserModel, getUserModel, getRagMode, setRagMode } from '../controllers/modelController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getModels);                        // Public — dropdown list
router.get('/user', procted, getUserModel);        // Auth — get user's model
router.patch('/user', procted, setUserModel);      // Auth — set user's model
router.get('/rag-mode', procted, getRagMode);      // Auth — get user's RAG mode
router.patch('/rag-mode', procted, setRagMode);    // Auth — set user's RAG mode

export default router;
