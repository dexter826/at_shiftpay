import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Pen } from "lucide-react";

const PenIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Pen size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

PenIcon.displayName = "PenIcon";
export default PenIcon;
