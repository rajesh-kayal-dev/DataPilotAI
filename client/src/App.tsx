import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <>
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
    </>
  );
};

export default App;
