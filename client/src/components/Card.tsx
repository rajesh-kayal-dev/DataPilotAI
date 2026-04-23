import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = true }) => {
  const baseStyles = 'glass-card rounded-2xl p-4';
  const hoverStyles = hover ? 'cursor-pointer hover:bg-white/10 hover:border-brand/30 transition-all duration-300' : '';
  
  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
