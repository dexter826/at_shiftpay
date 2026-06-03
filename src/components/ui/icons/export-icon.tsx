import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Download } from "lucide-react";

const ExportIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Download size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

ExportIcon.displayName = "ExportIcon";

export default ExportIcon;
