import React from 'react';

type LogoProps = {
  variant?: 'light' | 'dark' | 'icon';
  className?: string;
};

export function Logo({ variant = 'light', className = 'h-10' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g>
          {/* Box base */}
          <path d="M50 65L20 50V30L50 45V65Z" fill="#0F172A" opacity="0.9"/>
          {/* Box right side */}
          <path d="M50 65L80 50V30L50 45V65Z" fill="#10B981"/>
          {/* Box top */}
          <path d="M50 25L20 30L50 45L80 30L50 25Z" fill="#10B981" opacity="0.7"/>
          {/* Shield/Checkmark */}
          <g transform="translate(50, 45)">
            <path d="M-12 -15L0 -20L12 -15V-5C12 0 8 8 0 12C-8 8 -12 0 -12 -5V-15Z" fill="white" stroke="#10B981" strokeWidth="2"/>
            <path d="M-4 -5L-1 0L6 -10" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>
        </g>
      </svg>
    );
  }

  if (variant === 'dark') {
    return (
      <svg viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Icon */}
        <g transform="translate(15, 10)">
          <path d="M30 50L10 42V25L30 33V50Z" fill="#FFFFFF" opacity="0.9"/>
          <path d="M30 50L50 42V25L30 33V50Z" fill="#10B981"/>
          <path d="M30 18L10 25L30 33L50 25L30 18Z" fill="#10B981" opacity="0.7"/>
          <g transform="translate(30, 33)">
            <path d="M-8 -10L0 -13L8 -10V-3C8 0 5 5 0 8C-5 5 -8 0 -8 -3V-10Z" fill="white" stroke="#10B981" strokeWidth="1.5"/>
            <path d="M-3 -3L-1 0L4 -7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>
        </g>
        {/* Text: SafeTrade (white) */}
        <g transform="translate(85, 0)">
          <text x="0" y="48" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="800" fill="#FFFFFF" letterSpacing="-0.5">Safe</text>
          <text x="72" y="48" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="700" fill="#FFFFFF" letterSpacing="-0.5">Trade</text>
          <circle cx="185" cy="35" r="3" fill="#10B981"/>
        </g>
      </svg>
    );
  }

  // Light variant (for white/light backgrounds)
  return (
    <svg viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Icon */}
      <g transform="translate(15, 10)">
        {/* Box base */}
        <path d="M30 50L10 42V25L30 33V50Z" fill="#0F172A" opacity="0.9"/>
        {/* Box right side */}
        <path d="M30 50L50 42V25L30 33V50Z" fill="#10B981"/>
        {/* Box top */}
        <path d="M30 18L10 25L30 33L50 25L30 18Z" fill="#10B981" opacity="0.7"/>
        {/* Shield/Checkmark */}
        <g transform="translate(30, 33)">
          <path d="M-8 -10L0 -13L8 -10V-3C8 0 5 5 0 8C-5 5 -8 0 -8 -3V-10Z" fill="white" stroke="#10B981" strokeWidth="1.5"/>
          <path d="M-3 -3L-1 0L4 -7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </g>
      </g>
      {/* Text: SafeTrade */}
      <g transform="translate(85, 0)">
        <text x="0" y="48" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="800" fill="#0F172A" letterSpacing="-0.5">Safe</text>
        <text x="72" y="48" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="700" fill="#0F172A" letterSpacing="-0.5">Trade</text>
        <circle cx="185" cy="35" r="3" fill="#10B981"/>
      </g>
    </svg>
  );
}
