import React, { memo, useRef } from 'react';
import { Modal } from '../../ui/Modal';
import ChevronLeftIcon from '../../ui/icons/chevron-left-icon';
import ChevronRightIcon from '../../ui/icons/chevron-right-icon';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { AnimatedIconHandle } from '../../ui/icons/types';

interface MonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  viewYear: number;
  setViewYear: React.Dispatch<React.SetStateAction<number>>;
}

const MonthPickerModal: React.FC<MonthPickerModalProps> = ({
  isOpen,
  onClose,
  filterDate,
  setFilterDate,
  viewYear,
  setViewYear,
}) => {
  const {
    borderClass,
    textSecondaryClass,
    textPrimaryClass,
    hoverBgClass,
  } = useThemeStyles();

  const prevMonthRef = useRef<AnimatedIconHandle>(null);
  const nextMonthRef = useRef<AnimatedIconHandle>(null);

  return (
    <Modal
      title="Chọn thời gian"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <button
          onClick={() => {
            setFilterDate('');
            onClose();
          }}
          className={`w-full py-2.5 rounded-lg text-sm font-medium border ${borderClass} ${textSecondaryClass} hover:${hoverBgClass} transition-colors`}
        >
          Xem tất cả lịch sử
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <button
            onClick={() => setViewYear(prev => prev - 1)}
            onMouseEnter={() => prevMonthRef.current?.startAnimation()}
            onMouseLeave={() => prevMonthRef.current?.stopAnimation()}
            className={`p-1 rounded-full ${hoverBgClass}`}
          >
            <ChevronLeftIcon ref={prevMonthRef} size={20} className={textSecondaryClass} />
          </button>
          <span className={`text-lg font-bold ${textPrimaryClass}`}>{viewYear}</span>
          <button
            onClick={() => setViewYear(prev => prev + 1)}
            onMouseEnter={() => nextMonthRef.current?.startAnimation()}
            onMouseLeave={() => nextMonthRef.current?.stopAnimation()}
            className={`p-1 rounded-full ${hoverBgClass}`}
          >
            <ChevronRightIcon ref={nextMonthRef} size={20} className={textSecondaryClass} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
            const monthStr = month.toString().padStart(2, '0');
            const value = `${viewYear}-${monthStr}`;
            const isSelected = filterDate === value;
            const isCurrentMonth = new Date().getMonth() + 1 === month && new Date().getFullYear() === viewYear;

            return (
              <button
                key={month}
                onClick={() => {
                  setFilterDate(value);
                  onClose();
                }}
                className={`
                         py-3 rounded-lg text-sm font-medium transition-colors border
                         ${isSelected
                    ? 'bg-primary text-white border-primary'
                    : `
                               ${hoverBgClass}
                               ${borderClass} ${textSecondaryClass}
                               ${isCurrentMonth ? 'border-primary/50 text-primary' : ''}
                            `
                  }
                      `}
              >
                Tháng {month}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default memo(MonthPickerModal);
