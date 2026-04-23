import axiosInstance from './axiosInstance';
import toast from 'react-hot-toast';

export const logout = () => {
  localStorage.removeItem('token');
  toast.success('Logged out successfully!');
  window.location.href = '/login'; // Redirect to login
};