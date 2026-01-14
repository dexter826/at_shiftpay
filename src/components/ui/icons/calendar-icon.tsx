import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const CalendarIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      // Nhảy nhẹ khung lịch
      animate(scope.current, { scale: 1.05 }, { duration: 0.2 });

      // Lắc các vòng móc ở trên
      animate(".cal-hook", { y: -2 }, { duration: 0.2, repeat: 1, repeatType: "reverse" });

      // Di chuyển các dòng kẻ bên trong (như lật trang)
      animate(".cal-line-1", { x: 3, opacity: 0.5 }, { duration: 0.3 });
      animate(".cal-line-2", { x: -3, opacity: 0.5 }, { duration: 0.3, delay: 0.1 });
    }, [animate, scope]);

    const stop = useCallback(async () => {
      animate(scope.current, { scale: 1 }, { duration: 0.2 });
      animate(".cal-hook", { y: 0 }, { duration: 0.2 });
      animate(".cal-line-1, .cal-line-2", { x: 0, opacity: 1 }, { duration: 0.2 });
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
        {/* Khung lịch */}
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        
        {/* Móc treo */}
        <motion.line className="cal-hook" x1="16" y1="2" x2="16" y2="6" />
        <motion.line className="cal-hook" x1="8" y1="2" x2="8" y2="6" />
        
        {/* Đường kẻ ngang tách tiêu đề */}
        <line x1="3" y1="10" x2="21" y2="10" />

        {/* Các dòng kẻ đại diện cho ngày/tuần */}
        <motion.line className="cal-line-1" x1="8" y1="14" x2="8.01" y2="14" strokeWidth={strokeWidth + 1} />
        <motion.line className="cal-line-1" x1="12" y1="14" x2="12.01" y2="14" strokeWidth={strokeWidth + 1} />
        <motion.line className="cal-line-1" x1="16" y1="14" x2="16.01" y2="14" strokeWidth={strokeWidth + 1} />
        
        <motion.line className="cal-line-2" x1="8" y1="18" x2="8.01" y2="18" strokeWidth={strokeWidth + 1} />
        <motion.line className="cal-line-2" x1="12" y1="18" x2="12.01" y2="18" strokeWidth={strokeWidth + 1} />
        <motion.line className="cal-line-2" x1="16" y1="18" x2="16.01" y2="18" strokeWidth={strokeWidth + 1} />
      </motion.svg>
    );
  },
);

CalendarIcon.displayName = "CalendarIcon";
export default CalendarIcon;
