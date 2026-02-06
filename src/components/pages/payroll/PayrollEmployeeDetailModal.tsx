import React, { memo } from 'react';
import { Modal } from '../../ui/Modal';
import Button from '../../ui/Button';
import { Banknote, Calculator, Calendar, CheckCircle2, MapPin } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/format';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { PayrollSummary, Shift, Event, Location } from '../../../types';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployeeSummary: PayrollSummary | null | undefined;
  selectedUnpaidShifts: Shift[];
  selectedAdvancedShifts: Shift[];
  onPayment: () => void;
  onSettlement: () => void;
  events: Event[];
  locations: Location[];
}

const PayrollEmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  selectedEmployeeSummary,
  selectedUnpaidShifts,
  selectedAdvancedShifts,
  onPayment,
  onSettlement,
  events,
  locations,
}) => {
  const {
    cardBgClass,
    borderClass,
    textSecondaryClass,
    textMutedClass,
    hoverBgClass,
  } = useThemeStyles();

  return (
    <Modal
      title={selectedEmployeeSummary?.employeeName || "Chi tiết"}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex gap-2 w-full">
          {selectedEmployeeSummary && selectedEmployeeSummary.totalUnpaid > 0 && (
            <Button
              onClick={onPayment}
              className="flex-1"
              variant={selectedEmployeeSummary.advancedCount > 0 ? 'warning' : 'primary'}
            >
              <Banknote size={16} />
              Thanh toán / Ứng
            </Button>
          )}
          {selectedEmployeeSummary && selectedEmployeeSummary.advancedCount > 0 && (
            <Button
              onClick={onSettlement}
              className="flex-1"
            >
              <Calculator size={16} className="text-white" />
              Quyết toán
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tổng quan */}
        {selectedEmployeeSummary && (
          <div className={`p-4 ${cardBgClass} border ${borderClass} rounded-lg`}>
            <div className="space-y-3">
              <div>
                <span className={textMutedClass}>Tổng tiền đã làm:</span>
                <p className={`font-bold text-lg text-blue-500`}>
                  {formatCurrency(selectedEmployeeSummary.totalUnpaid + selectedEmployeeSummary.totalAdvanced)}
                </p>
              </div>

              <div className="space-y-1 text-sm border-t border-dashed border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between">
                  <span className={textMutedClass}>Đã nhận (ứng):</span>
                  <span className="text-orange-500 font-medium">
                    {formatCurrency(selectedEmployeeSummary.totalAdvanced)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={textMutedClass}>Còn lại cần trả:</span>
                  <span className="text-primary font-bold">
                    {formatCurrency(selectedEmployeeSummary.totalUnpaid)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thông tin tạm ứng */}
        {selectedUnpaidShifts.length === 0 ? (
          selectedAdvancedShifts.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <p className={`text-xs ${textMutedClass} uppercase tracking-wide`}>Ca đã ứng tiền</p>
              </div>
              {selectedAdvancedShifts.map((s) => {
                const event = events.find(e => e.id === s.eventId);
                return (
                  <div
                    key={s.id}
                    className={`flex justify-between items-center p-3 border rounded-lg ${hoverBgClass} ${borderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-orange-500" />
                      <div>
                        <p className={`text-sm font-medium ${textSecondaryClass}`}>{event?.title || 'Không rõ sự kiện'}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-primary'}`}>
                            {s.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                          </span>
                          <span className={`text-[10px] ${textMutedClass}`}>•</span>
                          <span className={`text-[10px] ${textMutedClass}`}>{formatDate(s.date)}</span>
                        </div>
                        {event?.locationId && (
                          <p className={`text-[10px] ${textMutedClass} mt-0.5 flex items-center gap-1`}>
                            <MapPin size={10} />
                            {locations.find(l => l.id === event.locationId)?.name || 'Không rõ địa điểm'}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm font-medium text-orange-500`}>{formatCurrency(s.amount)}</p>
                  </div>
                );
              })}
            </>
          ) : (
            <div className={`py-8 flex flex-col items-center justify-center ${textMutedClass} gap-2`}>
              <CheckCircle2 size={32} className="text-primary" />
              <p className="text-sm">Không còn ca chưa thanh toán</p>
            </div>
          )
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className={`text-xs ${textMutedClass} uppercase tracking-wide`}>Công chưa trả</p>
            </div>
            {selectedUnpaidShifts.map((s) => {
              const event = events.find(e => e.id === s.eventId);
              return (
                <div
                  key={s.id}
                  className={`flex justify-between items-center p-3 border rounded-lg ${hoverBgClass} ${borderClass}`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className={textMutedClass} />
                    <div>
                      <p className={`text-sm font-medium ${textSecondaryClass}`}>{event?.title || 'Không rõ sự kiện'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-primary'}`}>
                          {s.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                        </span>
                        <span className={`text-[10px] ${textMutedClass}`}>•</span>
                        <span className={`text-[10px] ${textMutedClass}`}>{formatDate(s.date)}</span>
                      </div>
                      {event?.locationId && (
                        <p className={`text-[10px] ${textMutedClass} mt-0.5 flex items-center gap-1`}>
                          <MapPin size={10} />
                          {locations.find(l => l.id === event.locationId)?.name || 'Không rõ địa điểm'}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${textSecondaryClass}`}>{formatCurrency(s.amount)}</p>
                </div>
              );
            })}
          </>
        )}
      </div>
    </Modal>
  );
};

export default memo(PayrollEmployeeDetailModal);
