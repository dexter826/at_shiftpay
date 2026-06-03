import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { ChevronDown } from "lucide-react";

const ChevronIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <ChevronDown size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

ChevronIcon.displayName = "ChevronIcon";
export default ChevronIcon;
