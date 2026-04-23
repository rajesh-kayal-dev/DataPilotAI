import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleOAuthProviderWrapperProps {
  children: ReactNode;
}

const GoogleOAuthProviderWrapper: React.FC<GoogleOAuthProviderWrapperProps> = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleOAuthProviderWrapper;