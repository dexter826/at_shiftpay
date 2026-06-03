import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { ArrowDown } from "lucide-react";

const ArrowBigDownDashIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 40, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <ArrowDown size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

ArrowBigDownDashIcon.displayName = "ArrowBigDownDashIcon";

export default ArrowBigDownDashIcon;
