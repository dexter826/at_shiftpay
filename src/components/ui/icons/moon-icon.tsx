import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Moon } from "lucide-react";

const MoonIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Moon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

MoonIcon.displayName = "MoonIcon";

export default MoonIcon;
