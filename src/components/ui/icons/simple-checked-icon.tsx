import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Check } from "lucide-react";

const SimpleCheckedIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Check size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

SimpleCheckedIcon.displayName = "SimpleCheckedIcon";
export default SimpleCheckedIcon;
