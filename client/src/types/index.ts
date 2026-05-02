export interface User {
  _id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
}

export interface Document {
  _id: string;
  name: string;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'completed' | 'uploaded' | 'success';
  size: number;
  workspaceId: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  modelName?: string;
  confidence?: number;
  animate?: boolean;
}

export interface ChatResponse {
  answer: string;
  source?: string;
  modelName?: string;
  confidence?: number;
}

export interface Workspace {
  _id: string;
  name: string;
  owner?: string;
}

export interface Model {
  id: string;
  label: string;
  provider: string;
  type: 'free' | 'paid';
  tier: string;
  tags: string[];
  badge?: string;
}

export interface GroupedModels {
  champions: Model[];
  free: {
    top: Model[];
    specialized: Model[];
    experimental: Model[];
  };
  paid: {
    budget: Model[];
    mid: Model[];
    premium: Model[];
  };
}
