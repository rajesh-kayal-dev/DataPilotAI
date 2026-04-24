import { uploadDocument, processDocument, listDocuments, deleteDocument } from '../services/documentService.js';
import Document from '../models/Document.js';
import { processChatFlow } from '../agents/orchestrator.js';

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user?._id || '64b1f2a9c1234567890abcd1';
    const { workspaceId } = req.query;
    const documents = await listDocuments(userId, workspaceId);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleDeleteDocument = async (req, res) => {
  try {
    const result = await deleteDocument(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?._id || '64b1f2a9c1234567890abcd1';
    const { workspaceId } = req.body;

    const { document } = await uploadDocument(req.file, userId, workspaceId);

    // background processing
    processDocument(document._id);

    return res.status(202).json({
      success: true,
      documentId: document._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentStatus = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ status: document.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const chatWithDocument = async (req, res) => {
  try {
    const { question, documentId: bodyDocumentId } = req.body;
    const documentId = req.params.id || bodyDocumentId;
    
    const result = await processChatFlow(question, documentId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};