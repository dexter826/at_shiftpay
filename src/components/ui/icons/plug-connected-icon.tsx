import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Plug } from "lucide-react";

const PlugConnectedIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Plug size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

PlugConnectedIcon.displayName = "PlugConnectedIcon";
export default PlugConnectedIcon;
