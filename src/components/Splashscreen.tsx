import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const SPLASHSCREEN_URL = '/splashscreen.json';

const SPLASHSCREEN_KEY = 'splashscreen_shown';
const SPLASHSCREEN_DURATION = 3000; // 3 giây

interface SplashscreenProps {
    onComplete: () => void;
}

export const Splashscreen: React.FC<SplashscreenProps> = ({ onComplete }) => {
    const [animationData, setAnimationData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Đánh dấu đã hiển thị splashscreen trong phiên này
        sessionStorage.setItem(SPLASHSCREEN_KEY, 'true');

        let isMounted = true;

        // Load animation data từ public folder
        fetch(SPLASHSCREEN_URL)
            .then(response => response.json())
            .then(data => {
                if (isMounted) {
                    setAnimationData(data);
                    setIsLoading(false);
                }
            })
            .catch(error => {
                console.error('Error loading animation:', error);
                // Nếu lỗi, vẫn tiếp tục sau 500ms
                if (isMounted) {
                    setTimeout(() => {
                        onComplete();
                    }, 500);
                }
            });

        // Tự động ẩn sau một khoảng thời gian
        const timer = setTimeout(() => {
            onComplete();
        }, SPLASHSCREEN_DURATION);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy 1 lần khi mount

    // Hiển thị loading spinner trong khi chờ animation load
    if (isLoading || !animationData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
                <div className="w-8 h-8 border-2 border-[#ecb52d] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
            <div className="w-full max-w-md px-4">
                <Lottie
                    animationData={animationData}
                    loop={false}
                    autoplay={true}
                />
            </div>
        </div>
    );
};
