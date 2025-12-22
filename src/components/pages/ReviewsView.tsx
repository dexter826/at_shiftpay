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
        theme,
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

                {/* List - Grid View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-slate-500">Đang tải...</div>
                    ) : filteredEvents.length === 0 ? (
                        <div className={`col-span-full text-center py-12 ${textMutedClass} ${cardBgClass} border ${borderClass} rounded-lg border-dashed`}>
                            {searchTerm || filterType !== 'all' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có sự kiện nào được đánh giá'}
                        </div>
                    ) : (
                        filteredEvents.map(evt => (
                            <div
                                key={evt.id}
                                className={`${cardBgClass} border ${borderClass} rounded-2xl p-4 hover:border-primary/50 transition-all group flex flex-col h-full shadow-sm hover:shadow-md`}
                            >
                                {/* Header: Title & Rating */}
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <h3 className={`font-semibold ${textPrimaryClass} line-clamp-1 flex-1`} title={evt.title}>
                                        {evt.title}
                                    </h3>
                                    {evt.review === 'high' ? (
                                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                            <ThumbsUp size={10} /> Tốt
                                        </span>
                                    ) : (
                                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                            <ThumbsDown size={10} /> Kém
                                        </span>
                                    )}
                                </div>

                                {/* Event Meta: Date & Time */}
                                <div className="flex items-center gap-4 text-[11px] mb-3">
                                    <div className={`flex items-center gap-1.5 ${textSecondaryClass}`}>
                                        <Calendar size={13} className="text-primary/70" />
                                        {formatDate(evt.date)}
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${textSecondaryClass}`}>
                                        <Clock size={13} className="text-primary/70" />
                                        {evt.time || '--:--'}
                                    </div>
                                </div>

                                {/* Location - Important & Prominent */}
                                {evt.location && (
                                    <div className="mb-4 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-2 group-hover:bg-blue-500/10 transition-colors">
                                        <MapPin size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                        <span className={`text-xs font-medium text-blue-600 leading-tight`}>{evt.location}</span>
                                    </div>
                                )}

                                {/* Review Note - Focused block */}
                                {evt.reviewNote ? (
                                    <div className={`flex-1 p-3 rounded-xl ${hoverBgClass} text-xs ${textSecondaryClass} border ${borderClass} border-dashed mb-4 relative overflow-hidden group-hover:bg-primary/5 transition-colors`}>
                                        <div className="flex items-start gap-2 h-full">
                                            <span className="text-primary font-bold flex-shrink-0">Lí do:</span>
                                            <span className="italic leading-relaxed line-clamp-3">"{evt.reviewNote}"</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-[40px]"></div>
                                )}

                                {/* Footer: Personnel summary */}
                                <div className={`mt-auto pt-3 border-t ${borderClass} flex justify-between items-center bg-transparent`}>
                                    <div className="flex -space-x-1.5 group/avatars">
                                        {shifts.filter(s => s.eventId === evt.id).slice(0, 5).map(s => {
                                            const emp = employees.find(e => e.id === s.employeeId);
                                            return (
                                                <div key={s.id} className={`w-7 h-7 rounded-full border-2 ${theme === 'dark' ? 'border-slate-800 bg-slate-700' : 'border-white bg-slate-100'} flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shadow-sm hover:z-10 transition-transform hover:scale-110`} title={emp?.name}>
                                                    {emp?.imageUrl ? <img src={emp.imageUrl} alt="" className="w-full h-full object-cover" /> : emp?.name.charAt(0)}
                                                </div>
                                            )
                                        })}
                                        {shifts.filter(s => s.eventId === evt.id).length > 5 && (
                                            <div className={`w-7 h-7 rounded-full border-2 ${theme === 'dark' ? 'border-slate-800 bg-slate-700' : 'border-white bg-slate-200'} flex items-center justify-center text-[10px] text-slate-500 font-medium`}>
                                                +{shifts.filter(s => s.eventId === evt.id).length - 5}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-medium ${textMutedClass}`}>
                                        {shifts.filter(s => s.eventId === evt.id).length} người
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
