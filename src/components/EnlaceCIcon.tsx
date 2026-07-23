import React from 'react';

interface EnlaceCIconProps {
  className?: string;
  hasBackground?: boolean;
}

export const EnlaceCIcon: React.FC<EnlaceCIconProps> = ({ 
  className = "w-6 h-6",
  hasBackground = false
}) => {
  const icon = (
    <svg 
      viewBox="0 0 640 480" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Graduation Cap */}
      <path d="M320 50 L440 110 L320 170 L200 110 Z" fill="#1b6ca8" />
      <path d="M265 125 C265 145 375 145 375 125" stroke="#1b6ca8" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M320 110 L180 140 L180 155" stroke="#0f5282" strokeWidth="4.5" strokeLinecap="round" fill="none" />

      {/* Blue Center Graduate Head */}
      <circle cx="320" cy="188" r="46" fill="#1b6ca8" />
      {/* Blue Center Graduate Body */}
      <path d="M225 380 C225 245 415 245 415 380" stroke="#1b6ca8" strokeWidth="30" strokeLinecap="round" fill="none" />

      {/* Left Green Companion */}
      <circle cx="170" cy="245" r="36" fill="#71b831" />
      <path d="M95 350 C95 245 245 245 245 350" stroke="#71b831" strokeWidth="24" strokeLinecap="round" fill="none" />

      {/* Right Green Companion */}
      <circle cx="470" cy="245" r="36" fill="#71b831" />
      <path d="M395 350 C395 245 545 245 545 350" stroke="#71b831" strokeWidth="24" strokeLinecap="round" fill="none" />
    </svg>
  );

  if (hasBackground) {
    return (
      <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg shadow-black/5 flex items-center justify-center">
        {icon}
      </div>
    );
  }

  return icon;
};
