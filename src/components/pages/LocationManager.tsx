import React, { useState, useMemo, useRef, useEffect } from 'react';
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
    const [visibleCount, setVisibleCount] = useState(10);
    const [name, setName] = useState('');
    const [review, setReview] = useState<'high' | 'low' | undefined>(undefined);
    const [reviewNote, setReviewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    
    // State cho Modal Thêm/Sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Tải tất cả sự kiện để đếm số lần làm việc chính xác
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

    // Reset số lượng hiển thị khi lọc hoặc tìm kiếm
    useEffect(() => {
        setVisibleCount(10);
    }, [searchTerm, filterType, sortBy]);

    const filteredLocations = useMemo(() => {
        return locations.filter(loc => {
            const matchSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter = filterType === 'all' || loc.review === filterType;
            return matchSearch && matchFilter;
        }).sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'count') {
                const countA = allEvents.filter(e => e.locationId === a.id).length;
                const countB = allEvents.filter(e => e.locationId === b.id).length;
                return countB - countA;
            }
            return 0;
        });
    }, [locations, searchTerm, filterType, sortBy, allEvents]);

    const stats = useMemo(() => {
        const high = locations.filter(l => l.review === 'high').length;
        const low = locations.filter(l => l.review === 'low').length;
        return { high, low, total: locations.length };
    }, [locations]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && filteredLocations.length > visibleCount) {
                    setVisibleCount(prev => prev + 10);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [filteredLocations.length, visibleCount]);

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
        <div className={`pb-24 md:pb-12 ${bgClass} min-h-screen p-4 md:p-6`}>
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
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${cardBgClass
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
                            className="flex-1 md:min-w-[100px]"
                        />
                        <Dropdown
                            options={[
                                { value: 'name', label: 'Tên A-Z' },
                                { value: 'count', label: 'Làm nhiều nhất' },
                                { value: 'newest', label: 'Mới nhất' }
                            ]}
                            value={sortBy}
                            onChange={(value) => setSortBy(value as any)}
                            className="flex-1 md:min-w-[130px]"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className={`${cardBgClass} border ${borderClass} rounded-2xl p-4 flex flex-col gap-3`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3 flex-1">
                                                <Skeleton width={40} height={40} borderRadius={12} />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton width="60%" height={16} />
                                                    <Skeleton width="40%" height={12} />
                                                </div>
                                            </div>
                                        </div>
                                        <Skeleton width="100%" height={40} borderRadius={12} />
                                    </div>
                                ))}
                            </motion.div>
                        ) : filteredLocations.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`col-span-full text-center py-12 ${textMutedClass} ${cardBgClass} border ${borderClass} rounded-lg border-dashed`}
                            >
                                Không tìm thấy địa điểm nào
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {filteredLocations.slice(0, visibleCount).map(loc => {
                                    const workCount = allEvents.filter(e => e.locationId === loc.id).length;
                                    return (
                                        <div
                                            key={loc.id}
                                            className={`${cardBgClass} border ${borderClass} rounded-2xl p-4 hover:border-primary/50 transition-all shadow-sm flex flex-col gap-3`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`p-2.5 rounded-xl bg-primary/10 text-primary shrink-0`}>
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className={`font-bold ${textPrimaryClass} truncate text-base`}>{loc.name}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-[11px] ${textMutedClass} flex items-center gap-1`}>
                                                                <Calendar size={10} />
                                                                {loadingEvents ? "..." : `${workCount} lần làm`}
                                                            </span>
                                                            {loc.review && (
                                                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                                                                    loc.review === 'high' ? 'text-green-500' : 'text-red-500'
                                                                }`}>
                                                                    • {loc.review === 'high' ? 'Tốt' : 'Kém'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => handleOpenEdit(loc)}
                                                        className={`p-2 rounded-lg ${hoverBgClass} ${textSecondaryClass} transition-colors`}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(loc.id)}
                                                        className={`p-2 rounded-lg ${hoverBgClass} text-red-500 transition-colors`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {loc.reviewNote && (
                                                <div className={`px-3 py-2.5 rounded-xl bg-secondary/20 border-l-2 border-primary/30 text-xs ${textSecondaryClass} italic leading-relaxed`}>
                                                    "{loc.reviewNote}"
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {filteredLocations.length > visibleCount && (
                                    <div ref={observerTarget} className="col-span-full flex justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </motion.div>
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
                            placeholder="Ví dụ: Nhà hàng Diamond"
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${inputBgClass} ${inputBorderClass} ${textPrimaryClass}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Đánh giá chất lượng</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setReview(review === 'high' ? undefined : 'high')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                                    review === 'high' 
                                    ? 'bg-green-500/10 border-green-500 text-green-600' 
                                    : `${inputBgClass} ${inputBorderClass} ${textMutedClass}`
                                }`}
                            >
                                <ThumbsUp size={18} />
                                <span className="font-medium">Tốt</span>
                            </button>
                            <button
                                onClick={() => setReview(review === 'low' ? undefined : 'low')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                                    review === 'low' 
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
