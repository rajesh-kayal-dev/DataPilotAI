import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const verified = urlParams.get('verified');
    const message = urlParams.get('message');

    if (message) toast.error(message);
    if (token && verified) {
      localStorage.setItem('token', token);
      toast.success('Email verified! Redirecting to dashboard...');
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
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
        <div className="glass-card rounded-3xl overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: '580px' }}>

          <div className="left-panel hidden lg:flex flex-col justify-between p-10 lg:w-[45%] relative">
            <div className="panel-orb panel-orb-1"></div>
            <div className="panel-orb panel-orb-2"></div>

            <div className="relative z-10">
              <Link to="/" className="w-fit">
                <Logo size="xl" />
              </Link>
            </div>

            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-white leading-tight mb-3">
                  Your documents,<br /><span className="text-gradient">now intelligent.</span>
                </h2>
                <p className="text-[#9C8EAF] text-sm leading-relaxed font-body">
                  Ask questions. Get answers. Instantly - from any PDF in your workspace.
                </p>
              </div>

              <div className="space-y-3">
                <div className="feature-chip">
                  <div className="chip-dot" style={{ background: '#C084FC', boxShadow: '0 0 8px rgba(192,132,252,0.6)' }}></div>
                  <span className="text-sm text-[#C4B5D6] font-body">RAG-powered document chat</span>
                </div>
                <div className="feature-chip">
                  <div className="chip-dot" style={{ background: '#60A5FA', boxShadow: '0 0 8px rgba(96,165,250,0.6)' }}></div>
                  <span className="text-sm text-[#C4B5D6] font-body">Multi-agent AI pipelines</span>
                </div>
                <div className="feature-chip">
                  <div className="chip-dot" style={{ background: '#2DD4BF', boxShadow: '0 0 8px rgba(45,212,191,0.6)' }}></div>
                  <span className="text-sm text-[#C4B5D6] font-body">Semantic search in milliseconds</span>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div style={{ background: 'rgba(39,27,49,0.5)', border: '1px solid rgba(107,63,160,0.2)', borderRadius: '14px', padding: '16px' }}>
                <p className="text-sm text-[#9C8EAF] font-body italic leading-relaxed mb-3">
                  "DataPilotAI saved our legal team hours - answers from 200-page contracts in seconds."
                </p>
                <div className="flex items-center gap-3">
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg,#6B3FA0,#4F8EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: "'Syne', sans-serif" }}>R</div>
                  <div>
                    <div className="text-xs font-body text-white font-medium">Rohan Mehta</div>
                    <div className="text-xs font-body text-[#5A4B6A]">Head of Legal, TechCorp India</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
            <div className="lg:hidden mb-8">
              <Logo size="xl" />
            </div>

            <div className="mb-8 fade-up-1">
              <h1 className="font-display font-bold text-2xl text-white mb-1.5">Welcome back</h1>
              <p className="text-[#7A6B8A] text-sm font-body">Sign in to your workspace</p>
            </div>

            <div className="fade-up-2 mb-6">
              <GoogleAuthButton buttonText="Continue with Google" />
            </div>

            <div className="or-divider mb-6 fade-up-2">
              <span className="text-xs text-[#3A2E47] font-body">or sign in with email</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="fade-up-3">
                <div className="input-wrap">
                  <input
                    type="email"
                    className="input-field"
                    id="email"
                    placeholder=" "
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label className="input-label" htmlFor="email">Email address</label>
                  <span className="input-icon">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                </div>
              </div>

              <div className="fade-up-3">
                <div className="input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    id="password"
                    placeholder=" "
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '44px' }}
                  />
                  <label className="input-label" htmlFor="password">Password</label>
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end fade-up-3">
                <a href="#" className="text-xs font-body" style={{ color: '#9B6FCC', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>

              <div className="fade-up-4 pt-1">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-7 text-center fade-up-5">
              <span className="text-sm text-[#5A4B6A] font-body">Don&apos;t have an account? </span>
              <Link to="/signup" className="text-sm font-body font-medium" style={{ color: '#9B6FCC', textDecoration: 'none' }}>
                Create one free
              </Link>
            </div>

            <p className="text-center text-xs text-[#3A2E47] font-body mt-5 fade-up-5">
              By signing in you agree to our <a href="#" style={{ color: '#5A4B6A', textDecoration: 'underline' }}>Terms</a> &amp; <a href="#" style={{ color: '#5A4B6A', textDecoration: 'underline' }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
