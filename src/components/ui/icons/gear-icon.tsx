import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Settings } from "lucide-react";

const GearIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Settings size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

GearIcon.displayName = "GearIcon";
export default GearIcon;
