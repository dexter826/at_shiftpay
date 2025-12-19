import React, { useEffect } from 'react';
import Lottie from 'lottie-react';
import splashScreenAnimation from '../../assets/splashscreen.json';
import { useTheme } from '../../contexts/ThemeContext';

const SPLASHSCREEN_KEY = 'splashscreen_shown';
const SPLASHSCREEN_DURATION = 2000; // 2 giây

interface SplashscreenProps {
    onComplete: () => void;
}

export const Splashscreen: React.FC<SplashscreenProps> = ({ onComplete }) => {
    const { theme } = useTheme();

    useEffect(() => {
        // Đánh dấu đã hiển thị splashscreen trong phiên này
        sessionStorage.setItem(SPLASHSCREEN_KEY, 'true');

        // Tự động ẩn sau một khoảng thời gian
        const timer = setTimeout(() => {
            onComplete();
        }, SPLASHSCREEN_DURATION);

        return () => {
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy 1 lần khi mount

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
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
