import React from 'react';

interface EmptyChatStateProps {
  userName?: string;
  onSuggestionClick: (suggestion: string) => void;
}

const EmptyChatState: React.FC<EmptyChatStateProps> = ({ userName, onSuggestionClick }) => {
  const suggestions = [
    "Summarize document",
    "Explain concepts",
    "Analyze data",
    "Key takeaways"
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "How can I help you today?";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    
    return userName ? `${timeGreeting}, ${userName.split(' ')[0]}` : timeGreeting;
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-1000">
      {/* Small Greeting */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-white/90 tracking-tight">
          {getGreeting()}
        </h1>
        <p className="text-white/30 text-sm font-medium">
          Ask anything about your documents
        </p>
      </div>

      {/* Compact Suggestions */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {suggestions.map((text, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(text)}
            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-[11px] font-medium text-white/50 hover:text-white"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyChatState;
