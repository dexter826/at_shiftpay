import React, { memo } from 'react';
import Button from '../../ui/Button';
import ExportIcon from '../../ui/icons/export-icon';

interface DashboardHeaderProps {
    user: any;
    onOpenExport: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onOpenExport }) => {
    return (
        <div className={`hidden md:block py-4 px-6 border-b border-[var(--border-color)]`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img
                        src={user?.photoURL || "/avatar.png"}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                        onError={(e) => {
                            e.currentTarget.src = "/avatar.png";
                        }}
                    />
                    <div>
                        <p className={`text-sm text-[var(--text-secondary)]`}>Xin chào,</p>
                        <h2 className={`text-lg font-semibold text-[var(--text-primary)]`}>
                            {user?.displayName || user?.email?.split('@')[0] || 'Người dùng'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={onOpenExport}
                        variant="primary"
                        className="flex items-center gap-2"
                        icon={<ExportIcon size={18} />}
                    >
                        <span>Xuất báo cáo</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default memo(DashboardHeader);
