import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { jwtDecode } from 'jwt-decode';

const Landing: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const navigate = useNavigate();



  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded && decoded.name && (!decoded.exp || decoded.exp * 1000 > Date.now())) {
          setIsAuthenticated(true);
          setUserName(decoded.name);
          navigate('/chat');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        // Optionally clear invalid token
        localStorage.removeItem('token');
      }
    }

    // Rest of your intersection observer code...
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [navigate]);

  function Data() {
    throw new Error('Function not implemented.');
  }

  return (

    <div className="bg-gradient-animated min-h-screen">

      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4"
          onClick={() => setShowVideo(false)}>
          <div className="relative w-full max-w-4xl">
            {/* Custom play button overlay */}
            {!videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoPlaying(true);
                  const iframe = document.getElementById('demoVideo') as HTMLIFrameElement;
                  if (iframe) {
                    iframe.src = iframe.src.replace('autoplay=0', 'autoplay=1');
                  }
                }}>
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            <div className="youtube-container">
              <iframe
                id="demoVideo"
                className="w-full aspect-video rounded-lg"
                src={`https://www.youtube.com/embed/_HQ2H_0Ayy0?autoplay=0&mute=0&controls=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&enablejsapi=1&widget_referrer=https://yourdomain.com`}
                title="DataPilotAI Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <button
              className="absolute -top-12 right-0 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black"
              onClick={(e) => {
                e.stopPropagation();
                setShowVideo(false);
                setVideoPlaying(false);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <nav className="navbar" id="navbar">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="w-fit">
              <Logo size="xl" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[#A49BBB] hover:text-white transition-colors font-body">Features</a>
              <a href="#how-it-works" className="text-sm text-[#A49BBB] hover:text-white transition-colors font-body">How it Works</a>
              <a href="#demo" className="text-sm text-[#A49BBB] hover:text-white transition-colors font-body">Demo</a>
              <a href="#pricing" className="text-sm text-[#A49BBB] hover:text-white transition-colors font-body">Pricing</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/chat" className="btn-ghost" style={{ padding: '10px 20px', fontSize: '14px' }}>
                    Chat
                  </Link>
                  <Link to="/create-project" className="btn-primary" style={{ padding: '10px 22px', fontSize: '14px' }}>
                    Create Workspace
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost" style={{ padding: '10px 20px', fontSize: '14px' }}>Sign In</Link>
                  <Link to="/signup" className="btn-primary" style={{ padding: '10px 22px', fontSize: '14px' }}>Start Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="section-wrapper relative overflow-hidden" style={{ paddingTop: '160px', paddingBottom: '100px' }}>
        <div className="noise-overlay"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(107,63,160,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(107,63,160,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }}></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="fade-in flex justify-center mb-8">
            <div className="section-label">
              <span style={{ width: '6px', height: '6px', background: '#9B6FCC', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #9B6FCC' }}></span>
              Now in Beta - Join 2,400+ teams
            </div>
          </div>

          <h1 className="fade-in fade-in-delay-1 font-display font-extrabold leading-tight mb-6" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', letterSpacing: '-0.03em' }}>
            {isAuthenticated ? (
              <>
                Welcome back, <span className="text-gradient">{userName}</span><br />
                Create your next workshop
              </>
            ) : (
              <>
                AI that reads your<br />
                <span className="text-gradient">documents.</span> You just ask.
              </>
            )}
          </h1>

          <p className="fade-in fade-in-delay-2 text-[#9C8EAF] max-w-xl mx-auto text-lg leading-relaxed mb-10 font-body">
            {isAuthenticated
              ? `Hi ${userName}, create a new workshop or continue working on your existing projects.`
              : "Upload any PDF, configure your AI pipeline, and start chatting instantly. DataPilotAI makes RAG effortless - no ML degree required."}
          </p>

          <div className="fade-in fade-in-delay-3 flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isAuthenticated ? (
              <Link to="/create-project" className="btn-primary" style={{ fontSize: '16px', padding: '16px 36px' }}>
                Create Workshop
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            ) : (
              <Link to="/signup" className="btn-primary" style={{ fontSize: '16px', padding: '16px 36px' }}>
                Start Free - No credit card
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            )}
            <a
              href="#demo"
              className="btn-ghost"
              style={{ fontSize: '16px', padding: '18px 32px' }}
              onClick={(e) => {
                e.preventDefault();
                setShowVideo(true);
                setVideoPlaying(false); // Reset playing state
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              See Demo
            </a>
          </div>

          <div className="fade-in fade-in-delay-4 inline-flex flex-wrap justify-center items-center gap-0 glass rounded-2xl px-2 py-4 md:py-5">
            <div className="stat-item">
              <div className="font-display font-bold text-2xl text-white">50K+</div>
              <div className="text-xs text-[#7A6B8A] mt-1">Documents processed</div>
            </div>
            <div className="stat-divider hidden sm:block"></div>
            <div className="stat-item">
              <div className="font-display font-bold text-2xl text-white">99.2%</div>
              <div className="text-xs text-[#7A6B8A] mt-1">Answer accuracy</div>
            </div>
            <div className="stat-divider hidden sm:block"></div>
            <div className="stat-item">
              <div className="font-display font-bold text-2xl text-white">&lt;1s</div>
              <div className="text-xs text-[#7A6B8A] mt-1">Average response</div>
            </div>
            <div className="stat-divider hidden sm:block"></div>
            <div className="stat-item">
              <div className="font-display font-bold text-2xl text-white">2.4K</div>
              <div className="text-xs text-[#7A6B8A] mt-1">Teams using it</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6"><div className="glow-divider"></div></div>

      <section className="section-wrapper" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 fade-in">
            <div className="section-label mx-auto mb-5 w-fit">Features</div>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              Everything you need to build<br /><span className="text-gradient">document AI</span>
            </h2>
            <p className="text-[#7A6B8A] max-w-lg mx-auto text-base font-body">
              From upload to insight - a complete AI pipeline with zero infra setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-8 md:col-span-2 fade-in" style={{ background: 'linear-gradient(135deg, rgba(107,63,160,0.2), rgba(39,27,49,0.6))', borderColor: 'rgba(107,63,160,0.25)' }}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="feature-icon icon-purple">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white mb-3">Chat with Documents</h3>
                  <p className="text-[#9C8EAF] text-base font-body leading-relaxed mb-5">
                    Ask questions in plain English. Get precise answers with source references - pulled directly from your documents using smart RAG retrieval.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-3 py-1.5 rounded-full font-body" style={{ background: 'rgba(107,63,160,0.2)', border: '1px solid rgba(107,63,160,0.3)', color: '#C084FC' }}>Multi-PDF</span>
                    <span className="text-xs px-3 py-1.5 rounded-full font-body" style={{ background: 'rgba(107,63,160,0.2)', border: '1px solid rgba(107,63,160,0.3)', color: '#C084FC' }}>Source Citations</span>
                    <span className="text-xs px-3 py-1.5 rounded-full font-body" style={{ background: 'rgba(107,63,160,0.2)', border: '1px solid rgba(107,63,160,0.3)', color: '#C084FC' }}>Memory Mode</span>
                  </div>
                </div>
                <div className="w-full md:w-72 glass rounded-xl p-4 flex-shrink-0" style={{ borderColor: 'rgba(107,63,160,0.2)' }}>
                  <div className="text-xs text-[#7A6B8A] mb-3 font-body">Live preview</div>
                  <div className="space-y-3">
                    <div className="chat-bubble-user">
                      <p className="text-xs font-body text-white">What is the refund policy?</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="ai-avatar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div className="chat-bubble-ai">
                        <p className="text-xs font-body text-[#C4B5D6]">Based on <span className="text-[#C084FC]">policy.pdf, p.14</span> - customers may request a full refund within 30 days of purchase...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 fade-in fade-in-delay-1">
              <div className="feature-icon icon-blue">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-3">Multi-Agent AI</h3>
              <p className="text-[#9C8EAF] text-base font-body leading-relaxed">
                Run parallel AI agents across multiple documents simultaneously. One question, many sources - synthesized into a single clean answer.
              </p>
              <div className="mt-5 flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px rgba(74,222,128,0.8)' }}></div>
                <span className="text-xs text-[#7A6B8A] font-body">3 agents running simultaneously</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 fade-in fade-in-delay-2">
              <div className="feature-icon icon-pink">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-3">Smart Outputs</h3>
              <p className="text-[#9C8EAF] text-base font-body leading-relaxed">
                Get structured outputs - summaries, tables, bullet lists, or raw JSON. Export directly to Notion, Slack, or your own API endpoint.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="text-center py-2 rounded-lg text-xs font-body" style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)', color: '#C084FC' }}>JSON</div>
                <div className="text-center py-2 rounded-lg text-xs font-body" style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)', color: '#C084FC' }}>CSV</div>
                <div className="text-center py-2 rounded-lg text-xs font-body" style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)', color: '#C084FC' }}>Markdown</div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 md:col-span-2 fade-in fade-in-delay-3">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <div className="feature-icon icon-teal">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white mb-3">Semantic Search</h3>
                  <p className="text-[#9C8EAF] text-base font-body leading-relaxed">
                    Not keyword matching - real semantic understanding. Find the exact paragraph, table, or clause across thousands of pages in milliseconds using vector embeddings.
                  </p>
                </div>
                <div className="w-full md:w-96">
                  <div className="glass rounded-xl p-4" style={{ borderColor: 'rgba(45,212,191,0.2)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-[#2DD4BF] text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <div className="flex-1 h-8 rounded-lg" style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                        <span className="text-xs text-[#7A6B8A] font-body">termination clause in contract...</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(45,212,191,0.06)' }}>
                        <span className="text-xs text-[#2DD4BF] font-bold w-5">1.</span>
                        <span className="text-xs text-[#C4B5D6] font-body">Section 12.4 - Employment Contract.pdf</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(45,212,191,0.04)' }}>
                        <span className="text-xs text-[#2DD4BF] font-bold w-5">2.</span>
                        <span className="text-xs text-[#7A6B8A] font-body">Clause 8.1 - Services Agreement.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6"><div className="glow-divider"></div></div>

      <section className="section-wrapper" id="how-it-works">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 fade-in">
            <div className="section-label mx-auto mb-5 w-fit">How it Works</div>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              From upload to insight<br /><span className="text-gradient">in 3 steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="glass-card rounded-2xl p-8 text-center fade-in">
              <div className="step-number mx-auto mb-5">01</div>
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto text-[#9B6FCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-3">Create a Workspace</h3>
              <p className="text-[#7A6B8A] text-sm font-body leading-relaxed">
                Name your workspace, set the context - legal docs, research, manuals, contracts. Full control from day one.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center fade-in fade-in-delay-1">
              <div className="step-number mx-auto mb-5">02</div>
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto text-[#9B6FCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-3">Upload Documents</h3>
              <p className="text-[#7A6B8A] text-sm font-body leading-relaxed">
                Drag and drop your PDFs. DataPilotAI auto-chunks, embeds, and indexes your content - ready in seconds.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center fade-in fade-in-delay-2">
              <div className="step-number mx-auto mb-5">03</div>
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto text-[#9B6FCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-3">Ask Anything</h3>
              <p className="text-[#7A6B8A] text-sm font-body leading-relaxed">
                Chat with your documents in real time. Get cited, accurate answers - or structured summaries with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6"><div className="glow-divider"></div></div>

      <section className="section-wrapper relative overflow-hidden" id="pricing">
        <div className="cta-blob"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="glass rounded-3xl p-12 md:p-16 text-center max-w-3xl mx-auto fade-in" style={{ borderColor: 'rgba(107,63,160,0.3)', boxShadow: '0 0 100px rgba(107,63,160,0.15)' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,rgba(107,63,160,0.4),rgba(79,142,247,0.3))', border: '1px solid rgba(107,63,160,0.4)' }}>
              <svg className="w-8 h-8 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>

            <h2 className="font-display font-bold mb-5" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', letterSpacing: '-0.02em' }}>
              {isAuthenticated ? (
                <>
                  Ready to create your<br /><span className="text-gradient">next workshop, {userName}?</span>
                </>
              ) : (
                <>
                  Start building with<br /><span className="text-gradient">document AI today</span>
                </>
              )}
            </h2>

            <p className="text-[#7A6B8A] max-w-md mx-auto text-base font-body leading-relaxed mb-8">
              {isAuthenticated
                ? `Create a new workshop or continue working on your existing projects.`
                : "Free plan includes 3 projects, 20 documents, and unlimited questions. No credit card needed."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              {isAuthenticated ? (
                <Link to="/create-project" className="btn-primary" style={{ fontSize: '17px', padding: '18px 42px' }}>
                  Create Workshop
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              ) : (
                <Link to="/signup" className="btn-primary" style={{ fontSize: '17px', padding: '18px 42px' }}>
                  Get Started Free
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              )}
              <a
                href="#demo"
                className="btn-ghost"
                style={{ fontSize: '16px', padding: '18px 32px' }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowVideo(true);
                  setVideoPlaying(false); // Reset playing state
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Watch Demo
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs text-[#5A4B6A] font-body">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="#9B6FCC" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.127-.16-2.22-.46-3.256z" /></svg>
                SOC2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="#9B6FCC" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                End-to-end encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="#9B6FCC" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t" style={{ borderColor: 'rgba(107,63,160,0.15)' }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Logo size="lg" />
            </div>
            <div className="flex gap-6 flex-wrap justify-center">
              <a href="#" className="text-xs text-[#5A4B6A] hover:text-[#9C8EAF] transition-colors font-body">Privacy</a>
              <a href="#" className="text-xs text-[#5A4B6A] hover:text-[#9C8EAF] transition-colors font-body">Terms</a>
              <a href="#" className="text-xs text-[#5A4B6A] hover:text-[#9C8EAF] transition-colors font-body">Docs</a>
              <a href="#" className="text-xs text-[#5A4B6A] hover:text-[#9C8EAF] transition-colors font-body">Status</a>
              <a href="#" className="text-xs text-[#5A4B6A] hover:text-[#9C8EAF] transition-colors font-body">GitHub</a>
            </div>
            <p className="text-xs text-[#3A2E47] font-body">
              © {new Date().getFullYear()} DataPilotAI - Developed by Rajesh
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
