import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchMoveRaw = (e: TouchEvent) => {
      if (startYRef.current === 0 || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (distance > 0 && scrollTop <= 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('touchmove', handleTouchMoveRaw, { passive: false });
    return () => {
      container.removeEventListener('touchmove', handleTouchMoveRaw);
    };
  }, [isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (distance > 0 && scrollTop <= 0) {
      // Resistance effect
      const pull = Math.min(distance * 0.4, PULL_THRESHOLD + 20);
      setPullDistance(pull);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
    startYRef.current = 0;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
      style={{ overscrollBehaviorY: pullDistance > 0 ? 'none' : 'auto' }}
    >
      <div 
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-50"
        style={{ 
          top: -40,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance / PULL_THRESHOLD
        }}
      >
        <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
          <RefreshCw 
            size={20} 
            className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      </div>
      <motion.div
        animate={{ y: pullDistance }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
