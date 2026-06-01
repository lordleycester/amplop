/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string | null;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 10, x: '-50%' }}
          className="fixed bottom-[74px] left-1/2 -translate-x-1/2 bg-neutral-900/95 text-white rounded-lg px-4 py-2.5 text-xs flex items-center justify-between gap-4 z-[99] shadow-lg backdrop-blur-md max-w-[88%] w-max transition-all"
          id="toast-element"
        >
          <span className="font-medium" id="toast-message">{message}</span>
          {actionLabel && onAction && (
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              className="bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-500 text-white font-bold rounded-md px-3 py-1 text-[11px] whitespace-nowrap transition-colors"
              id="toast-btn"
            >
              {actionLabel}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
