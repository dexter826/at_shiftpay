import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const PlusIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      // Xoay 90 độ và phóng to nhẹ
      animate(scope.current, 
        { rotate: 90, scale: 1.1 }, 
        { duration: 0.3, ease: "backOut" }
      );
    }, [animate, scope]);

    const stop = useCallback(async () => {
      // Trở lại trạng thái cũ
      animate(scope.current, 
        { rotate: 0, scale: 1 }, 
        { duration: 0.2, ease: "easeInOut" }
      );
    }, [animate, scope]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
        onHoverStart={start}
        onHoverEnd={stop}
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </motion.svg>
    );
  },
);

PlusIcon.displayName = "PlusIcon";
export default PlusIcon;
