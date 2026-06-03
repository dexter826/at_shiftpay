import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Trash2 } from "lucide-react";

const TrashIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Trash2 size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

TrashIcon.displayName = "TrashIcon";
export default TrashIcon;
