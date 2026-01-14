import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { AnimatedIconHandle, AnimatedIconProps } from './types';

const ExportIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", className = "" }, ref) => {
    const controls = useAnimation();
    const [isHovered, setIsHovered] = useState(false);

    useImperativeHandle(ref, () => ({
      startAnimation: () => {
        setIsHovered(true);
        controls.start("animate");
      },
      stopAnimation: () => {
        setIsHovered(false);
        controls.start("normal");
      },
    }));

    const arrowVariants = {
      normal: { y: 0 },
      animate: {
        y: 2,
        transition: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut"
        }
      }
    };

    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        onMouseEnter={() => {
            setIsHovered(true);
            controls.start("animate");
        }}
        onMouseLeave={() => {
            setIsHovered(false);
            controls.start("normal");
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* U-shape / Tray */}
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          
          {/* Arrow Down Group */}
          <motion.g
            variants={arrowVariants}
            initial="normal"
            animate={controls}
          >
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </motion.g>
        </svg>
      </div>
    );
  }
);

ExportIcon.displayName = 'ExportIcon';

export default ExportIcon;
