import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { ChevronRight } from "lucide-react";

const ChevronRightIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <ChevronRight size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

ChevronRightIcon.displayName = "ChevronRightIcon";
export default ChevronRightIcon;
