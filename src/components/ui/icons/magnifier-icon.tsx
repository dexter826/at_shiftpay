import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Search } from "lucide-react";

const MagnifierIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Search size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

MagnifierIcon.displayName = "MagnifierIcon";
export default MagnifierIcon;
