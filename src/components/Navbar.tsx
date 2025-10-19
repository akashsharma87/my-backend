import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, User, LogOut, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeButton, setActiveButton] = useState<'engineer' | 'employer' | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect active button based on current route
  useEffect(() => {
    if (location.pathname.includes('/engineer')) {
      setActiveButton('engineer');
    } else if (location.pathname.includes('/employer')) {
      setActiveButton('employer');
    } else {
      setActiveButton(null);
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    try {
      setIsLoggingOut(true);
      setShowProfile(false); // Close dropdown
      setIsOpen(false); // Close mobile menu

      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-mono-0 border-b border-mono-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-mono-1000 rounded-sm flex items-center justify-center group-hover:bg-mono-900 transition-colors duration-200">
                <Zap className="h-5 w-5 text-mono-0" />
              </div>
              <span className="text-xl font-medium text-mono-1000 tracking-tight">
                engineer.cv
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md bg-mono-100 hover:bg-mono-200 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-6 h-6 bg-mono-800 rounded-sm flex items-center justify-center">
                    <User className="h-4 w-4 text-mono-0" />
                  </div>
                  <span className="text-mono-900 font-medium text-sm">
                    {user.fullName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-mono-0 rounded-md shadow-minimal-lg border border-mono-200 py-1 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-mono-200">
                        <p className="text-sm font-medium text-mono-900">
                          {user.fullName || 'User'}
                        </p>
                        <p className="text-xs text-mono-600 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-mono-800 hover:bg-mono-100 transition-colors duration-200"
                        onClick={() => setShowProfile(false)}
                      >
                        <UserCircle className="h-4 w-4" />
                        <span className="text-sm">Profile</span>
                      </Link>
                      <Link
                        to={user.userType === 'engineer' ? '/engineer/dashboard' : '/employer/dashboard'}
                        className="flex items-center space-x-2 px-4 py-2 text-mono-800 hover:bg-mono-100 transition-colors duration-200"
                        onClick={() => setShowProfile(false)}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-mono-800 hover:bg-mono-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Signing out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm">Sign Out</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/engineer/auth">
                  <motion.button
                    onClick={() => setActiveButton('engineer')}
                    className={`px-4 py-2 font-medium transition-all duration-300 rounded-md relative overflow-hidden ${
                      activeButton === 'engineer'
                        ? 'bg-mono-1000 text-mono-0 shadow-minimal-md'
                        : 'text-mono-700 hover:text-mono-900 hover:bg-mono-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-mono-1000"
                      initial={{ x: '-100%' }}
                      animate={{ x: activeButton === 'engineer' ? '0%' : '-100%' }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    />
                    <span className="relative z-10">For Engineers</span>
                  </motion.button>
                </Link>
                <Link to="/employer/auth">
                  <motion.button
                    onClick={() => setActiveButton('employer')}
                    className={`px-4 py-2 font-medium transition-all duration-300 rounded-md relative overflow-hidden ${
                      activeButton === 'employer'
                        ? 'bg-mono-1000 text-mono-0 shadow-minimal-md'
                        : 'text-mono-700 hover:text-mono-900 hover:bg-mono-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-mono-1000"
                      initial={{ x: '-100%' }}
                      animate={{ x: activeButton === 'employer' ? '0%' : '-100%' }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    />
                    <span className="relative z-10">For Employers</span>
                  </motion.button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-mono-100 transition-colors duration-200"
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? (
                <X className="h-5 w-5 text-mono-800" />
              ) : (
                <Menu className="h-5 w-5 text-mono-800" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-mono-0 border-t border-mono-200"
          >
            <div className="px-4 py-4 space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-mono-200 mb-2">
                    <p className="text-sm font-medium text-mono-900">
                      {user.fullName || 'User'}
                    </p>
                    <p className="text-xs text-mono-600">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-3 text-mono-800 hover:bg-mono-100 rounded-md transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to={user.userType === 'engineer' ? '/engineer/dashboard' : '/employer/dashboard'}
                    className="flex items-center space-x-2 px-4 py-3 text-mono-800 hover:bg-mono-100 rounded-md transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-mono-800 hover:bg-mono-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/engineer/auth" onClick={() => setIsOpen(false)}>
                    <motion.button
                      onClick={() => setActiveButton('engineer')}
                      className={`w-full px-4 py-3 font-medium rounded-md transition-all duration-300 relative overflow-hidden ${
                        activeButton === 'engineer'
                          ? 'bg-mono-1000 text-mono-0 shadow-minimal-md'
                          : 'text-mono-700 hover:bg-mono-100'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-mono-1000"
                        initial={{ x: '-100%' }}
                        animate={{ x: activeButton === 'engineer' ? '0%' : '-100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      />
                      <span className="relative z-10">For Engineers</span>
                    </motion.button>
                  </Link>
                  <Link to="/employer/auth" onClick={() => setIsOpen(false)}>
                    <motion.button
                      onClick={() => setActiveButton('employer')}
                      className={`w-full px-4 py-3 font-medium rounded-md transition-all duration-300 relative overflow-hidden ${
                        activeButton === 'employer'
                          ? 'bg-mono-1000 text-mono-0 shadow-minimal-md'
                          : 'text-mono-700 hover:bg-mono-100'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-mono-1000"
                        initial={{ x: '-100%' }}
                        animate={{ x: activeButton === 'employer' ? '0%' : '-100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      />
                      <span className="relative z-10">For Employers</span>
                    </motion.button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}