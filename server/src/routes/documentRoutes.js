import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { handleUpload, getDocumentStatus, chatWithDocument, getDocuments, handleDeleteDocument, handleCancelUpload, handleReembed } from '../controllers/documentController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Document Routes (v1)
 * All routes are protected and multi-tenant aware.
 */

router.get('/', procted, getDocuments);
router.post('/upload', procted, upload.single('document'), handleUpload);
router.post('/:id/reembed', procted, handleReembed);
router.get('/:id/download', procted, (req, res, next) => {
  // Pass workspaceId from query if needed for isolation check
  next();
}, async (req, res) => {
  try {
    const { handleDownload } = await import('../controllers/documentController.js');
    return handleDownload(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;