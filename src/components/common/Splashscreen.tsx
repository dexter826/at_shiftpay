import React, { useEffect } from 'react';
import Lottie from 'lottie-react';
import splashScreenAnimation from '../../assets/splashscreen.json';

const SPLASHSCREEN_DURATION = 2000;

interface SplashscreenProps {
    onComplete: () => void;
}

export const Splashscreen: React.FC<SplashscreenProps> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, SPLASHSCREEN_DURATION);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
            <div className="w-full max-w-md px-4">
                <Lottie animationData={splashScreenAnimation} loop={false} autoplay />
            </div>
        </div>
    );
};
