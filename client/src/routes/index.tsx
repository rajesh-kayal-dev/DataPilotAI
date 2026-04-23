import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import Chat from '../pages/Chat';
import Settings from '../pages/Settings';
import WorkshopSetup from '../pages/WorkshopSetup';
import CreateProject from '../pages/CreateProject';
import DocumentViewer from '../pages/DocumentViewer';
import ProcessingStatus from '../pages/ProcessingStatus';
import ProtectedRoute from '../utils/ProtectedRoute';
import AuthRoute from '../utils/AuthRoute';
// import VerifySuccess from '../pages/VerifySuccess';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* <Route path="/verify-success" element={<VerifySuccess />} /> */}

        <Route element={<AuthRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workshop-setup" element={<WorkshopSetup />} />
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
