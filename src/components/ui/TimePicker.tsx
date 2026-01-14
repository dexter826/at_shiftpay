import React, { useState, useRef, useEffect } from "react";
import "@ncdai/react-wheel-picker/style.css";
import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker";
import { cn } from "@/lib/utils";
import { Clock, ChevronDown } from "lucide-react";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { motion, AnimatePresence } from "framer-motion";

type WheelPickerOption = WheelPickerPrimitive.WheelPickerOption;
type WheelPickerClassNames = WheelPickerPrimitive.WheelPickerClassNames;

/**
 * Wrapper cho bộ chọn vòng xoay.
 */
function WheelPickerWrapper({
  className,
  ...props
}: React.ComponentProps<typeof WheelPickerPrimitive.WheelPickerWrapper>) {
  const { cardBgClass } = useThemeStyles();
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn(
        "rounded-lg px-1 shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        cardBgClass,
        "[&>[data-rwp]]:first:[&>[data-rwp-highlight-wrapper]]:rounded-s-md",
        "[&>[data-rwp]]:last:[&>[data-rwp-highlight-wrapper]]:rounded-e-md",
        className
      )}
      {...props}
    />
  );
}

/**
 * Component bộ chọn vòng xoay đơn lẻ.
 */
function WheelPicker({
  classNames,
  ...props
}: React.ComponentProps<typeof WheelPickerPrimitive.WheelPicker>) {
  const { textMutedClass, textPrimaryClass, highlightBgClass } = useThemeStyles();
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        container: "flex-1",
        optionItem: cn("text-base", textMutedClass),
        highlightWrapper: cn(
          "font-bold text-lg",
          highlightBgClass,
          textPrimaryClass
        ),
        ...classNames,
      }}
      {...props}
    />
  );
}

interface TimePickerProps {
  value: string; // Định dạng HH:mm
  onChange: (value: string) => void;
  className?: string;
}

const hoursOptions = Array.from({ length: 24 }, (_, i) => ({
  label: i.toString().padStart(2, "0"),
  value: i,
}));

const minutesOptions = Array.from({ length: 60 }, (_, i) => ({
  label: i.toString().padStart(2, "0"),
  value: i,
}));

/**
 * Component chọn giờ chính.
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const {
    inputBgClass,
    inputBorderClass,
    textPrimaryClass,
    textMutedClass,
    cardBgClass,
    borderClass,
  } = useThemeStyles();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hours, minutes] = value ? value.split(":").map(Number) : [7, 30];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatNumber = (n: number) => n.toString().padStart(2, "0");

  const handleHourChange = (newHour: any) => {
    onChange(`${formatNumber(newHour as number)}:${formatNumber(minutes)}`);
  };

  const handleMinuteChange = (newMinute: any) => {
    onChange(`${formatNumber(hours)}:${formatNumber(newMinute as number)}`);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full p-2.5 border rounded-lg text-sm focus:outline-none flex items-center justify-between transition-all",
          inputBgClass,
          inputBorderClass,
          textPrimaryClass,
          "focus:border-primary/50"
        )}
      >
        <span className="flex items-center gap-2">
          <Clock size={14} className={textMutedClass} />
          {formatNumber(hours)}:{formatNumber(minutes)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            size={14}
            className={textMutedClass}
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-1 p-3 border rounded-xl z-50 shadow-2xl",
              cardBgClass,
              borderClass
            )}
          >
              <div className="flex justify-center">
                <WheelPickerWrapper className="w-full h-40">
                  <WheelPicker
                    options={hoursOptions}
                    value={hours}
                    onValueChange={handleHourChange}
                  />
                  <div className={cn("flex items-center px-1 font-bold", textMutedClass)}>:</div>
                  <WheelPicker
                    options={minutesOptions}
                    value={minutes}
                    onValueChange={handleMinuteChange}
                  />
                </WheelPickerWrapper>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { WheelPicker, WheelPickerWrapper };
export type { WheelPickerClassNames, WheelPickerOption };
