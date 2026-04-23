import React from 'react';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoVariant = 'icon' | 'full';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  sm: 'h-6',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-24',
};

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full',
  className = '' 
}) => {
  const src = variant === 'icon' ? '/favicon.png' : '/datapilotai-logo.png';
  const heightClass = sizeClasses[size];

  return (
    <img
      src={src}
      alt="DataPilotAI"
      className={`${heightClass} w-auto object-contain ${className}`}
    />
  );
};

export default Logo;
