import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { Wallet } from "lucide-react";

const WalletIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 40, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }));

    return <Wallet size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  },
);

WalletIcon.displayName = "WalletIcon";

export default WalletIcon;
