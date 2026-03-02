import React, { useState } from 'react';
import { X } from 'lucide-react';

// ============================================
// TOAST SYSTEM — delegates to the global shared context
// ============================================
export { useToast } from '../../../../shared/context/ToastContext';
export type { Toast, ToastContextType } from '../../../../shared/context/ToastContext';

// ============================================
// MODAL COMPONENT
// ============================================

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

export function Modal({ title, isOpen, onClose, children, size = 'md', footer }: ModalProps) {
  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }[size];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClass} w-full animate-in zoom-in-95`}>
        <div className="border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 p-6 bg-slate-50 rounded-b-lg">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TABS COMPONENT
// ============================================

interface TabsProps {
  tabs: Array<{ label: string; value: string; content: React.ReactNode }>;
  defaultValue?: string;
}

export function Tabs({ tabs, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0].value);

  return (
    <div>
      <div className="flex border-b border-slate-200 space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{tabs.find((t) => t.value === activeTab)?.content}</div>
    </div>
  );
}

// ============================================
// BADGE COMPONENT
// ============================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`rounded-full font-medium inline-block ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// ============================================
// BUTTON COMPONENT
// ============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled = false,
  ...props
}: ButtonProps & { children?: React.ReactNode; className?: string; disabled?: boolean }) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:bg-slate-100',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
    outline: 'border-2 border-slate-300 text-slate-900 hover:border-slate-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`flex items-center justify-center space-x-2 rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {icon && !loading && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps & { className?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-900 mb-2">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-3 text-slate-400">{icon}</span>}
        <input
          className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, footer, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="border-b border-slate-200 p-6">
          {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="border-t border-slate-200 p-6 bg-slate-50">{footer}</div>}
    </div>
  );
}

// ============================================
// LOADING STATE COMPONENT
// ============================================

export function LoadingState({ rows = 5, height = 'h-12' }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${height} bg-slate-100 rounded animate-pulse`} />
      ))}
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-slate-500 mb-6">{description}</p>}
      {action && action}
    </div>
  );
}

// ============================================
// COUNTDOWN TIMER COMPONENT
// ============================================

interface CountdownTimerProps {
  endTime: number;
  onComplete?: () => void;
  format?: 'short' | 'long';
}

export function CountdownTimer({ endTime, onComplete, format = 'short' }: CountdownTimerProps) {
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      setRemaining(Math.max(0, diff));

      if (diff <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const seconds = Math.floor((remaining % 60000) / 1000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const hours = Math.floor(remaining / 3600000);

  const isUrgent = remaining < 60000;

  if (format === 'long') {
    return (
      <div className={`text-3xl font-mono font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
        {hours}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    );
  }

  return (
    <div className={`text-2xl font-mono font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
      {minutes}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  color = 'blue',
  animated = true,
}: ProgressBarProps) {
  const percentage = (value / max) * 100;

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div>
      {label && <p className="text-sm font-medium text-slate-900 mb-2">{label}</p>}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${colors[color]} h-full transition-all ${animated ? 'duration-500' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{Math.round(percentage)}%</p>
    </div>
  );
}

// ============================================
// CURRENCY INPUT COMPONENT
// ============================================

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  currency?: string;
  error?: string;
}

export function CurrencyInput({
  label,
  currency = '₹',
  error,
  ...props
}: CurrencyInputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-900 mb-2">{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-slate-400 font-medium">{currency}</span>
        <input
          type="number"
          className={`w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
            error ? 'border-red-500' : ''
          }`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ============================================
// SELECT COMPONENT
// ============================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ label: string; value: string }>;
  error?: string;
}

export function Select({ label, options, error, ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-900 mb-2">{label}</label>}
      <select
        className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
          error ? 'border-red-500' : ''
        }`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}