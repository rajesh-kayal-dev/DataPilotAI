import express from 'express';
import { submitFeedback, listFeedback, updateFeedback, deleteFeedback } from '../controllers/feedbackController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', procted, submitFeedback);
router.get('/', procted, listFeedback);
router.patch('/:id', procted, updateFeedback);
router.delete('/:id', procted, deleteFeedback);

export default router;
