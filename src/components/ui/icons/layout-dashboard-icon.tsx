import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { LayoutDashboard } from "lucide-react";

const LayoutDashboardIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 40, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <LayoutDashboard size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

LayoutDashboardIcon.displayName = "LayoutDashboardIcon";

export default LayoutDashboardIcon;
