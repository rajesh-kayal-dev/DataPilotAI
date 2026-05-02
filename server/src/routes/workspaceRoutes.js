import express from 'express';
import { createWorkspace, getWorkspaces, deleteWorkspace, updateWorkspace } from '../controllers/workspaceController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Workspace Routes (v1)
 */

router.get('/', procted, getWorkspaces);
router.post('/', procted, createWorkspace);
router.patch('/:id', procted, updateWorkspace);
router.delete('/:id', procted, deleteWorkspace);

export default router;
