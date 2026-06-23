import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, default: '' },
  source: { type: String },
  modelName: { type: String },
  confidence: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  title: { type: String, default: 'New Chat' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activeDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
