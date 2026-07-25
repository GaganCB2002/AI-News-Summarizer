import type React from 'react';
import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'gray' | 'green';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  icon,
  className = ''
}) => {
  const classes = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
};
