import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { ChevronLeft } from "lucide-react";

const ChevronLeftIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <ChevronLeft size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

ChevronLeftIcon.displayName = "ChevronLeftIcon";
export default ChevronLeftIcon;
