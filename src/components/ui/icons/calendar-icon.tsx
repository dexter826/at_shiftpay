import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Calendar } from "lucide-react";

const CalendarIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Calendar size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

CalendarIcon.displayName = "CalendarIcon";
export default CalendarIcon;
