import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { MapPin } from "lucide-react";

const MapPinIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <MapPin size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

MapPinIcon.displayName = "MapPinIcon";
export default MapPinIcon;
