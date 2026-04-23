import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  pageNumber?: number;
}

interface Highlight {
  id: string;
  text: string;
  pageNumber: number;
  offset: number;
  length: number;
}

const DocumentViewer: React.FC = () => {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'I have analyzed this document. What would you like to know about it?',
    },
  ]);
  const [input, setInput] = useState('');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const documentContentRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
    };

    setMessages([...messages, newMessage]);
    setInput('');

    setTimeout(() => {
      const citationHighlight: Highlight = {
        id: `highlight-${messages.length + 2}`,
        text: 'The key findings indicate a 23% increase in quarterly revenue...',
        pageNumber: 7,
        offset: 245,
        length: 68,
      };
      setHighlights([...highlights, citationHighlight]);

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          content: 'Based on the document analysis, I found relevant information regarding your query.',
          source: 'Q3_Financial_Report.pdf, p.7',
          pageNumber: 7,
        },
      ]);
    }, 1000);
  };

  const handleCitationClick = (pageNumber: number, highlightId: string) => {
    setCurrentPage(pageNumber);
    setActiveHighlight(highlightId);
    
    const highlightElement = document.getElementById(highlightId);
    if (highlightElement) {
      highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDownload = () => {
    console.log('Downloading document...');
  };

  return (
    <MainLayout>
      <div className="flex-1 flex h-full overflow-hidden">
        
        {/* Left Panel - Document Viewer */}
        <div className="flex-1 flex flex-col border-r border-white/5 bg-[#0B0612]/50">
          
          {/* Top Bar */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-white/80 font-medium truncate max-w-[200px]">Q3_Financial_Report.pdf</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
              
              <span className="text-xs text-white/60 w-12 text-center">{zoom}%</span>
              
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                title="Zoom In"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <div className="w-px h-4 bg-white/10 mx-1"></div>

              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <span className="text-xs text-white/60">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="w-px h-4 bg-white/10 mx-1"></div>

              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6" ref={documentContentRef}>
            <div
              className="max-w-2xl mx-auto bg-white text-black rounded-lg shadow-2xl p-8 transition-transform"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <div className="prose prose-sm max-w-none">
                <h1 className="text-2xl font-bold mb-4 text-gray-900">Q3 Financial Report 2025</h1>
                
                <p className="text-gray-700 mb-4">
                  This report provides a comprehensive overview of our financial performance for the third quarter of 2025. 
                  The analysis covers revenue streams, operational costs, and strategic initiatives implemented during this period.
                </p>

                <h2 className="text-lg font-semibold mt-6 mb-3 text-gray-900">Executive Summary</h2>
                
                <p className="text-gray-700 mb-4">
                  The company demonstrated strong financial health in Q3, with significant improvements across key metrics.
                  Our strategic focus on digital transformation and customer acquisition has yielded measurable results.
                </p>

                <div
                  id="highlight-2"
                  className={`relative ${activeHighlight === 'highlight-2' ? 'bg-yellow-200/80' : 'bg-yellow-100'} transition-colors cursor-pointer`}
                  onClick={() => setActiveHighlight(activeHighlight === 'highlight-2' ? null : 'highlight-2')}
                >
                  <p className="text-gray-700 mb-4">
                    The key findings indicate a 23% increase in quarterly revenue compared to Q2, driven primarily by 
                    expansion into new markets and improved customer retention rates. Operating margins improved by 
                    4.2 percentage points, reflecting successful cost optimization initiatives.
                  </p>
                </div>

                <h2 className="text-lg font-semibold mt-6 mb-3 text-gray-900">Revenue Analysis</h2>
                
                <p className="text-gray-700 mb-4">
                  Total revenue for Q3 reached $47.2 million, representing a year-over-year growth of 31%. 
                  This performance exceeded our projected targets by 8%, demonstrating the effectiveness of our 
                  go-to-market strategy.
                </p>

                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                  <li>Product sales: $28.4M (60% of total revenue)</li>
                  <li>Service contracts: $12.1M (26% of total revenue)</li>
                  <li>Licensing agreements: $6.7M (14% of total revenue)</li>
                </ul>

                <h2 className="text-lg font-semibold mt-6 mb-3 text-gray-900">Operational Highlights</h2>
                
                <p className="text-gray-700 mb-4">
                  During Q3, we successfully launched three new product features that have been well-received by 
                  the market. Customer satisfaction scores improved to 4.7/5.0, up from 4.4 in the previous quarter.
                </p>

                <p className="text-gray-700 mb-4">
                  The engineering team completed the migration to our new cloud infrastructure, resulting in 
                  40% improvement in system performance and 25% reduction in hosting costs.
                </p>

                <h2 className="text-lg font-semibold mt-6 mb-3 text-gray-900">Looking Forward</h2>
                
                <p className="text-gray-700 mb-4">
                  Based on current pipeline and market conditions, we project Q4 revenue to be in the range of 
                  $50-52 million, representing 15-20% sequential growth. We remain committed to our full-year 
                  guidance and continue to invest in long-term growth initiatives.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div className="w-96 flex flex-col border-l border-white/5 bg-[#0B0612]/80 backdrop-blur-sm">
          
          {/* Chat Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6B3FA0] to-[#4F8EF7] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm text-white/80 font-medium">AI Assistant</span>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                  msg.role === 'user' 
                    ? 'bg-brand/20 border border-brand/30' 
                    : 'glass-card'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#6B3FA0] to-[#4F8EF7] flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-white/50">DataPilotAI</span>
                    </div>
                  )}
                  <p className="text-xs text-white/90 leading-relaxed">{msg.content}</p>
                  {msg.source && (
                    <button
                      onClick={() => handleCitationClick(msg.pageNumber || 1, `highlight-${msg.id}`)}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#C084FC] hover:text-[#d8b4fe] transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {msg.source}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5">
            <form onSubmit={handleSubmit} className="input-glow rounded-xl p-3 backdrop-blur-xl">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this document..."
                className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-white/40 text-xs pt-0.5"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <button type="button" className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors text-[10px]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Cite sources
                </button>
                <button
                  type="submit"
                  className="w-7 h-7 rounded-full bg-brand hover:bg-[#9333ea] transition-all flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  <svg className="w-3.5 h-3.5 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentViewer;
