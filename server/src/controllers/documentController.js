import { uploadDocument, listDocuments, deleteDocument } from '../services/documentService.js';
import Document from '../models/Document.js';
import { processChatFlow } from '../agents/orchestrator.js';
import { addDocumentJob } from '../config/queue.js';
import { logger } from '../utils/logger.js';

/**
 * Document Controller (Production V2)
 * Features Multi-tenant safety and Background Job Queueing.
 */

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { workspaceId } = req.query;
    
    const filter = { userId };
    if (workspaceId) filter.workspaceId = workspaceId;

    const documents = await Document.find(filter).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    logger.error('GetDocuments Error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const handleUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = req.user?.id;
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required for uploads' });
    }

    // 1. Save document record
    const { document } = await uploadDocument(req.file, userId, workspaceId);

    // 2. Offload processing to BullMQ worker
    await addDocumentJob({ 
      documentId: document._id, 
      filePath: req.file.path,
      userId 
    });

    logger.info('Document uploaded & queued', { documentId: document._id, userId });

    return res.status(202).json({
      success: true,
      message: 'File uploaded successfully. Processing started.',
      documentId: document._id,
    });
  } catch (error) {
    logger.error('Upload Error', { error: error.message });
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
};

export const getDocumentStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const document = await Document.findOne({ _id: req.params.id, userId });
    
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ status: document.status });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

export const handleDeleteDocument = async (req, res) => {
  try {
    const userId = req.user?.id;
    const document = await Document.findOne({ _id: req.params.id, userId });
    if (!document) return res.status(404).json({ error: 'Access denied' });

    await deleteDocument(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

export const chatWithDocument = async (req, res) => {
  try {
    const { question, documentId: bodyDocumentId } = req.body;
    const documentId = req.params.id || bodyDocumentId;
    const userId = req.user?.id;

    const result = await processChatFlow(question, documentId, userId);
    res.json(result);
  } catch (error) {
    logger.error('Chat Error', { error: error.message });
    res.status(500).json({ error: 'Chat failed' });
  }
};