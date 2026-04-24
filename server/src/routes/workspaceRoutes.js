import express from 'express';
import { createWorkspace, getWorkspaces } from '../controllers/workspaceController.js';

const router = express.Router();

router.post('/', createWorkspace);
router.get('/', getWorkspaces);

export default router;
