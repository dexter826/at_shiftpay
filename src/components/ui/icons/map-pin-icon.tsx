import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimation } from "framer-motion";

const MapPinIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const controls = useAnimation();
    const rippleControls = useAnimation();

    const start = useCallback(() => {
        // Pin Jump
        controls.start({
            y: [0, -8, 0],
            transition: {
                duration: 0.5,
                times: [0, 0.4, 1],
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1
            }
        });

        // Ripple Effect (expands when pin lands)
        rippleControls.start({
            opacity: [0, 0.5, 0],
            scale: [0.5, 1.2, 1.5],
            pathLength: [0, 1],
            transition: {
                duration: 0.5,
                times: [0.4, 0.5, 1], // Sync with pin landing around 0.4-0.5
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeOut"
            }
        });
    }, [controls, rippleControls]);

    const stop = useCallback(() => {
        controls.stop();
        rippleControls.stop();
        
        controls.start({
            y: 0,
            transition: { duration: 0.2 }
        });
        rippleControls.start({ opacity: 0 });
    }, [controls, rippleControls]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        onMouseEnter={start}
        onMouseLeave={stop}
        style={{ overflow: 'visible' }} 
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ overflow: 'visible' }}
        >
          {/* Ripple Effect at the bottom tip (approx x=12, y=21-22) */}
           <motion.ellipse
            cx="12"
            cy="21"
            rx="4"
            ry="2"
            stroke={color}
            strokeWidth={1}
            initial={{ opacity: 0, scale: 0 }}
            animate={rippleControls}
          />

          <motion.g animate={controls}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </motion.g>
        </svg>
      </div>
    );
  }
);

MapPinIcon.displayName = "MapPinIcon";
export default MapPinIcon;
