import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';
import { WorkspaceProvider } from './context/WorkspaceContext';

const App = () => {
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
