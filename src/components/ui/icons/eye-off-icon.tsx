import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { EyeOff } from "lucide-react";

const EyeOffIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <EyeOff size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

EyeOffIcon.displayName = "EyeOffIcon";
export default EyeOffIcon;
