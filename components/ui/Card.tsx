import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  color?: 'blue' | 'red' | 'green' | 'violet' | 'amber';
  className?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, title, color = 'blue', className = '', headerAction }) => {
  const borderColors = {
    blue: 'border-l-blue-600',
    red: 'border-l-red-600',
    green: 'border-l-emerald-600',
    violet: 'border-l-violet-600',
    amber: 'border-l-amber-500'
  };
  
  const titleColors = {
    blue: 'text-blue-800',
    red: 'text-red-800',
    green: 'text-emerald-800',
    violet: 'text-violet-800',
    amber: 'text-amber-800'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-5 ${className}`}>
      {title && (
        <div className={`flex justify-between items-center mb-4 border-b pb-2 ${borderColors[color]} border-l-4 pl-3`}>
          <h3 className={`font-bold text-lg ${titleColors[color]}`}>{title}</h3>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
};