import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import Button from '../../ui/Button';

import { Location } from '../../../types';

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY || 'free_key_placeholder';

interface LocationFormData {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    review?: 'high' | 'low';
    reviewNote: string;
}

interface LocationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingLocation: Location | null;
    onSubmit: (data: LocationFormData) => Promise<void>;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
    isOpen,
    onClose,
    editingLocation,
    onSubmit
}) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [review, setReview] = useState<'high' | 'low' | undefined>(undefined);
    const [reviewNote, setReviewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingLocation) {
                setName(editingLocation.name);
                setAddress(editingLocation.address || '');
                setLat(editingLocation.latitude?.toString() || '');
                setLng(editingLocation.longitude?.toString() || '');
                setReview(editingLocation.review);
                setReviewNote(editingLocation.reviewNote || '');
            } else {
                // Reset form
                setName('');
                setAddress('');
                setLat('');
                setLng('');
                setReview(undefined);
                setReviewNote('');
            }
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [isOpen, editingLocation]);

    // Click outside to close suggestions
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
        setAddress(suggestion.display_name);
        if (suggestion.lat && suggestion.lon) {
            setLat(suggestion.lat.toString());
            setLng(suggestion.lon.toString());
        }
        setShowSuggestions(false);
    };

    const isChanged = useMemo(() => {
        if (!editingLocation) return !!name.trim(); 
        return name.trim() !== editingLocation.name ||
            address.trim() !== (editingLocation.address || '') ||
            lat.trim() !== (editingLocation.latitude?.toString() || '') ||
            lng.trim() !== (editingLocation.longitude?.toString() || '') ||
            review !== editingLocation.review ||
            reviewNote.trim() !== (editingLocation.reviewNote || '');
    }, [name, address, lat, lng, review, reviewNote, editingLocation]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit({
                name: name.trim(),
                address: address.trim() || '',
                latitude: lat ? parseFloat(lat) : null,
                longitude: lng ? parseFloat(lng) : null,
                review,
                reviewNote: reviewNote.trim()
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingLocation ? 'Sửa địa điểm' : 'Thêm địa điểm mới'}
            footer={
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
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
                    <label className={`block text-sm font-medium text-[var(--text-secondary)] mb-1.5`}>Tên địa điểm</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập tên địa điểm"
                        className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]`}
                    />
                </div>

                <div>
                    <label className={`block text-sm font-medium text-[var(--text-secondary)] mb-1.5`}>Địa chỉ & Tọa độ</label>
                    <div className="space-y-3">
                        <div className="relative" ref={suggestionRef}>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => handleAddressChange(e.target.value)}
                                onFocus={() => address.length >= 3 && setShowSuggestions(true)}
                                placeholder="Nhập địa chỉ (Ví dụ: 2739 Phạm Thế Hiển)"
                                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]`}
                            />
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`absolute z-50 w-full mt-1 border rounded-lg shadow-xl overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]`}
                                    >
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelectSuggestion(s)}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b last:border-0 border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-primary)]`}
                                            >
                                                <div className="font-medium line-clamp-1">{s.display_name.split(',')[0]}</div>
                                                <div className={`text-[10px] text-[var(--text-secondary)] line-clamp-1`}>{s.display_name}</div>
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
                                    className={`w-full px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs lg:text-sm overflow-hidden text-ellipsis bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]`}
                                />
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={lng}
                                    onChange={(e) => setLng(e.target.value)}
                                    placeholder="Kinh độ (Longitude)"
                                    className={`w-full px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs lg:text-sm overflow-hidden text-ellipsis bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]`}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-blue-500 px-1 italic">
                            * Lấy tọa độ từ Google Maps để hiển thị bản đồ chính xác.
                        </p>
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium text-[var(--text-secondary)] mb-2`}>Đánh giá chất lượng</label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setReview('high')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${review === 'high'
                                ? 'bg-green-500/10 border-green-500 text-green-600'
                                : `bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-primary/50`
                                }`}
                        >
                            <ThumbsUp size={18} />
                            <span className="font-medium">Tốt</span>
                        </button>
                        <button
                            onClick={() => setReview(undefined)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${review === undefined
                                ? 'bg-primary/10 border-primary text-primary'
                                : `bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-primary/50`
                                }`}
                        >
                            <Minus size={18} />
                            <span className="font-medium">Thường</span>
                        </button>
                        <button
                            onClick={() => setReview('low')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${review === 'low'
                                ? 'bg-red-500/10 border-red-500 text-red-600'
                                : `bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-red-500/50`
                                }`}
                        >
                            <ThumbsDown size={18} />
                            <span className="font-medium">Kém</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium text-[var(--text-secondary)] mb-1.5`}>Ghi chú đánh giá</label>
                    <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Lưu ý về địa điểm này..."
                        rows={3}
                        className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]`}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default memo(LocationFormModal);
