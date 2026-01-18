import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageSquare } from 'lucide-react';
import ExternalLinkIcon from '../../ui/icons/external-link-icon';
import PenIcon from '../../ui/icons/pen-icon';
import TrashIcon from '../../ui/icons/trash-icon';
import { CardActionButton } from '../../ui/CardActionButton';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { Location } from '../../../types';

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY || 'free_key_placeholder';

interface LocationCardProps {
    location: Location;
    stats: {
        workCount: number;
    };
    onEdit: (loc: Location) => void;
    onDelete: (id: string) => void;
    index: number;
    theme: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
    location,
    stats,
    onEdit,
    onDelete,
    index,
    theme
}) => {
    const {
        cardBgClass,
        borderClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass
    } = useThemeStyles();

    const hasCoords = location.latitude && location.longitude;
    const mapUrl = hasCoords
        ? `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=${location.latitude},${location.longitude}&zoom=17&size=600x400&markers=icon:large-blue-cutout|${location.latitude},${location.longitude}`
        : `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=21.02776,105.83416&zoom=12&size=600x400`;

    const handleOpenInGoogleMaps = () => {
        const { latitude, longitude, address } = location;
        let url = '';

        if (latitude && longitude) {
            url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        } else if (address && address.trim()) {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
        }

        if (url) {
            window.open(url, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={`group relative flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
        >
            {/* Phần hình ảnh */}
            <div className="h-[200px] overflow-hidden relative">
                <img
                    src={mapUrl}
                    alt={location.name}
                    decoding="async"
                    className={`w-full h-full object-cover transition-all duration-500 ${hasCoords ? 'group-hover:scale-105' : 'blur-[2px] opacity-60'}`}
                />

                {!hasCoords && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/20">
                        <span className={`${cardBgClass} bg-opacity-90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold ${textPrimaryClass} shadow-sm border ${borderClass}`}>
                            Chưa có địa chỉ chính xác
                        </span>
                    </div>
                )}

                {/* Action Buttons - Desktop: Show on Hover, Mobile: Always Show */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <CardActionButton
                        onClick={handleOpenInGoogleMaps}
                        variant="info"
                        icon={<ExternalLinkIcon />}
                        title="Xem trên Google Maps"
                        className="!w-9 !h-9"
                        iconSize={16}
                    />
                    <CardActionButton
                        onClick={() => onEdit(location)}
                        icon={<PenIcon />}
                        title="Sửa địa điểm"
                        className="!w-9 !h-9"
                        iconSize={16}
                    />
                    <CardActionButton
                        onClick={() => onDelete(location.id)}
                        variant="danger"
                        icon={<TrashIcon />}
                        title="Xóa địa điểm"
                        className="!w-9 !h-9"
                        iconSize={16}
                    />
                </div>
            </div>

            {/* Phần thông tin */}
            <div className="flex-1 p-5">
                <div className="space-y-1.5">
                    <h3 className={`text-lg font-bold ${textPrimaryClass} leading-tight line-clamp-1`}>
                        {location.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500 shrink-0" />
                        <span className={`text-xs ${textSecondaryClass} line-clamp-1`}>
                            {location.address || "Địa chỉ chưa xác định"}
                        </span>
                    </div>

                    {location.reviewNote ? (
                        <div className="flex items-start gap-1.5 mt-2">
                            <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                            <p className={`text-xs ${textMutedClass} line-clamp-2 italic`}>
                                "{location.reviewNote}"
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-1.5 mt-2 opacity-50">
                            <MessageSquare size={14} className="text-gray-300 shrink-0 mt-0.5" />
                            <p className={`text-xs ${textMutedClass} italic`}>
                                Chưa có ghi chú
                            </p>
                        </div>
                    )}

                    <div className={`flex items-center gap-4 pt-3 mt-auto border-t ${borderClass}`}>
                        <div className="flex flex-col">
                            <span className={`text-[10px] uppercase ${textMutedClass} font-semibold`}>Lịch sử</span>
                            <span className={`text-sm font-bold ${textPrimaryClass}`}>{stats.workCount} ca làm</span>
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] uppercase ${textMutedClass} font-semibold`}>Đánh giá</span>
                            {location.review ? (
                                <span className={`text-sm font-bold ${location.review === 'high' ? 'text-green-500' : 'text-red-500'}`}>
                                    {location.review === 'high' ? 'Tốt' : 'Kém'}
                                </span>
                            ) : (
                                <span className={`text-sm font-bold ${textMutedClass}`}>
                                    Thường
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default memo(LocationCard);
