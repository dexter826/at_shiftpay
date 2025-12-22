import React, { useState, useMemo } from 'react';
import { Event, Shift, Employee } from '../../types';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Search, ThumbsUp, ThumbsDown, Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { formatDate } from '../../constants';
import { Dropdown } from '../ui/Dropdown';

interface ReviewsViewProps {
    events: Event[];
    shifts: Shift[];
    employees: Employee[];
    loading?: boolean;
    onBack?: () => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
    events,
    shifts,
    employees,
    loading = false,
    onBack
}) => {
    const {
        bgClass,
        cardBgClass,
        borderClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass,
        hoverBgClass
    } = useThemeStyles();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'high' | 'low'>('all');

    // Lọc sự kiện có đánh giá
    const ratedEvents = useMemo(() => {
        return events.filter(evt => evt.review !== undefined);
    }, [events]);

    const filteredEvents = useMemo(() => {
        return ratedEvents.filter(evt => {
            const matchSearch =
                evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (evt.location?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchFilter = filterType === 'all' || evt.review === filterType;
            return matchSearch && matchFilter;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [ratedEvents, searchTerm, filterType]);

    const stats = useMemo(() => {
        const high = ratedEvents.filter(e => e.review === 'high').length;
        const low = ratedEvents.filter(e => e.review === 'low').length;
        return { high, low, total: ratedEvents.length };
    }, [ratedEvents]);

    return (
        <div className={`pb-16 md:pb-0 md:ml-60 ${bgClass} min-h-screen p-4 md:p-6`}>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className={`p-2 rounded-full transition-colors ${hoverBgClass}`}
                                title="Quay lại"
                            >
                                <ArrowLeft size={20} className={textPrimaryClass} />
                            </button>
                        )}
                        <div>
                            <h2 className={`text-xl font-semibold ${textPrimaryClass}`}>Đánh giá sự kiện</h2>
                            <p className={`text-sm ${textSecondaryClass} mt-0.5`}>Xem lại các sự kiện đã được đánh giá để cải thiện chất lượng.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className={`${cardBgClass} border ${borderClass} px-4 py-2 rounded-lg flex items-center gap-2`}>
                            <ThumbsUp size={16} className="text-green-500" />
                            <div className="text-sm font-medium">
                                <span className={textPrimaryClass}>{stats.high}</span>
                                <span className={`ml-1 ${textMutedClass}`}>Tốt</span>
                            </div>
                        </div>
                        <div className={`${cardBgClass} border ${borderClass} px-4 py-2 rounded-lg flex items-center gap-2`}>
                            <ThumbsDown size={16} className="text-red-500" />
                            <div className="text-sm font-medium">
                                <span className={textPrimaryClass}>{stats.low}</span>
                                <span className={`ml-1 ${textMutedClass}`}>Kém</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 w-full">
                    <div className="flex-1 relative">
                        <Search className={`absolute left-3.5 top-[14px] ${textMutedClass}`} size={17} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc địa điểm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${cardBgClass
                                } ${borderClass} ${textPrimaryClass} h-[45px]`}
                        />
                    </div>
                    <div className="md:w-64">
                        <Dropdown
                            value={filterType}
                            onChange={(val) => setFilterType(val as any)}
                            options={[
                                { value: 'all', label: 'Tất cả đánh giá' },
                                { value: 'high', label: 'Đánh giá tốt', icon: <ThumbsUp size={14} className="text-green-500" /> },
                                { value: 'low', label: 'Đánh giá kém', icon: <ThumbsDown size={14} className="text-red-500" /> }
                            ]}
                            className="w-full h-[45px]"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Đang tải...</div>
                    ) : filteredEvents.length === 0 ? (
                        <div className={`text-center py-12 ${textMutedClass} ${cardBgClass} border ${borderClass} rounded-lg border-dashed`}>
                            {searchTerm || filterType !== 'all' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có sự kiện nào được đánh giá'}
                        </div>
                    ) : (
                        filteredEvents.map(evt => (
                            <div
                                key={evt.id}
                                className={`${cardBgClass} border ${borderClass} rounded-lg p-4 hover:border-primary/50 transition-all group`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-medium ${textPrimaryClass}`}>{evt.title}</h3>
                                            {evt.review === 'high' ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                    <ThumbsUp size={10} /> Tốt
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                    <ThumbsDown size={10} /> Kém
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {formatDate(evt.date)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {evt.time || '--:--'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {evt.location && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/5 text-blue-500 rounded-md text-[11px] font-medium border border-blue-500/10">
                                                <MapPin size={12} />
                                                <span>{evt.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {evt.reviewNote && (
                                    <div className={`p-3 rounded-lg ${hoverBgClass} text-sm ${textSecondaryClass} border ${borderClass} border-dashed`}>
                                        <div className="flex items-start gap-2">
                                            <span className="text-primary font-bold">Lý do:</span>
                                            <span className="italic">"{evt.reviewNote}"</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        {shifts.filter(s => s.eventId === evt.id).slice(0, 5).map(s => {
                                            const emp = employees.find(e => e.id === s.employeeId);
                                            return (
                                                <div key={s.id} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden" title={emp?.name}>
                                                    {emp?.imageUrl ? <img src={emp.imageUrl} alt="" className="w-full h-full object-cover" /> : emp?.name.charAt(0)}
                                                </div>
                                            )
                                        })}
                                        {shifts.filter(s => s.eventId === evt.id).length > 5 && (
                                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-slate-500">
                                                +{shifts.filter(s => s.eventId === evt.id).length - 5}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-xs ${textMutedClass}`}>Tổng {shifts.filter(s => s.eventId === evt.id).length} nhân sự</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
