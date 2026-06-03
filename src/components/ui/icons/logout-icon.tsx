import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { LogOut } from "lucide-react";

const LogoutIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <LogOut size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

LogoutIcon.displayName = "LogoutIcon";
export default LogoutIcon;
