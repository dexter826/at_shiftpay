import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { ArrowLeft } from "lucide-react";

const ArrowNarrowLeftIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <ArrowLeft size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

ArrowNarrowLeftIcon.displayName = "ArrowNarrowLeftIcon";

export default ArrowNarrowLeftIcon;
