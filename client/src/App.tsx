import { useEffect } from 'react';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';
import { WorkspaceProvider } from './context/WorkspaceContext';

const App = () => {
  useEffect(() => {
    const handleUnload = () => {
      window.speechSynthesis.cancel();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <WorkspaceProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AppRoutes />
    </WorkspaceProvider>
  );
};

export default App;
