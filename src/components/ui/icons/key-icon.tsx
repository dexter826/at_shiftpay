import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Key } from "lucide-react";

const KeyIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Key size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

KeyIcon.displayName = "KeyIcon";

export default KeyIcon;
