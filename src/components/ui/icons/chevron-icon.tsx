import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const ChevronIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      // Nhún nhẹ xuống
      animate(scope.current, { y: 2 }, { duration: 0.2, ease: "easeOut" });
    }, [animate, scope]);

    const stop = useCallback(async () => {
      // Trở lại trạng thái cũ
      animate(scope.current, { y: 0 }, { duration: 0.2, ease: "easeInOut" });
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
        <path d="M6 9l6 6l6 -6" />
      </motion.svg>
    );
  },
);

ChevronIcon.displayName = "ChevronIcon";
export default ChevronIcon;
