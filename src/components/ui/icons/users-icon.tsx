import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Users } from "lucide-react";

const UsersIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Users size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

UsersIcon.displayName = "UsersIcon";
export default UsersIcon;
