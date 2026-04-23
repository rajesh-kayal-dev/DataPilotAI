import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, className = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={`h-1 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-[#7C4FD4] via-[#4F8EF7] to-[#C084FC] transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
