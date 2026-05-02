import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import Chat from '../pages/Chat';
import Settings from '../pages/Settings';
import Workspaces from '../pages/Workspaces';
import CreateProject from '../pages/CreateProject';
import DocumentViewer from '../pages/DocumentViewer';
import ProcessingStatus from '../pages/ProcessingStatus';
import Upgrade from '../pages/Upgrade';
import Feedback from '../pages/Feedback';
import ProtectedRoute from '../utils/ProtectedRoute';
import AuthRoute from '../utils/AuthRoute';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<AuthRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:workspaceId/:chatId" element={<Chat />} />
          <Route path="/chat/:workspaceId" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/document/:docId" element={<DocumentViewer />} />
          <Route path="/processing/:docId" element={<ProcessingStatus />} />
          <Route path="/processing" element={<ProcessingStatus />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
