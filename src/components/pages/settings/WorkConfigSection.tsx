import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Save, Loader2 } from 'lucide-react';
import { UserSettings } from '../../../types';
import { dbService } from '../../../services';
import { useToast } from '../../ui/Toast';
import Button from '../../ui/Button';
import { TimePicker } from '../../ui/TimePicker';

interface WorkConfigSectionProps {
    userUid: string;
    settings: UserSettings;
}

const WorkConfigSection: React.FC<WorkConfigSectionProps> = ({ userUid, settings }) => {
    
    const { showToast } = useToast();

    const [editSettings, setEditSettings] = useState<UserSettings>(settings);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEditSettings(settings); // Sync with props when they change
    }, [settings]);

    const hasChanges = JSON.stringify(editSettings) !== JSON.stringify(settings);

    const handleChange = (key: keyof UserSettings, value: any) => {
        setEditSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleCancelSettings = () => {
        setEditSettings(settings);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await dbService.updateSettings(userUid, editSettings);
            showToast('Đã lưu cài đặt', 'success');
        } catch (err) {
            console.error(err);
            showToast('Có lỗi xảy ra', 'error');
        }
        setSaving(false);
    };

    return (
        <section>
            <div className={`flex items-center gap-2 mb-4 px-1 text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider`}>
                <Briefcase size={16} />
                <span>Cấu hình công việc</span>
            </div>
            
            <div className={`bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Mức lương */}
                    <div className={`p-4 border-b sm:border-r lg:border-b-0 border-[var(--border-color)]`}>
                        <div className="flex items-center justify-between mb-2">
                            <label className={`font-medium text-[var(--text-primary)]`}>Mức lương / ca</label>
                            <span className={`text-xs text-[var(--text-muted)] px-2 py-1 rounded bg-[var(--border-color)]`}>VNĐ</span>
                        </div>
                        <input
                            type="number"
                            value={editSettings.shiftRate}
                            onChange={(e) => handleChange('shiftRate', Number(e.target.value))}
                            className={`w-full p-3 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:border-primary transition-colors`}
                        />
                        <p className={`text-xs text-[var(--text-muted)] mt-2`}>Áp dụng cho các ca làm việc mới</p>
                    </div>

                    {/* Giờ trực - Sáng */}
                    <div className={`p-4 border-b lg:border-r lg:border-b-0 border-[var(--border-color)]`}>
                        <label className={`block font-medium text-[var(--text-primary)] mb-3`}>Giờ bắt đầu ca sáng</label>
                        <TimePicker
                            value={editSettings.morningTime}
                            onChange={(v) => handleChange('morningTime', v)}
                        />
                    </div>

                    {/* Giờ trực - Chiều */}
                    <div className="p-4">
                        <label className={`block font-medium text-[var(--text-primary)] mb-3`}>Giờ bắt đầu ca chiều</label>
                        <TimePicker
                            value={editSettings.afternoonTime}
                            onChange={(v) => handleChange('afternoonTime', v)}
                        />
                    </div>
                </div>

                {/* Nút thao tác khi có thay đổi */}
                <AnimatePresence>
                    {hasChanges && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className={`p-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3`}>
                                <Button
                                    onClick={handleCancelSettings}
                                    disabled={saving}
                                    variant="outline"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                    ) : (
                                        <Save size={16} className="mr-2" />
                                    )}
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default WorkConfigSection;
