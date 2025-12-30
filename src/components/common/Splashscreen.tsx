import React, { useEffect } from 'react';
import Lottie from 'lottie-react';
import splashScreenAnimation from '../../assets/splashscreen.json';
import { useThemeStyles } from '../../hooks/useThemeStyles';

const SPLASHSCREEN_KEY = 'splashscreen_shown';
const SPLASHSCREEN_DURATION = 2000; // 2 giây

interface SplashscreenProps {
    onComplete: () => void;
}

export const Splashscreen: React.FC<SplashscreenProps> = ({ onComplete }) => {
    const { bgClass } = useThemeStyles();

    useEffect(() => {
        // Đánh dấu đã hiển thị
        sessionStorage.setItem(SPLASHSCREEN_KEY, 'true');

        // Tự động ẩn
        const timer = setTimeout(() => {
            onComplete();
        }, SPLASHSCREEN_DURATION);

        return () => {
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chạy 1 lần

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${bgClass}`}>
            <div className="w-full max-w-md px-4">
                <Lottie
                    animationData={splashScreenAnimation}
                    loop={false}
                    autoplay={true}
                />
            </div>
        </div>
    );
};
