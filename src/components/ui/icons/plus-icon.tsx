import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Plus } from "lucide-react";

const PlusIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Plus size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

PlusIcon.displayName = "PlusIcon";
export default PlusIcon;
