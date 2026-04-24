import Workspace from '../models/Workspace.js';

export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?._id || '64b1f2a9c1234567890abcd1';

    const workspace = new Workspace({
      name,
      user: userId,
    });

    await workspace.save();
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const userId = req.user?._id || '64b1f2a9c1234567890abcd1';
    const workspaces = await Workspace.find({ user: userId }).sort({ createdAt: -1 });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
