import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  bodyClassName = '',
  title,
  action,
  onClick,
}) => {
  return (
    <div 
      className={`bg-white overflow-hidden shadow rounded-lg border border-gray-100 ${className}`}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="px-4 py-4 sm:px-6 border-b border-gray-100 flex justify-between items-center">
          {title && <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`px-4 py-5 sm:p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
