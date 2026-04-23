// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';

// const VerifySuccess = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const token = urlParams.get('token');

//     if (token) {
//       localStorage.setItem('token', token);
//       toast.success('Email verified! Redirecting to dashboard...');
//       setTimeout(() => navigate('/dashboard'), 2000);
//     } else {
//       toast.error('Invalid verification link');
//       navigate('/login');
//     }
//   }, [navigate]);

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="text-center">
//         <h1 className="text-2xl font-bold mb-4">Verification Successful!</h1>
//         <p>You will be redirected to the dashboard shortly.</p>
//       </div>
//     </div>
//   );
// };

// export default VerifySuccess;