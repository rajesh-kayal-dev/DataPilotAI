import Chat from '../models/Chat.js';

export const createChat = async (req, res) => {
  try {
    const { workspaceId } = req.body;
    const userId = req.user?._id || '64b1f2a9c1234567890abcd1';

    const chat = new Chat({
      workspaceId,
      user: userId,
      messages: []
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChats = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const userId = req.user?._id || '64b1f2a9c1234567890abcd1';

    const query = { user: userId };
    if (workspaceId) query.workspaceId = workspaceId;

    const chats = await Chat.find(query).sort({ createdAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChat = async (req, res) => {
  try {
    const { title, messages } = req.body;
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { $set: { title, messages } },
      { new: true }
    );
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
