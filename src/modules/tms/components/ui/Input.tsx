import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onEndIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, endIcon, onEndIconClick, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full rounded-md border-gray-300 shadow-sm
              focus:border-primary focus:ring-primary sm:text-sm
              py-2 border px-3
              ${icon ? 'pl-10' : ''}
              ${endIcon ? 'pr-10' : ''}
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          {endIcon && (
            <div 
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${onEndIconClick ? 'cursor-pointer' : 'pointer-events-none'} text-gray-400 hover:text-gray-500`}
              onClick={onEndIconClick}
            >
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
