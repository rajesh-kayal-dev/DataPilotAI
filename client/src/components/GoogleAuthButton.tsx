import { GoogleLogin } from '@react-oauth/google';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface GoogleAuthButtonProps {
  buttonText: string;
  isSignup?: boolean;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ buttonText, isSignup = false }) => {
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await axiosInstance.post('/auth/google', {
        token: credentialResponse.credential
      });

      localStorage.setItem('token', response.data.token);
      toast.success(isSignup ? 'Signup successful!' : 'Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(error.response?.data?.error ||
                 error.message ||
                 'Authentication failed. Please try again.');
    }
  };

  const handleError = () => {
    toast.error('Google authentication failed. Please try again.');
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text={buttonText}
        shape="rectangular"
        theme="filled_black"
        size="medium"
        logo_alignment="left"
        width="350"
        useOneTap
      />
    </div>
  );
};

export default GoogleAuthButton;