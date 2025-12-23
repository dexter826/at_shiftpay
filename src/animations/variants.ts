// Framer Motion Animation Variants - Centralized configuration

// Easing functions
export const easings = {
  smooth: [0.16, 1, 0.3, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  natural: [0.3, 0.7, 0.4, 1],
} as const;

// Fade animations
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide animations
export const slideVariants = {
  up: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  down: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  left: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  right: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

// Scale animations
export const scaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Modal/Dialog animations
export const modalVariants = {
  backdrop: fadeVariants,
  content: {
    initial: { opacity: 0, y: 16, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 16, scale: 0.95 },
  },
};

// Dropdown animations
export const dropdownVariants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
};

// Toast animations
export const toastVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

// Page transition animations
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Shimmer animation for skeleton
export const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { x: '100%' },
};

// Common transition configurations
export const transitions = {
  fast: { duration: 0.15, ease: easings.smooth },
  normal: { duration: 0.2, ease: easings.smooth },
  slow: { duration: 0.3, ease: easings.smooth },
  spring: { type: 'spring', stiffness: 400, damping: 25 } as const,
  bounce: { type: 'spring', stiffness: 300, damping: 20 } as const,
  smooth: { duration: 0.3, ease: easings.smooth },
  shimmer: { duration: 1.5, repeat: Infinity, ease: 'linear' } as const,
};

// Hover variants
export const hoverVariants = {
  scale: { scale: 1.05 },
  lift: { y: -2, transition: transitions.fast },
  glow: { filter: 'brightness(1.1)', transition: transitions.fast },
};

// Tap/Active variants
export const tapVariants = {
  scale: { scale: 0.95 },
  press: { scale: 0.98, y: 1 },
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};
