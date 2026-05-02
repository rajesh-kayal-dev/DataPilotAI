import Workspace from '../models/Workspace.js';
import { logger } from '../utils/logger.js';

/**
 * Workspace Controller
 * Handles creation and management of user workspaces.
 */

export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = new Workspace({
      name,
      user: userId // Using 'user' to match the existing model field
    });

    await workspace.save();
    logger.info('Workspace created', { workspaceId: workspace._id, userId });

    res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    logger.error('Create Workspace Error', { error: error.message });
    res.status(500).json({ error: 'Failed to create workspace' });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const userId = req.user?.id;
    const workspaces = await Workspace.find({ user: userId }).sort({ createdAt: -1 });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const userId = req.user?.id;
    const workspace = await Workspace.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({ success: true, message: 'Workspace deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
};
export const updateWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { name },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
};
