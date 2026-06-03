import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageSquare, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Location } from '../../../types';

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY || 'free_key_placeholder';

interface LocationCardProps {
    location: Location;
    stats: {
        workCount: number;
    };
    onEdit: (loc: Location) => void;
    onDelete: (id: string) => void;
    onViewDetail: (loc: Location) => void;
    index: number;
    theme: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
    location,
    stats,
    onEdit,
    onDelete,
    onViewDetail,
    index,
    theme
}) => {
    

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
            onClick={() => onViewDetail(location)}
            className={`group relative flex flex-col rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-[var(--bg-card)] border border-[var(--border-color)]`}
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
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <span className={`bg-[var(--bg-card)] bg-opacity-90 px-4 py-2 rounded-lg text-xs font-bold text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]`}>
                            Chưa có địa chỉ chính xác
                        </span>
                    </div>
                )}

                {/* Action Buttons - Desktop: Show on Hover, Mobile: Always Show */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenInGoogleMaps(); }} className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors" title="Xem trên Google Maps">
                        <ExternalLink size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(location); }} className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors" title="Sửa địa điểm">
                        <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(location.id); }} className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/60 transition-colors" title="Xóa địa điểm">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Phần thông tin */}
            <div className="flex-1 p-5">
                <div className="space-y-1.5">
                    <h3 className={`text-lg font-bold text-[var(--text-primary)] leading-tight line-clamp-1`}>
                        {location.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500 shrink-0" />
                        <span className={`text-xs text-[var(--text-secondary)] line-clamp-1`}>
                            {location.address || "Địa chỉ chưa xác định"}
                        </span>
                    </div>

                    {location.reviewNote ? (
                        <div className="flex items-start gap-1.5 mt-2">
                            <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                            <p className={`text-xs text-[var(--text-muted)] line-clamp-2 italic`}>
                                "{location.reviewNote}"
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-1.5 mt-2 opacity-50">
                            <MessageSquare size={14} className="text-gray-300 shrink-0 mt-0.5" />
                            <p className={`text-xs text-[var(--text-muted)] italic`}>
                                Chưa có ghi chú
                            </p>
                        </div>
                    )}

                    <div className={`flex items-center gap-4 pt-3 mt-auto border-t border-[var(--border-color)]`}>
                        <div className="flex flex-col">
                            <span className={`text-[10px] uppercase text-[var(--text-muted)] font-semibold`}>Lịch sử</span>
                            <span className={`text-sm font-bold text-[var(--text-primary)]`}>{stats.workCount} ca làm</span>
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] uppercase text-[var(--text-muted)] font-semibold`}>Đánh giá</span>
                            {location.review ? (
                                <span className={`text-sm font-bold ${location.review === 'high' ? 'text-green-500' : 'text-red-500'}`}>
                                    {location.review === 'high' ? 'Tốt' : 'Kém'}
                                </span>
                            ) : (
                                <span className={`text-sm font-bold text-[var(--text-muted)]`}>
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
