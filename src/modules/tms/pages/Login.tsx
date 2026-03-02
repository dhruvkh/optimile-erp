import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { OptimileLogo } from '../components/common/OptimileLogo';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    rememberMe: false 
  });
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      // Navigation happens in useEffect above or implicitly via state change
    } catch (err) {
      // Error handled by context or we can set it here
      setLocalError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill for demo purposes (optional)
  const fillDemo = (role: string) => {
    const demos: Record<string, any> = {
      ceo: { email: 'ceo@company.com', password: 'password123' },
      ops: { email: 'ops@company.com', password: 'password123' },
      regional: { email: 'regional@company.com', password: 'password123' },
    };
    if (demos[role]) {
      setFormData(prev => ({ ...prev, ...demos[role] }));
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-[#0f2a42] opacity-90 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
          alt="Logistics" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center space-x-3">
            <OptimileLogo className="h-12 w-auto text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Streamline Your Logistics Operations
            </h1>
            <p className="text-lg text-blue-100 max-w-md leading-relaxed">
              Manage your fleet, track shipments, and optimize delivery routes with our advanced Transport Management System.
            </p>
            <div className="mt-8 flex items-center space-x-4 text-sm text-blue-200">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> Real-time tracking
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> Fleet analytics
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> Route optimization
              </div>
            </div>
          </div>
          <div className="text-sm text-blue-300">
            © 2024 Optimile TMS. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="lg:hidden mb-8">
             <div className="flex items-center justify-center">
                <OptimileLogo className="h-12 w-auto text-primary" />
             </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your details to sign in
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  placeholder="name@company.com"
                  required
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  required
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
                  endIcon={showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  onEndIconClick={() => setShowPassword(!showPassword)}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <a href="#" className="font-medium text-primary hover:text-secondary">
                      Forgot password?
                    </a>
                  </div>
                </div>
                
                {(localError || authError) && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{localError || authError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    className="w-full flex justify-center py-3"
                    isLoading={loading}
                    size="lg"
                  >
                    Sign in <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Quick Login (Demo)
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  onClick={() => fillDemo('ceo')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  CEO
                </button>
                <button
                  onClick={() => fillDemo('ops')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Ops Head
                </button>
                <button
                   onClick={() => fillDemo('regional')}
                   className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                   Regional
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};