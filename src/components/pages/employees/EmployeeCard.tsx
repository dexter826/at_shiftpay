import React, { memo, useState } from 'react';
import { Phone, Briefcase, Pencil, Trash2, Landmark } from 'lucide-react';
import { Employee } from '../../../types';

interface EmployeeCardProps {
  employee: Employee;
  shiftCount: number;
  onClick: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (empId: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, shiftCount, onClick, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = !!employee.imageUrl && !imgError;
  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-primary/30 transition-colors group cursor-pointer aspect-square"
      onClick={() => onClick(employee)}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]">
        {hasPhoto ? (
          <img
            src={employee.imageUrl}
            alt={employee.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[var(--text-muted)]">
            {initials}
          </div>
        )}

        {/* Gradient overlay for text */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        {/* Edit/Delete buttons */}
        <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
            className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            title="Sửa"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(employee.id); }}
            className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/60 transition-colors"
            title="Xóa"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Bank badge */}
        <div className="absolute top-2 left-2 z-10">
          {employee.bankAccount ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-medium shadow-sm">
              <Landmark size={10} />
              <span>Ngân hàng</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/70 text-white text-[10px] font-medium shadow-sm">
              <Landmark size={10} />
              <span>Ngân hàng</span>
            </span>
          )}
        </div>
      </div>

      {/* Info at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
        <h3 className="text-sm font-bold text-white truncate leading-tight drop-shadow-sm">{employee.name}</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-white/80 mt-0.5">
          <span className="flex items-center gap-1"><Phone size={9} />{employee.phone || '---'}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
          <span className="flex items-center gap-1"><Briefcase size={9} />{shiftCount}</span>
        </div>
      </div>
    </div>
  );
};

export default memo(EmployeeCard);
