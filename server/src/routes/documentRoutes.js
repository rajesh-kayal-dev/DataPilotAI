import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { handleUpload, getDocumentStatus, chatWithDocument, getDocuments, handleDeleteDocument, handleCancelUpload } from '../controllers/documentController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Document Routes (v1)
 * All routes are protected and multi-tenant aware.
 */

router.get('/', procted, getDocuments);
router.post('/upload', procted, upload.single('document'), handleUpload);
router.get('/:id/status', procted, getDocumentStatus);
router.post('/:id/cancel', procted, handleCancelUpload);
router.delete('/:id', procted, handleDeleteDocument);
router.post('/chat', procted, chatWithDocument);
router.post('/:id/chat', procted, chatWithDocument);

export default router;