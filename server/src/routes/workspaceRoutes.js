import express from 'express';
import { createWorkspace, getWorkspaces, deleteWorkspace } from '../controllers/workspaceController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Workspace Routes (v1)
 */

router.get('/', procted, getWorkspaces);
router.post('/', procted, createWorkspace);
router.delete('/:id', procted, deleteWorkspace);

export default router;
