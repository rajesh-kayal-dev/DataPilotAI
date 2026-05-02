import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const urlParams = new URLSearchParams(hash.replace('#', '?'));
      const token = urlParams.get('token');
      const verified = urlParams.get('verified');
      const error = urlParams.get('error');

      if (error) {
        toast.error(error);
      } else if (token && verified) {
        localStorage.setItem('token', token);
        toast.success('Email verified! Redirecting to dashboard...');
        navigate('/dashboard');
      }

      // Clean up the hash without reloading
      window.location.hash = '';
    }
  }, [navigate]);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/dashboard');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: 'Weak', color: '#F87171' };
    if (score === 2) return { score, label: 'Medium', color: '#FBBF24' };
    if (score === 3) return { score, label: 'Strong', color: '#34D399' };
    return { score, label: 'Very Strong', color: '#34D399' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      toast.error('Passwords do not match!');
      return;
    }

    if (strength.score < 3) {
      toast.error('Password is too weak. Please choose a stronger password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/auth/signup', {
        name,
        email,
        password,
      });
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 relative overflow-hidden">
      <div className="bg-scene"></div>
      <div className="grid-lines"></div>
      <div className="orb orb-a"></div>
      <div className="orb orb-b"></div>

      <div className="w-full max-w-5xl card-enter relative z-10">
        <div className="glass-card rounded-3xl overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: '600px' }}>

          <div className="left-panel hidden lg:flex flex-col justify-between p-10 lg:w-[42%] relative">
            <div className="p-orb-1"></div>
            <div className="p-orb-2"></div>

            <div className="relative z-10">
              <Link to="/" className="w-fit">
                <Logo size="xl" />
              </Link>
            </div>

            <div className="relative z-10 space-y-6">
              <div>
                <div className="plan-badge mb-4">
                  <svg width="10" height="10" fill="#C084FC" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  Free plan - No credit card
                </div>
                <h2 className="font-display font-bold text-3xl text-white leading-tight mb-3">
                  Start for free.<br /><span className="text-gradient">Upgrade when ready.</span>
                </h2>
                <p className="text-[#7A6B8A] text-sm leading-relaxed font-body">
                  Your free workspace includes everything to get started with AI-powered document intelligence.
                </p>
              </div>

              <div style={{ background: 'rgba(39,27,49,0.5)', border: '1px solid rgba(107,63,160,0.18)', borderRadius: '16px', padding: '20px' }} className="space-y-4">
                <div className="text-xs text-[#5A4B6A] font-body uppercase tracking-widest mb-2">Included in free plan</div>
                <div className="plan-feature">
                  <svg width="15" height="15" fill="none" stroke="#34D399" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  3 projects &amp; 20 documents
                </div>
                <div className="plan-feature">
                  <svg width="15" height="15" fill="none" stroke="#34D399" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  Unlimited AI questions
                </div>
                <div className="plan-feature">
                  <svg width="15" height="15" fill="none" stroke="#34D399" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  Semantic search
                </div>
                <div className="plan-feature">
                  <svg width="15" height="15" fill="none" stroke="#34D399" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  Export as JSON / Markdown
                </div>
              </div>
            </div>

            <div className="relative z-10 flex gap-6">
              <div>
                <div className="font-display font-bold text-xl text-white">2,400+</div>
                <div className="text-xs text-[#5A4B6A] font-body mt-0.5">Active teams</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(107,63,160,0.2)' }}></div>
              <div>
                <div className="font-display font-bold text-xl text-white">50K+</div>
                <div className="text-xs text-[#5A4B6A] font-body mt-0.5">Docs processed</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(107,63,160,0.2)' }}></div>
              <div>
                <div className="font-display font-bold text-xl" style={{ color: '#34D399' }}>Free</div>
                <div className="text-xs text-[#5A4B6A] font-body mt-0.5">To start</div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center p-8 lg:p-10 overflow-y-auto">
            <div className="lg:hidden mb-7">
              <Logo size="xl" />
            </div>

            <div className="mb-7 fu1">
              <h1 className="font-display font-bold text-2xl text-white mb-1.5">Create your account</h1>
              <p className="text-[#7A6B8A] text-sm font-body">Set up your free workspace in seconds</p>
            </div>

            <div className="fu2 mb-5">
              <GoogleAuthButton buttonText="Sign up with Google" isSignup={true} />
            </div>

            <div className="or-divider mb-5 fu2">
              <span className="text-xs text-[#3A2E47] font-body">or fill in your details</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="fu3">
                <div className="input-wrap">
                  <input type="text" className="input-field" id="name" placeholder=" " autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                  <label className="input-label" htmlFor="name">Full name</label>
                  <span className="input-icon">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                  </span>
                </div>
              </div>

              <div className="fu3">
                <div className="input-wrap">
                  <input type="email" className="input-field" id="email" placeholder=" " autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <label className="input-label" htmlFor="email">Work email</label>
                  <span className="input-icon">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                </div>
              </div>

              <div className="fu4">
                <div className="input-wrap">
                  <input type={showPassword ? 'text' : 'password'} className="input-field" id="password" placeholder=" " autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <label className="input-label" htmlFor="password">Password</label>
                  <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                    ) : (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
                <div className="pw-strength-bar">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`strength-seg ${i <= strength.score ? (strength.score <= 1 ? 'weak' : strength.score === 2 ? 'medium' : 'strong') : ''}`} />
                  ))}
                </div>
                <div className="pw-hint" style={{ color: strength.color }}>
                  {strength.label}
                </div>
              </div>

              <div className="fu4">
                <div className="input-wrap">
                  <input type={showConfirmPassword ? 'text' : 'password'} className="input-field" id="confirm" placeholder=" " autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <label className="input-label" htmlFor="confirm">Confirm password</label>
                  <button type="button" className="toggle-pw" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                    ) : (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="match-msg" style={{ color: passwordsMatch ? '#34D399' : '#F87171', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '5px' }}>
                    {passwordsMatch ? (
                      <>
                        <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Passwords match
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        Passwords don&apos;t match
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="fu5 pt-1">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Create Free Account
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center fu6">
              <span className="text-sm text-[#5A4B6A] font-body">Already have an account? </span>
              <Link to="/login" className="text-sm font-body font-medium" style={{ color: '#60A5FA', textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>

            <p className="text-center text-xs text-[#3A2E47] font-body mt-4 fu6">
              By creating an account you agree to our <a href="#" style={{ color: '#5A4B6A', textDecoration: 'underline' }}>Terms</a> &amp; <a href="#" style={{ color: '#5A4B6A', textDecoration: 'underline' }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
