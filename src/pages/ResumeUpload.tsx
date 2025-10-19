import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, File, X, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useResumes } from '../hooks/useResumes';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';
import { validateFile } from '../utils/validation';
import { handleFileUploadError } from '../utils/errorHandler';
import JobPreferencesModal from '../components/JobPreferencesModal';
import UploadSuccessModal from '../components/UploadSuccessModal';

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showJobPreferencesModal, setShowJobPreferencesModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { user } = useAuth();
  const { uploadResume } = useResumes();
  const toast = useToast();
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validation = validateFile(droppedFile, {
        maxSize: 10485760,
        allowedTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        required: true
      });
      if (validation.isValid) {
        setFile(droppedFile);
        setError('');
        toast.success('File selected successfully', `${droppedFile.name} is ready to upload`);
      } else {
        setError(validation.errors[0]);
        toast.error('Invalid file', validation.errors[0]);
      }
    }
  }, [toast]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validation = validateFile(selectedFile, {
        maxSize: 10485760,
        allowedTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        required: true
      });
      if (validation.isValid) {
        setFile(selectedFile);
        setError('');
        toast.success('File selected successfully', `${selectedFile.name} is ready to upload`);
      } else {
        setError(validation.errors[0]);
        toast.error('Invalid file', validation.errors[0]);
      }
    }
  };



  const handleUpload = async () => {
    if (!file || !user) {
      toast.error('Missing requirements', 'Please select a file and ensure you are logged in');
      return;
    }
    setShowJobPreferencesModal(true);
  };

  const handleJobPreferencesSubmit = async (jobPreferences) => {
    if (!file || !user) return;
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobPreferences', JSON.stringify(jobPreferences));
      // Auto-activate the resume on upload
      formData.append('autoActivate', 'true');
      await uploadResume(formData);
      setShowJobPreferencesModal(false);
      setShowSuccessModal(true);
      toast.success('Upload successful!', 'Your resume has been uploaded and is now visible to employers');
    } catch (error) {
      const appError = handleFileUploadError(error);
      setError(appError.message);
      toast.error('Upload failed', appError.message);
      setShowJobPreferencesModal(false);
      console.error('Upload error:', appError);
    } finally {
      setUploading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/engineer/dashboard');
  };

  // Main Upload UI
  return (
    <div className="min-h-screen bg-mono-0">
      <Navbar />
      {/* Animated BG stays as before */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* ...motion background elements... */}
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          className="card-minimal max-w-lg w-full mx-auto p-10 rounded-md shadow-lg bg-white"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 130 }}
        >
          <motion.div
            className="w-16 h-16 bg-mono-1000 rounded-sm flex items-center justify-center mx-auto mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.7, type: "spring", stiffness: 160 }}
          >
            <Upload className="h-8 w-8 text-mono-0" />
          </motion.div>
          <motion.h1
            className="text-3xl font-light text-mono-1000 mb-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Upload Resume
          </motion.h1>
          <motion.p
            className="text-mono-600 mb-8 leading-relaxed text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Share your expertise with leading companies. PDF/Word documents up to 10MB.
          </motion.p>

          {/* File Select/Drag & Drop */}
          {!file ? (
            <motion.div
              className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer group mb-8 transition-all duration-500 ${
                dragActive ? 'border-mono-1000 bg-mono-50' : 'border-mono-300 hover:border-mono-600 hover:bg-mono-25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="mb-6"
                animate={dragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Upload className={`h-12 w-12 mx-auto ${
                  dragActive ? 'text-mono-1000' : 'text-mono-400 group-hover:text-mono-600'
                }`} />
              </motion.div>
              <motion.h3
                className="text-lg font-medium text-mono-1000 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                Drop your resume here or
              </motion.h3>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload">
                <span className="btn-primary px-8 py-2 rounded-sm font-medium cursor-pointer inline-block mt-2">
                  Choose File
                </span>
              </label>
            </motion.div>
          ) : (
            <motion.div
              className="bg-mono-50 border border-mono-200 rounded-sm p-5 flex items-center justify-between mb-8"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 140 }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-mono-1000 rounded-sm flex items-center justify-center">
                  <File className="h-5 w-5 text-mono-0" />
                </div>
                <div>
                  <p className="font-medium text-mono-1000">{file.name}</p>
                  <p className="text-xs text-mono-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 text-mono-500 hover:text-mono-1000 rounded-sm hover:bg-mono-100 transition-all"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-mono-50 border border-mono-300 text-mono-800 px-4 py-2 rounded-sm flex items-center mb-4">
              <AlertCircle className="h-4 w-4 mr-2 text-mono-600" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Upload Button */}
          <motion.button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary w-full px-8 py-3 rounded-sm font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group flex items-center justify-center"
            whileHover={{ 
              scale: file && !uploading ? 1.01 : 1, 
              y: file && !uploading ? -2 : 0 
            }}
            whileTap={{ scale: file && !uploading ? 0.97 : 1 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <motion.div
                  className="w-5 h-5 border-2 border-mono-0 border-t-transparent rounded-full mr-3"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Uploading...
              </span>
            ) : (
              <>
                <span className="relative z-10">Upload Resume</span>
                <span className="inline-block ml-3 h-5 w-5 relative z-10">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Modal dialogs */}
      <JobPreferencesModal
        isOpen={showJobPreferencesModal}
        onClose={() => setShowJobPreferencesModal(false)}
        onSubmit={handleJobPreferencesSubmit}
        loading={uploading}
      />
      <UploadSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onGoToDashboard={handleSuccessModalClose}
      />
    </div>
  );
}
