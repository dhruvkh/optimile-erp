import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { OptimileLogo } from './OptimileLogo';
import { Truck, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch {}
  };

  const demoLogins = [
    { label: 'CEO (All Access)', email: 'ceo@abclogistics.com' },
    { label: 'Fleet Manager', email: 'fleet@abclogistics.com' },
    { label: 'Finance Manager', email: 'finance@abclogistics.com' },
    { label: 'Procurement Head', email: 'procurement@abclogistics.com' },
    { label: 'Ops Head', email: 'ops@abclogistics.com' },
    { label: 'Regional Manager', email: 'regional@abclogistics.com' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary/80 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <OptimileLogo className="h-12 w-auto text-white mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Optimile ERP</h1>
          <p className="text-white/70 text-sm mt-1">Logistics Enterprise Resource Planning</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm pr-10"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember me</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick demo logins */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {demoLogins.map(d => (
                <button
                  key={d.email}
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('password123');
                  }}
                  className="text-left px-3 py-2 text-xs bg-gray-50 hover:bg-primary/5 border border-gray-100 rounded-lg transition-colors"
                >
                  <span className="font-medium text-gray-700">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
