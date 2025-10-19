import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AuthProvider from './context/AuthContext';
import ResumesProvider from './context/ResumesContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const EngineerAuth = React.lazy(() => import('./pages/EngineerAuth'));
const EmployerAuth = React.lazy(() => import('./pages/EmployerAuth'));
const EngineerDashboard = React.lazy(() => import('./pages/EngineerDashboard'));
const EmployerDashboard = React.lazy(() => import('./pages/EmployerDashboard'));
const ResumeUpload = React.lazy(() => import('./pages/ResumeUpload'));
const ResumeBrowser = React.lazy(() => import('./pages/ResumeBrowser'));
const ResumeView = React.lazy(() => import('./pages/ResumeView'));
const EmployerResumeView = React.lazy(() => import('./pages/EmployerResumeView'));
const Profile = React.lazy(() => import('./pages/Profile'));

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ResumesProvider>
            <Router>
              <div className="min-h-screen bg-mono-0">
                <AnimatePresence mode="wait">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/engineer/auth" element={<EngineerAuth />} />
                      <Route path="/employer/auth" element={<EmployerAuth />} />
                      <Route path="/engineer/dashboard" element={<EngineerDashboard />} />
                      <Route path="/employer/dashboard" element={<EmployerDashboard />} />
                      <Route path="/engineer/upload" element={<ResumeUpload />} />
                      <Route path="/employer/browse" element={<ResumeBrowser />} />
                      <Route path="/resume/:id" element={<ResumeView />} />
                      <Route path="/employer/resume/:id" element={<EmployerResumeView />} />
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </Suspense>
                </AnimatePresence>
              </div>
            </Router>
          </ResumesProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;