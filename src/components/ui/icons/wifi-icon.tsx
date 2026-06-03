import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Wifi } from "lucide-react";

const WifiIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Wifi size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

WifiIcon.displayName = "WifiIcon";
export default WifiIcon;
