import React, { memo } from 'react';
import { MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface LocationStatsProps {
    stats: {
        total: number;
        high: number;
        low: number;
    };
}

const LocationStats: React.FC<LocationStatsProps> = ({ stats }) => {
    const { cardBgClass, borderClass, textPrimaryClass } = useThemeStyles();

    return (
        <div className="flex gap-2 shrink-0">
            <div className={`${cardBgClass} border ${borderClass} px-3 py-1.5 rounded-lg flex items-center gap-2`} title="Tổng địa điểm">
                <MapPin size={14} className="text-primary" />
                <span className={`text-xs font-medium ${textPrimaryClass}`}>{stats.total}</span>
            </div>
            <div className={`${cardBgClass} border ${borderClass} px-3 py-1.5 rounded-lg flex items-center gap-2`} title="Đánh giá tốt">
                <ThumbsUp size={14} className="text-green-500" />
                <span className={`text-xs font-medium ${textPrimaryClass}`}>{stats.high}</span>
            </div>
            <div className={`${cardBgClass} border ${borderClass} px-3 py-1.5 rounded-lg flex items-center gap-2`} title="Đánh giá kém">
                <ThumbsDown size={14} className="text-red-500" />
                <span className={`text-xs font-medium ${textPrimaryClass}`}>{stats.low}</span>
            </div>
        </div>
    );
};

export default memo(LocationStats);
