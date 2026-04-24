import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { handleUpload, getDocumentStatus, chatWithDocument, getDocuments, handleDeleteDocument } from '../controllers/documentController.js';
import { processDocument } from '../services/documentService.js';

const router = express.Router();

router.get('/', getDocuments);
router.post('/upload', upload.single('document'), handleUpload);
router.get('/:id/status', getDocumentStatus);
router.delete('/:id', handleDeleteDocument);
router.post('/chat', chatWithDocument);
router.post('/:id/chat', chatWithDocument);

// optional manual trigger
router.post('/process/:id', async (req, res) => {
  try {
    const result = await processDocument(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;