import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { LoadMore } from '../../ui/LoadMore';
import LocationCard from './LocationCard';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { Location } from '../../../types';

interface LocationListProps {
    loading: boolean;
    locations: Location[];
    visibleCount: number;
    onLoadMore: () => void;
    workCounts: Record<string, number>;
    onEdit: (loc: Location) => void;
    onDelete: (id: string) => void;
    theme: string;
}

const LocationList: React.FC<LocationListProps> = ({
    loading,
    locations,
    visibleCount,
    onLoadMore,
    workCounts,
    onEdit,
    onDelete,
    theme
}) => {
    const { cardBgClass, borderClass, textMutedClass } = useThemeStyles();

    const hasMore = locations.length > visibleCount;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`${cardBgClass} border ${borderClass} rounded-2xl overflow-hidden flex flex-col shadow-sm`}>
                                <Skeleton width="100%" height={200} />
                                <div className="p-5 space-y-4 flex-1">
                                    <div className="space-y-2">
                                        <Skeleton width="80%" height={24} />
                                        <Skeleton width="60%" height={16} />
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Skeleton width="40%" height={12} />
                                            <Skeleton width="70%" height={16} />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Skeleton width="40%" height={12} />
                                            <Skeleton width="70%" height={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : locations.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`col-span-full text-center py-20 ${textMutedClass} ${cardBgClass} border ${borderClass} rounded-lg border-dashed`}
                    >
                        <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Không tìm thấy địa điểm nào</p>
                    </motion.div>
                ) : (
                    <>
                        {locations.slice(0, visibleCount).map((loc, idx) => (
                            <LocationCard
                                key={loc.id}
                                location={loc}
                                stats={{ workCount: workCounts[loc.id] || 0 }}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                index={idx}
                                theme={theme}
                            />
                        ))}

                        {hasMore && (
                            <LoadMore
                                currentCount={visibleCount}
                                totalCount={locations.length}
                                onLoadMore={onLoadMore}
                                unit="địa điểm"
                                className="pt-2 pb-4 col-span-full"
                            />
                        )}
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(LocationList);
