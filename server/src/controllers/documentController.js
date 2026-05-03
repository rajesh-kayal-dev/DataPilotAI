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
    if (workspaceId && workspaceId !== 'all') {
      filter.workspaceId = workspaceId;
    }

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
      filePath: document.filePath,
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
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const document = await Document.findOne({ _id: req.params.id, userId, workspaceId });
    
    if (!document) return res.status(404).json({ error: 'Document not found in this workspace' });
    res.json({ status: document.status });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

export const handleDeleteDocument = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { workspaceId } = req.query;
    
    const filter = { _id: req.params.id, userId };
    if (workspaceId && workspaceId !== 'all') {
      filter.workspaceId = workspaceId;
    }

    const document = await Document.findOne(filter);
    if (!document) return res.status(404).json({ error: 'Access denied or document not found' });

    await deleteDocument(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

export const handleCancelUpload = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const document = await Document.findOne({ _id: req.params.id, userId, workspaceId });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found in this workspace' });
    }

    // Reuse deletion logic
    await deleteDocument(req.params.id);
    
    logger.info('Upload cancelled and document removed', { documentId: req.params.id, userId, workspaceId });
    res.json({ success: true, message: 'Upload cancelled and data removed' });
  } catch (error) {
    logger.error('Cancel Upload Error', { error: error.message });
    res.status(500).json({ error: 'Failed to cancel upload' });
  }
};

export const chatWithDocument = async (req, res) => {
  try {
    const { question, documentId: bodyDocumentId, workspaceId } = req.body;
    const documentId = req.params.id || bodyDocumentId;
    const userId = req.user?.id;

    let targetDocumentIds = [];
    if (workspaceId) {
      // If workspaceId is provided, fetch all completed documents in this workspace
      const docs = await Document.find({ workspaceId, userId, status: 'completed' }).select('_id');
      targetDocumentIds = docs.map(d => d._id.toString());
    } else if (documentId) {
      targetDocumentIds = [documentId];
    }

    if (targetDocumentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No documents available to query.' });
    }

    const result = await processChatFlow(question, targetDocumentIds, userId, { workspaceId });
    res.json(result);
  } catch (error) {
    logger.error('Chat Error', { error: error.message });
    res.status(500).json({ error: 'Chat failed' });
  }
};

export const handleDownload = async (req, res) => {
  try {
    const userId = req.user?.id;
    const document = await Document.findOne({ _id: req.params.id, userId });
    
    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Stream from S3 instead of local filesystem
    const { getFileFromS3 } = await import('../services/s3Service.js');
    const s3Stream = await getFileFromS3(document.s3Key);
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    const contentType = document.type === 'pdf' ? 'application/pdf' : 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Pipe the S3 stream directly to response
    s3Stream.pipe(res);
    
    s3Stream.on('error', (err) => {
      logger.error('S3 Stream Error during download', { error: err.message });
      if (!res.headersSent) res.status(500).json({ error: 'Failed to stream document' });
    });
  } catch (error) {
    logger.error('Download Error', { error: error.message });
    res.status(500).json({ error: 'Failed to download document' });
  }
};