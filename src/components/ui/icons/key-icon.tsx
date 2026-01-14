'use client';

import React, {  useImperativeHandle, forwardRef, useRef } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { AnimatedIconHandle, AnimatedIconProps } from './types';

const KeyIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = 'currentColor', className, ...props }, ref) => {
    const controls = useAnimation();
    const isAnimating = useRef(false);

    useImperativeHandle(ref, () => ({
      startAnimation: async () => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        
        // Rotate key and unlock movement
        await controls.start('animate');
        isAnimating.current = false;
      },
      stopAnimation: () => {
        if (isAnimating.current) return;
        controls.start('normal');
      },
    }));

    const keyVariants: Variants = {
      normal: { 
        rotate: 0,
        x: 0
      },
      animate: {
        rotate: [0, 45, 0],
        x: [0, 2, 0],
        transition: {
          duration: 0.5,
          ease: "easeInOut"
        }
      }
    };

    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        {...props}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.g
            variants={keyVariants}
            initial="normal"
            animate={controls}
            originX={9} // Adjusted origin for rotation
            originY={12}
          >
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3L22 7l-3-3" />
          </motion.g>
        </motion.svg>
      </div>
    );
  }
);

KeyIcon.displayName = 'KeyIcon';

export default KeyIcon;
