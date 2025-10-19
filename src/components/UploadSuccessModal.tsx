import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Users, Briefcase } from 'lucide-react';

interface UploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDashboard: () => void;
}

const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  isOpen,
  onClose,
  onGoToDashboard
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg max-w-md w-full p-8 text-center"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <motion.div
            className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-2xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Resume Uploaded Successfully!
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-gray-600 mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your resume has been uploaded and is now visible to employers for 7 days. 
            Your job preferences have been saved and we're processing your resume to extract key information.
          </motion.p>

          {/* Features */}
          <motion.div
            className="space-y-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Processing Resume</p>
                <p className="text-xs text-gray-500">AI is extracting your skills and experience</p>
              </div>
            </div>
            
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Matching with Employers</p>
                <p className="text-xs text-gray-500">Finding companies that match your preferences</p>
              </div>
            </div>
            
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Briefcase className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Active & Visible</p>
                <p className="text-xs text-gray-500">Your resume is now visible to employers</p>
              </div>
            </div>
          </motion.div>

          {/* Wait Message */}
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-blue-800 font-medium text-sm">
              🎉 Wait for opportunities to come your way!
            </p>
            <p className="text-blue-600 text-xs mt-1">
              You'll receive notifications when employers show interest in your profile.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={onGoToDashboard}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadSuccessModal;
