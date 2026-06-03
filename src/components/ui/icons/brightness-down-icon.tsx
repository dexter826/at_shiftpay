import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Sun } from "lucide-react";

const BrightnessDownIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Sun size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

BrightnessDownIcon.displayName = "BrightnessDownIcon";

export default BrightnessDownIcon;
