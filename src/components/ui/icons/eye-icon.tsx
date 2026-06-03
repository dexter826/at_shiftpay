import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Eye } from "lucide-react";

const EyeIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Eye size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

EyeIcon.displayName = "EyeIcon";
export default EyeIcon;
