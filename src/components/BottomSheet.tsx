/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 z-40 transition-opacity"
            id="sheet-backdrop"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white rounded-t-xl z-50 shadow-2xl max-h-[88vh] flex flex-col pb-safe lg:top-6 lg:right-6 lg:bottom-6 lg:left-auto lg:mx-0 lg:w-[420px] lg:max-w-none lg:max-h-none lg:rounded-none"
            id="sheet-container"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto my-3 flex-shrink-0 lg:hidden" id="sheet-handle" />

            {/* Title / Header */}
            <div className="flex items-center justify-between px-6 pb-3 border-b border-gray-100 flex-shrink-0" id="sheet-header">
              <h3 className="text-base font-semibold tracking-tight text-gray-800 truncate pr-3 min-w-0">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                id="sheet-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto px-6 py-4 flex-1 scrollbar-none" id="sheet-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
