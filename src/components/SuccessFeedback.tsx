/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Trash2 } from 'lucide-react';

interface SuccessFeedbackProps {
  type: 'created' | 'deleted';
  message: string;
  onClose: () => void;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2200); // Close automatically after 2.2 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  // SVG drawing checkmark configuration
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.2, type: "spring", stiffness: 100, damping: 15 },
        opacity: { delay: 0.2, duration: 0.01 }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white dark:bg-zinc-900 border border-gray-150/40 dark:border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
      >
        {/* Background ambient light */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-10 ${
          type === 'created' ? 'bg-emerald-500' : 'bg-red-500'
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-10 ${
          type === 'created' ? 'bg-teal-500' : 'bg-orange-500'
        }`} />

        <div className="flex flex-col items-center justify-center">
          {type === 'created' ? (
            <div className="relative mb-6">
              {/* Animated drawing circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500"
              >
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M20 6L9 17L4 12"
                    variants={draw}
                    initial="hidden"
                    animate="visible"
                  />
                </svg>
              </motion.div>
              {/* Confetti or sparkles (micro motion particles) */}
              <motion.span
                animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ delay: 0.5, duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full"
              />
              <motion.span
                animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 0] }}
                transition={{ delay: 0.3, duration: 0.7, repeat: Infinity, repeatDelay: 1.2 }}
                className="absolute -bottom-1 -left-2 w-2.5 h-2.5 bg-emerald-400 rounded-full"
              />
            </div>
          ) : (
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-red-50/80 dark:bg-red-950/20 border-2 border-red-500/20 flex items-center justify-center text-red-500"
              >
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ delay: 0.2, duration: 0.5, type: "tween", ease: "easeInOut" }}
                >
                  <Trash2 className="w-9 h-9 stroke-[2.2]" />
                </motion.div>
              </motion.div>
              <motion.span
                animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ delay: 0.4, duration: 0.7, repeat: Infinity, repeatDelay: 1.1 }}
                className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-400 rounded-full"
              />
              <motion.span
                animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 0] }}
                transition={{ delay: 0.6, duration: 0.8, repeat: Infinity, repeatDelay: 1.3 }}
                className="absolute -bottom-1 -right-2 w-3 h-3 bg-orange-400 rounded-full"
              />
            </div>
          )}

          <motion.h4
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-extrabold text-gray-950 dark:text-zinc-50 mb-2 tracking-tight"
          >
            {type === 'created' ? '¡Hecho Exitosamente!' : '¡Eliminado!'}
          </motion.h4>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-gray-500 dark:text-zinc-400 font-medium max-w-[240px] leading-relaxed"
          >
            {message}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};
