import { uploadDocument } from '../services/documentService.js';

export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // TODO: Replace with actual user ID from auth middleware
    const userId = '60d5ec9f8b3e4b001f123456'; // Dummy ID for now

    const result = await uploadDocument(req.file, userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};