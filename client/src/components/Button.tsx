import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'secondary';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#6B3FA0] to-[#4F72E0] text-white px-6 py-3 shadow-[0_0_30px_rgba(107,63,160,0.4)] hover:shadow-[0_0_50px_rgba(107,63,160,0.6)] hover:-translate-y-0.5 active:translate-y-0',
    ghost: 'bg-transparent border border-white/10 text-white/80 px-5 py-2.5 hover:bg-white/10 hover:border-white/20 hover:text-white',
    secondary: 'bg-white/10 hover:bg-white/15 border border-white/5 text-white px-4 py-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
