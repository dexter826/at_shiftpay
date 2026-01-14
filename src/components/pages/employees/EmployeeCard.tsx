import React, { memo } from 'react';
import { Phone, Briefcase, Trash2, CheckCircle, CircleAlert, Check } from 'lucide-react';
import PenIcon from '../../ui/icons/pen-icon';
import TrashIcon from '../../ui/icons/trash-icon';
import { CardActionButton } from '../../ui/CardActionButton';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { Employee } from '../../../types';

interface EmployeeCardProps {
  employee: Employee;
  shiftCount: number;
  onClick: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (empId: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  shiftCount,
  onClick,
  onEdit,
  onDelete,
}) => {
  const {
    cardBgClass,
    borderClass,
    textMutedClass,
    highlightBgClass,
  } = useThemeStyles();

  return (
    <div
      onClick={() => onClick(employee)}
      className={`flex flex-col ${cardBgClass} border ${borderClass} rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-lg relative aspect-square cursor-pointer`}
    >
      {/* Ảnh cover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${highlightBgClass}`}>
        {employee.imageUrl ? (
          <img
            src={employee.imageUrl}
            alt={employee.name}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&color=fff&size=256`;
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${textMutedClass} ${highlightBgClass}`}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Gradient làm nền cho chữ */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Thao tác nhanh */}
        <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-10">
          <CardActionButton
            onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
            icon={<PenIcon />}
            title="Sửa thông tin"
          />
          <CardActionButton
            onClick={(e) => { e.stopPropagation(); onDelete(employee.id); }}
            variant="danger"
            icon={<TrashIcon />}
            title="Xóa nhân viên"
          />
        </div>

        {/* Badge ngân hàng */}
        <div className="absolute top-2 left-2 z-10">
          {employee.bankAccount ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/80 text-white text-[10px] font-medium shadow-sm">
              <CheckCircle size={12} />
              <span>Ngân hàng</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/80 text-white text-[10px] font-medium shadow-sm">
              <CircleAlert size={12} />
              <span>Ngân hàng</span>
            </div>
          )}
        </div>
      </div>

      {/* Thông tin chính */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10 text-white">
        <h3 className="text-sm font-bold truncate leading-tight mb-1 shadow-black/50 drop-shadow-sm">{employee.name}</h3>

        <div className="flex flex-col gap-0.5 text-[11px] text-slate-200">
          <div className="flex items-center gap-1.5 opacity-90">
            <Phone size={10} className="shrink-0" />
            <span className="truncate">{employee.phone || '---'}</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-primary">
            <Briefcase size={10} className="shrink-0" />
            <span>{shiftCount} công</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(EmployeeCard);
