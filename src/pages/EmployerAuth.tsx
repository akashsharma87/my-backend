import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Building, } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { config } from '../config/api';
import Navbar from '../components/Navbar';

export default function EmployerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const oauthError = searchParams.get('error');

    if (token && userParam) {
      try {
        // Store token and user data for session persistence
        localStorage.setItem('token', token);
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('✅ OAuth login successful', userData);

        // Force a page reload to trigger AuthContext to pick up the new data
        // This ensures the user state is properly set before navigating
        window.location.href = '/employer/dashboard';
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError('Authentication failed. Please try again.');
      }
    } else if (oauthError) {
      const message = searchParams.get('message');
      setError(message ? decodeURIComponent(message) : 'OAuth authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    window.location.href = `${config.API_BASE_URL.replace('/api', '')}/api/auth/${provider}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signIn(email, password, 'employer');
      } else {
        await signUp(email, password, fullName, 'employer');
      }
      navigate('/employer/dashboard');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mono-0">
      <Navbar />

      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Side - Content */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-16 h-16 bg-mono-1000 rounded-sm flex items-center justify-center mb-6 mx-auto lg:mx-0">
              <Building className="h-8 w-8 text-mono-0" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-mono-1000 mb-4">
              Employer Portal
            </h1>
            <p className="text-lg text-mono-600 mb-8 leading-relaxed">
              {isLogin ? 'Welcome back to your talent dashboard' : 'Connect with exceptional engineering talent'}
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-8">
              {[
                {
                  title: "Quality Talent",
                  description: "Access a curated pool of verified engineers with proven track records and technical expertise."
                },
                {
                  title: "Smart Filtering",
                  description: "Find the perfect match with advanced search filters for skills, experience, and location."
                },
                {
                  title: "Fast Hiring",
                  description: "Streamlined process from discovery to hire. Connect directly with candidates in days, not weeks."
                }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4 text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                >
                  <div className="w-8 h-8 bg-mono-100 rounded-sm flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-mono-1000 rounded-full"></div>
                  </div>
                  <div>
                    <h5 className="font-medium text-mono-1000 mb-1">{benefit.title}</h5>
                    <p className="text-sm text-mono-600 leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-6 pt-6 border-t border-mono-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {[
                { number: "500+", label: "Companies" },
                { number: "10K+", label: "Engineers" },
                { number: "2.3 days", label: "Avg Hire Time" }
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="text-2xl font-light text-mono-1000 mb-1">{stat.number}</div>
                  <div className="text-xs text-mono-600 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            className="w-full max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="card-minimal p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-medium text-mono-1000 mb-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-mono-600 text-sm">
                  {isLogin ? 'Access your employer dashboard' : 'Start hiring top engineers'}
                </p>
              </div>
              {error && (
                <motion.div
                  className="bg-mono-100 border border-mono-300 text-mono-800 px-4 py-3 rounded-md mb-6 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="form-label text-mono-800">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mono-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="form-input w-full pl-12 pr-4 py-3 rounded-md border-mono-300 focus:border-mono-900 focus:ring-mono-900/20"
                        placeholder="Your company name"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <label className="form-label text-mono-800">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mono-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input w-full pl-12 pr-4 py-3 rounded-md border-mono-300 focus:border-mono-900 focus:ring-mono-900/20"
                      placeholder="company@email.com"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <label className="form-label text-mono-800">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mono-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input w-full pl-12 pr-4 py-3 rounded-md border-mono-300 focus:border-mono-900 focus:ring-mono-900/20"
                      placeholder="Your password"
                      required
                    />
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-mono-500 mt-2">
                      Minimum 8 characters
                    </p>
                  )}
                </motion.div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-mono-0 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* OAuth Buttons */}
              <div className="space-y-4 mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-mono-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-mono-0 text-mono-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => handleOAuthLogin('google')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-mono-300 rounded-md bg-mono-0 text-mono-700 hover:bg-mono-50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </motion.button>

                  <motion.button
                    onClick={() => handleOAuthLogin('github')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-mono-300 rounded-md bg-mono-0 text-mono-700 hover:bg-mono-50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </motion.button>
                </div>
              </div>

              <div className="space-y-6 mt-8">
                <div className="text-center">
                  <motion.button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-mono-700 hover:text-mono-900 font-medium transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </motion.button>
                </div>

                <div className="text-center pt-6 border-t border-mono-200">
                  <p className="text-mono-600 mb-3 text-sm">Looking for engineering opportunities?</p>
                  <Link to="/engineer/auth">
                    <motion.button
                      className="btn-ghost px-4 py-2 rounded-md text-sm font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      Engineer Sign Up
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}