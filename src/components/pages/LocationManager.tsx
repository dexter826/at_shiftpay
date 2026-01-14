import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import ArrowNarrowLeftIcon from '../ui/icons/arrow-narrow-left-icon';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Location, Event } from '../../types';
import { dbService } from '../../services';
import { useToast } from '../ui/Toast';
import { useAuthStore } from '../../stores';
import Button from '../ui/Button';
import PlusIcon from '../ui/icons/plus-icon';
import TrashIcon from '../ui/icons/trash-icon';
import XIcon from '../ui/icons/x-icon';
import { Modal } from '../ui/Modal';
import { AnimatedIconHandle } from '../ui/icons/types';

// Import extracted components
import LocationStats from './locations/LocationStats';
import LocationToolbar from './locations/LocationToolbar';
import LocationList from './locations/LocationList';
import LocationFormModal from './locations/LocationFormModal';

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
        bgClass,
        textPrimaryClass,
        textSecondaryClass,
        textMutedClass,
        hoverBgClass
    } = useThemeStyles();
    
    const { user } = useAuthStore();
    const userId = user?.uid || '';
    const { showToast } = useToast();
    
    const backIconRef = useRef<AnimatedIconHandle>(null);

    // Filter/Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'high' | 'low'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'count' | 'newest'>('newest');
    const [visibleCount, setVisibleCount] = useState(12);

    // Data State
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Fetch Events for work count
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
    }, [userId]);

    // Reset pagination on filter change
    useEffect(() => {
        setVisibleCount(12);
    }, [searchTerm, filterType, sortBy]);

    // Preload static maps
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

    // Derived State
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
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = 
                loc.name.toLowerCase().includes(searchLower) ||
                (loc.address || '').toLowerCase().includes(searchLower) ||
                (loc.reviewNote || '').toLowerCase().includes(searchLower);
            
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

    // Handlers
    const handleOpenAdd = () => {
        setEditingLocation(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (loc: Location) => {
        setEditingLocation(loc);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: any) => {
        try {
            if (editingLocation) {
                await dbService.updateLocation(editingLocation.id, data);
                showToast('Cập nhật địa điểm thành công', 'success');
            } else {
                await dbService.addLocation(data, userId);
                showToast('Thêm địa điểm thành công', 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast('Có lỗi xảy ra', 'error');
            throw error; // Re-throw for modal to handle loading state if needed
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
        <div className={`pb-28 ${bgClass} min-h-screen px-4 pt-5 md:px-6 md:pt-6 md:pb-8`}>
            <div className="w-full space-y-6">
                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                onMouseEnter={() => backIconRef.current?.startAnimation()}
                                onMouseLeave={() => backIconRef.current?.stopAnimation()}
                                className={`p-2 rounded-full transition-colors ${hoverBgClass} flex items-center justify-center`}
                                title="Quay lại"
                            >
                                <ArrowNarrowLeftIcon ref={backIconRef} size={20} className={textPrimaryClass} />
                            </button>
                        )}
                        <div>
                            <h2 className={`text-xl font-semibold ${textPrimaryClass}`}>Quản lý địa điểm</h2>
                            <p className={`text-sm ${textSecondaryClass} mt-0.5`}>Danh sách các địa điểm và đánh giá chất lượng.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <LocationStats stats={stats} />
                        <div className="flex gap-2 flex-1 md:w-auto md:flex-none">
                            <Button
                                onClick={handleOpenAdd}
                                variant="primary"
                                fullWidth
                                className="md:w-auto flex items-center justify-center gap-2"
                                icon={<PlusIcon size={16} />}
                            >
                                <span className="whitespace-nowrap">Thêm mới</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <LocationToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClearSearch={() => setSearchTerm('')}
                    filterType={filterType}
                    onFilterChange={setFilterType}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />

                {/* List */}
                <LocationList
                    loading={loading || loadingEvents}
                    locations={filteredLocations}
                    visibleCount={visibleCount}
                    onLoadMore={() => setVisibleCount(prev => Math.min(prev + 12, filteredLocations.length))}
                    workCounts={workCounts}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    theme={useThemeStyles().theme}
                />
            </div>

            {/* Modal Xác nhận xóa */}
            <Modal
                title="Xác nhận xóa"
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                footer={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1" icon={<XIcon size={16} />}>Hủy</Button>
                        <Button variant="danger" onClick={confirmDelete} className="flex-1" icon={<TrashIcon size={16} />}>Xóa</Button>
                    </div>
                }
            >
                <p className={`text-sm ${textSecondaryClass}`}>Bạn có chắc chắn muốn xóa địa điểm này? Hành động này không thể hoàn tác.</p>
            </Modal>

            {/* Modal Form */}
            <LocationFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingLocation={editingLocation}
                onSubmit={handleFormSubmit}
            />
        </div>
    );
};

export default memo(LocationManager);
