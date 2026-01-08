import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';
import { Location, Event, Shift, Employee } from '../../types';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Search, ThumbsUp, ThumbsDown, MapPin, ArrowLeft, Plus, Edit2, Trash2, MoreVertical, ArrowUpDown, Calendar } from 'lucide-react';
import { dbService } from '../../services';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { Dropdown, DropdownOption } from '../ui/Dropdown';

interface LocationManagerProps {
    locations: Location[];
    loading?: boolean;
    onBack?: () => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({
    locations,
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
        hoverBgClass,
        inputBgClass,
        inputBorderClass
    } = useThemeStyles();

    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'high' | 'low'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'count' | 'newest'>('newest');
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [visibleCount, setVisibleCount] = useState(12);
    const [name, setName] = useState('');
    const [review, setReview] = useState<'high' | 'low' | undefined>(undefined);
    const [reviewNote, setReviewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Trạng thái Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Đếm số lần làm việc
    useEffect(() => {
        const fetchAllEvents = async () => {
            setLoadingEvents(true);
            try {
                const data = await dbService.getAllEvents();
                setAllEvents(data);
            } catch (error) {
                console.error("Error fetching all events:", error);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchAllEvents();
    }, []);

    // Reset danh sách hiển thị
    useEffect(() => {
        setVisibleCount(12);
    }, [searchTerm, filterType, sortBy]);

    // Tối ưu đếm số lần làm việc bằng Memo
    const workCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allEvents.forEach(e => {
            if (e.locationId) {
                counts[e.locationId] = (counts[e.locationId] || 0) + 1;
            }
        });
        return counts;
    }, [allEvents]);

    const filteredLocations = useMemo(() => {
        return locations.filter(loc => {
            const matchSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter = filterType === 'all' || loc.review === filterType;
            return matchSearch && matchFilter;
        }).sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'count') {
                const countA = workCounts[a.id] || 0;
                const countB = workCounts[b.id] || 0;
                return countB - countA;
            }
            return 0;
        });
    }, [locations, searchTerm, filterType, sortBy, workCounts]);

    const stats = useMemo(() => {
        const high = locations.filter(l => l.review === 'high').length;
        const low = locations.filter(l => l.review === 'low').length;
        return { high, low, total: locations.length };
    }, [locations]);

    const hasMore = filteredLocations.length > visibleCount;

    // Sử dụng Callback Ref cho IntersectionObserver ổn định hơn
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (observer.current) observer.current.disconnect();

        if (!node || !hasMore) return;

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + 12, filteredLocations.length));
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        observer.current.observe(node);
    }, [hasMore, filteredLocations.length]);

    const handleOpenAdd = () => {
        setEditingLocation(null);
        setName('');
        setReview(undefined);
        setReviewNote('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (loc: Location) => {
        setEditingLocation(loc);
        setName(loc.name);
        setReview(loc.review);
        setReviewNote(loc.reviewNote || '');
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            showToast('Vui lòng nhập tên địa điểm', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingLocation) {
                await dbService.updateLocation(editingLocation.id, {
                    name: name.trim(),
                    review,
                    reviewNote: reviewNote.trim()
                });
                showToast('Cập nhật địa điểm thành công', 'success');
            } else {
                await dbService.addLocation({
                    name: name.trim(),
                    review,
                    reviewNote: reviewNote.trim()
                });
                showToast('Thêm địa điểm thành công', 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast('Có lỗi xảy ra', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await dbService.deleteLocation(deleteConfirm);
            showToast('Xóa địa điểm thành công', 'success');
            setDeleteConfirm(null);
        } catch (error) {
            showToast('Không thể xóa địa điểm', 'error');
        }
    };

    return (
        <div className={`pb-24 md:pb-0 ${bgClass} min-h-screen p-4 md:p-6`}>
            <div className="w-full space-y-6">
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
                            <h2 className={`text-xl font-semibold ${textPrimaryClass}`}>Quản lý địa điểm</h2>
                            <p className={`text-sm ${textSecondaryClass} mt-0.5`}>Danh sách các địa điểm và đánh giá chất lượng.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
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
                        <div className="flex gap-2">
                            <Button
                                onClick={handleOpenAdd}
                                variant="primary"
                                className="flex items-center gap-2"
                            >
                                <Plus size={16} />
                                <span>Thêm mới</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên địa điểm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 h-[42px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${cardBgClass
                                } ${borderClass} ${textPrimaryClass}`}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Dropdown
                            options={[
                                { value: 'all', label: 'Tất cả' },
                                { value: 'high', label: 'Tốt' },
                                { value: 'low', label: 'Kém' }
                            ]}
                            value={filterType}
                            onChange={(value) => setFilterType(value as any)}
                            className="flex-1 md:min-w-[120px] h-[42px]"
                        />
                        <Dropdown
                            options={[
                                { value: 'newest', label: 'Mới nhất' },
                                { value: 'name', label: 'Tên A-Z' },
                                { value: 'count', label: 'Làm nhiều nhất' }
                            ]}
                            value={sortBy}
                            onChange={(value) => setSortBy(value as any)}
                            className="flex-1 md:min-w-[150px] h-[42px]"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className={`${cardBgClass} border ${borderClass} rounded-2xl overflow-hidden flex flex-col gap-3 h-48`}>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="p-5 space-y-4">
                                            <Skeleton width="70%" height={24} />
                                            <Skeleton width="100%" height={40} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLocations.length === 0 ? (
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
                                {filteredLocations.slice(0, visibleCount).map((loc, idx) => {
                                    const workCount = workCounts[loc.id] || 0;
                                    return (
                                        <motion.div
                                            key={loc.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }}
                                            className={`${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white'} border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} rounded-b-2xl rounded-t-none overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col group relative`}
                                        >
                                            <div className={`h-1.5 w-full ${loc.review === 'high' ? 'bg-green-500' :
                                                loc.review === 'low' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
                                                }`} />

                                            <div className="p-5 flex flex-col h-full">
                                                <h3 className={`text-xl font-bold ${textPrimaryClass} mb-2 truncate`}>
                                                    {loc.name}
                                                </h3>

                                                <div className="flex-1">
                                                    <p className={`text-sm ${textSecondaryClass} line-clamp-2 mb-3 leading-relaxed min-h-[40px]`}>
                                                        {loc.reviewNote ? `"${loc.reviewNote}"` : "Chưa có ghi chú cho địa điểm này."}
                                                    </p>
                                                    <div className={`flex items-center gap-1.5 text-[11px] ${textMutedClass} mb-4`}>
                                                        <Calendar size={12} />
                                                        <span>{loadingEvents ? "..." : `${workCount} lần làm việc tại đây`}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto pt-2">
                                                    <div className={`${loc.review === 'high' ? 'text-green-500' :
                                                        loc.review === 'low' ? 'text-red-500' : textMutedClass
                                                        }`}>
                                                        {loc.review === 'high' ? <ThumbsUp size={22} /> :
                                                            loc.review === 'low' ? <ThumbsDown size={22} /> :
                                                                <MapPin size={22} />}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleOpenEdit(loc)}
                                                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                                                                } ${textPrimaryClass} border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200/50'}`}
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(loc.id)}
                                                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${theme === 'dark' ? 'bg-red-900/20 hover:bg-red-900/30' : 'bg-red-50 hover:bg-red-100'
                                                                } text-red-500 border ${theme === 'dark' ? 'border-red-900/30' : 'border-red-100'}`}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {hasMore && (
                                    <div ref={lastElementRef} className="col-span-full flex justify-center py-8">
                                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal Xác nhận xóa */}
            <Modal
                title="Xác nhận xóa"
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                footer={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Hủy</Button>
                        <Button variant="danger" onClick={confirmDelete} className="flex-1">Xóa</Button>
                    </div>
                }
            >
                <p className={`text-sm ${textSecondaryClass}`}>Bạn có chắc chắn muốn xóa địa điểm này? Hành động này không thể hoàn tác.</p>
            </Modal>

            {/* Modal Thêm/Sửa */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingLocation ? 'Sửa địa điểm' : 'Thêm địa điểm mới'}
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            className="flex-1"
                        >
                            {editingLocation ? 'Cập nhật' : 'Lưu lại'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium ${textSecondaryClass} mb-1.5`}>Tên địa điểm</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập tên địa điểm"
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${inputBgClass} ${inputBorderClass} ${textPrimaryClass}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Đánh giá chất lượng</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setReview(review === 'high' ? undefined : 'high')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${review === 'high'
                                    ? 'bg-green-500/10 border-green-500 text-green-600'
                                    : `${inputBgClass} ${inputBorderClass} ${textMutedClass}`
                                    }`}
                            >
                                <ThumbsUp size={18} />
                                <span className="font-medium">Tốt</span>
                            </button>
                            <button
                                onClick={() => setReview(review === 'low' ? undefined : 'low')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${review === 'low'
                                    ? 'bg-red-500/10 border-red-500 text-red-600'
                                    : `${inputBgClass} ${inputBorderClass} ${textMutedClass}`
                                    }`}
                            >
                                <ThumbsDown size={18} />
                                <span className="font-medium">Kém</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${textSecondaryClass} mb-1.5`}>Ghi chú đánh giá</label>
                        <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Lưu ý về địa điểm này..."
                            rows={3}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none ${inputBgClass} ${inputBorderClass} ${textPrimaryClass}`}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LocationManager;
