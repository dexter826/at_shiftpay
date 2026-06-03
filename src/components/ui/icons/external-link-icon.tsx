import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { ExternalLink } from "lucide-react";

const ExternalLinkIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <ExternalLink size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

ExternalLinkIcon.displayName = "ExternalLinkIcon";
export default ExternalLinkIcon;
