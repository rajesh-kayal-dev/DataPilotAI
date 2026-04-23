import mongoose from 'mongoose';
import Document from './src/models/Document.js';
import connectDB from './src/config/db.js';
import 'dotenv/config'; // <-- Add this line to load .env

// Connect to MongoDB
await connectDB();

const testDocument = new Document({
  name: 'sample.pdf',
  type: 'pdf',
  size: 1024,
  user: new mongoose.Types.ObjectId(), // Generate a dummy user ID
  chunks: [
    {
      content: 'This is a sample chunk.',
      embedding: [0.1, 0.2, 0.3], // Example embedding
    },
  ],
});

try {
  await testDocument.save();
  console.log('Document saved successfully!');
} catch (error) {
  console.error('Error saving document:', error);
} finally {
  await mongoose.disconnect(); // Close the connection
}