import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationErrorProps {
  message: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ height: 0, opacity: 0, marginTop: 0 }}
        animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
        exit={{ height: 0, opacity: 0, marginTop: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="text-red-500 text-xs ml-1 font-medium leading-tight">{message}</p>
      </motion.div>
    )}
  </AnimatePresence>
);
