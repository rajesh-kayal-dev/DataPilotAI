import Feedback from '../models/Feedback.js';

export const submitFeedback = async (req, res) => {
  try {
    const { rating, type, comment } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Anonymous';

    if (!rating || !comment) {
      return res.status(400).json({ error: 'Rating and comment are required' });
    }

    const feedback = new Feedback({
      user: userId,
      userName,
      rating,
      type,
      comment
    });

    await feedback.save();
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    const { rating, type, comment } = req.body;
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, user: req.user?.id },
      { rating, type, comment },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ error: 'Feedback not found or unauthorized' });
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndDelete({ _id: req.params.id, user: req.user?.id });
    if (!feedback) return res.status(404).json({ error: 'Feedback not found or unauthorized' });
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
