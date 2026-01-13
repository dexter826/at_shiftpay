import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';
import { Location, Event, Shift, Employee } from '../../types';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { ArrowLeft, ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Edit2, ExternalLink, Filter, MapPin, MessageSquare, MoreVertical, Plus, Search, Share2, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { LoadMore } from '../ui/LoadMore';
import { dbService } from '../../services';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { Dropdown, DropdownOption } from '../ui/Dropdown';
import { useAuthStore } from '../../stores';

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY || 'free_key_placeholder';

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
    const { user } = useAuthStore();
    const userId = user?.uid || '';

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
    const [address, setAddress] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Trạng thái Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Trạng thái Autocomplete
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = useCallback(async (text: string) => {
        if (text.length < 3 || LOCATIONIQ_API_KEY === 'free_key_placeholder') {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`https://api.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(text)}&limit=5&accept-language=vi&countrycodes=vn`);
            const data = await res.json();
            // LocationIQ trả về mảng trực tiếp, không phải FeatureCollection
            setSuggestions(Array.isArray(data) ? data : []);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
    }, []);

    const handleAddressChange = (val: string) => {
        setAddress(val);
        fetchSuggestions(val);
    };

    const handleSelectSuggestion = (suggestion: any) => {
        // LocationIQ dùng display_name thay vì formatted
        setAddress(suggestion.display_name);
        if (suggestion.lat && suggestion.lon) {
            setLat(suggestion.lat.toString());
            setLng(suggestion.lon.toString());
        }
        setShowSuggestions(false);
    };

    // Đếm số lần làm việc
    useEffect(() => {
        const fetchAllEvents = async () => {
            setLoadingEvents(true);
            try {
                const data = await dbService.getAllEvents(userId);
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

    // Preload ảnh bản đồ tĩnh
    useEffect(() => {
        if (locations.length > 0) {
            locations.forEach(loc => {
                const hasCoords = loc.latitude && loc.longitude;
                const mapUrl = hasCoords
                    ? `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=${loc.latitude},${loc.longitude}&zoom=17&size=600x400&markers=icon:large-blue-cutout|${loc.latitude},${loc.longitude}`
                    : `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=21.02776,105.83416&zoom=12&size=600x400`;
                const img = new Image();
                img.src = mapUrl;
            });
        }
    }, [locations]);

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

    // Tăng số lượng hiển thị khi nhấn Xem thêm
    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + 12, filteredLocations.length));
    };

    const handleOpenAdd = () => {
        setEditingLocation(null);
        setName('');
        setAddress('');
        setLat('');
        setLng('');
        setReview(undefined);
        setReviewNote('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (loc: Location) => {
        setEditingLocation(loc);
        setName(loc.name);
        setAddress(loc.address || '');
        setLat(loc.latitude?.toString() || '');
        setLng(loc.longitude?.toString() || '');
        setReview(loc.review);
        setReviewNote(loc.reviewNote || '');
        setIsModalOpen(true);
    };

    const isChanged = useMemo(() => {
        if (!editingLocation) return !!name.trim(); // Add mode: require name
        return name.trim() !== editingLocation.name ||
            address.trim() !== (editingLocation.address || '') ||
            lat.trim() !== (editingLocation.latitude?.toString() || '') ||
            lng.trim() !== (editingLocation.longitude?.toString() || '') ||
            review !== editingLocation.review ||
            reviewNote.trim() !== (editingLocation.reviewNote || '');
    }, [name, address, lat, lng, review, reviewNote, editingLocation]);

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
                    address: address.trim() || null,
                    latitude: lat ? parseFloat(lat) : null,
                    longitude: lng ? parseFloat(lng) : null,
                    review,
                    reviewNote: reviewNote.trim()
                });
                showToast('Cập nhật địa điểm thành công', 'success');
            } else {
                await dbService.addLocation({
                    name: name.trim(),
                    address: address.trim() || null,
                    latitude: lat ? parseFloat(lat) : null,
                    longitude: lng ? parseFloat(lng) : null,
                    review,
                    reviewNote: reviewNote.trim()
                }, userId);
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

    const handleOpenInGoogleMaps = (loc: Location) => {
        const { latitude, longitude, address } = loc;
        let url = '';

        if (latitude && longitude) {
            url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        } else if (address && address.trim()) {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
        }

        if (url) {
            window.open(url, '_blank');
        } else {
            showToast('Địa điểm này chưa có thông tin vị trí', 'error');
        }
    };

    return (
        <div className={`pb-28 ${bgClass} min-h-screen px-4 pt-5 md:px-6 md:pt-6 md:pb-8`}>
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
                                    const hasCoords = loc.latitude && loc.longitude;
                                    const mapUrl = hasCoords
                                        ? `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=${loc.latitude},${loc.longitude}&zoom=17&size=600x400&markers=icon:large-blue-cutout|${loc.latitude},${loc.longitude}`
                                        : `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=21.02776,105.83416&zoom=12&size=600x400`;

                                    return (
                                        <motion.div
                                            key={loc.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                                            className={`group relative flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                                        >
                                            {/* Phần hình ảnh */}
                                            <div className="h-[200px] overflow-hidden relative">
                                                <img 
                                                    src={mapUrl} 
                                                    alt={loc.name}
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
                                                    <button
                                                        onClick={() => handleOpenInGoogleMaps(loc)}
                                                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-blue-500/90 backdrop-blur-md text-white hover:bg-blue-600 transition-all shadow-lg"
                                                        title="Xem trên Google Maps"
                                                    >
                                                        <ExternalLink size={12} className="md:w-3.5 md:h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEdit(loc)}
                                                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-primary/90 backdrop-blur-md text-white hover:bg-primary transition-all shadow-lg"
                                                        title="Sửa"
                                                    >
                                                        <Edit2 size={12} className="md:w-3.5 md:h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(loc.id)}
                                                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-red-500/90 backdrop-blur-md text-white hover:bg-red-500 transition-all shadow-lg"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Phần thông tin */}
                                            <div className="flex-1 p-5">
                                                <div className="space-y-1.5">
                                                    <h3 className={`text-lg font-bold ${textPrimaryClass} leading-tight line-clamp-1`}>
                                                        {loc.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={14} className="text-blue-500 shrink-0" />
                                                        <span className={`text-xs ${textSecondaryClass} line-clamp-1`}>
                                                            {loc.address || "Địa chỉ chưa xác định"}
                                                        </span>
                                                    </div>

                                                {loc.reviewNote ? (
                                                    <div className="flex items-start gap-1.5 mt-2">
                                                        <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                                                        <p className={`text-xs ${textMutedClass} line-clamp-2 italic`}>
                                                            "{loc.reviewNote}"
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
                                                        <span className={`text-sm font-bold ${textPrimaryClass}`}>{workCount} ca làm</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] uppercase ${textMutedClass} font-semibold`}>Đánh giá</span>
                                                        {loc.review ? (
                                                            <span className={`text-sm font-bold ${loc.review === 'high' ? 'text-green-500' : 'text-red-500'}`}>
                                                                {loc.review === 'high' ? 'Tốt' : 'Kém'}
                                                            </span>
                                                        ) : (
                                                            <span className={`text-sm font-bold ${textMutedClass} opacity-50`}>
                                                                Trống
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {hasMore && (
                                    <LoadMore
                                        currentCount={visibleCount}
                                        totalCount={filteredLocations.length}
                                        onLoadMore={handleLoadMore}
                                        unit="địa điểm"
                                        className="pt-2 pb-4"
                                    />
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
                            disabled={!isChanged || isSubmitting}
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
                        <label className={`block text-sm font-medium ${textSecondaryClass} mb-1.5`}>Địa chỉ & Tọa độ</label>
                        <div className="space-y-3">
                            <div className="relative" ref={suggestionRef}>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                    onFocus={() => address.length >= 3 && setShowSuggestions(true)}
                                    placeholder="Nhập địa chỉ (Ví dụ: 2739 Phạm Thế Hiển)"
                                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${inputBgClass} ${inputBorderClass} ${textPrimaryClass}`}
                                />
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`absolute z-50 w-full mt-1 border rounded-xl shadow-xl overflow-hidden ${cardBgClass} ${borderClass}`}
                                        >
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSelectSuggestion(s)}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b last:border-0 ${borderClass} ${hoverBgClass} ${textPrimaryClass}`}
                                                >
                                                    <div className="font-medium line-clamp-1">{s.display_name.split(',')[0]}</div>
                                                    <div className={`text-[10px] ${textSecondaryClass} line-clamp-1`}>{s.display_name}</div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={lat}
                                        onChange={(e) => setLat(e.target.value)}
                                        placeholder="Vĩ độ (Latitude)"
                                        className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs lg:text-sm overflow-hidden text-ellipsis ${inputBgClass} ${inputBorderClass} ${textPrimaryClass}`}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={lng}
                                        onChange={(e) => setLng(e.target.value)}
                                        placeholder="Kinh độ (Longitude)"
                                        className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs lg:text-sm overflow-hidden text-ellipsis ${inputBgClass} ${inputBorderClass} ${textPrimaryClass}`}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-blue-500 px-1 italic">
                                * Lấy tọa độ từ Google Maps để hiển thị bản đồ chính xác.
                            </p>
                        </div>
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

export default memo(LocationManager);
