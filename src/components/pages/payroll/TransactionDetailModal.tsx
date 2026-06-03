import React, { memo } from 'react';
import { Modal } from '../../ui/Modal';
import { Calendar, MapPin } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/format';
import { PaymentTransaction, Shift, Event, Location } from '../../../types';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransaction: PaymentTransaction | null | undefined;
  transactionShifts: Shift[];
  events: Event[];
  locations: Location[];
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  selectedTransaction,
  transactionShifts,
  events,
  locations,
}) => {
  

  return (
    <Modal
      title="Chi tiết thanh toán"
      isOpen={isOpen}
      onClose={onClose}
      footer={null}
    >
      <div className="space-y-3">
        {/* Thông tin chung */}
        <div className={`p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs text-[var(--text-muted)]`}>Loại giao dịch</span>
                {selectedTransaction?.type === 'advance' && (
                  <span className="px-2 py-0.5 text-xs bg-transparent border border-orange-500 text-orange-500 rounded-full">
                    Ứng tiền
                  </span>
                )}
                {selectedTransaction?.type === 'settlement' && (
                  <span className="px-2 py-0.5 text-xs bg-transparent border border-blue-500 text-blue-500 rounded-full">
                    Quyết toán
                  </span>
                )}
                {(!selectedTransaction?.type || selectedTransaction?.type === 'regular') && (
                  <span className="px-2 py-0.5 text-xs bg-transparent border border-green-500 text-green-500 rounded-full">
                    Thanh toán thường
                  </span>
                )}
              </div>
              <span className={`text-xl font-bold text-[var(--text-secondary)]`}>
                {formatCurrency(selectedTransaction?.amount || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs text-[var(--text-muted)]`}>Thời gian</span>
              <p className={`text-sm font-medium text-[var(--text-secondary)]`}>
                {selectedTransaction ? new Date(selectedTransaction.date).toLocaleString('vi-VN') : ''}
              </p>
            </div>
          </div>

          {selectedTransaction?.note && (
            <div className={`pt-2 border-t border-[var(--border-color)]`}>
              <span className={`text-xs text-[var(--text-muted)]`}>Ghi chú:</span>
              <p className={`text-sm text-[var(--text-secondary)]`}>{selectedTransaction.note}</p>
            </div>
          )}
        </div>

        <p className={`text-xs text-[var(--text-muted)] uppercase tracking-wide pt-2`}>Các ca làm việc</p>
        {transactionShifts.length === 0 ? (
          <div className={`py-4 text-center text-[var(--text-muted)]`}>
            <p className="text-sm">Không tìm thấy thông tin ca làm việc (Có thể đã bị xóa)</p>
          </div>
        ) : (
          transactionShifts.map((s) => {
            const event = events.find(e => e.id === s.eventId);
            return (
              <div key={s.id} className={`flex justify-between items-center p-3 hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-lg`}>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-[var(--text-muted)]" />
                  <div>
                    <p className={`text-sm font-medium text-[var(--text-secondary)]`}>{event?.title || 'Không rõ sự kiện'}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium ${s.session === 'morning' ? 'text-orange-500' : 'text-primary'
                        }`}>
                        {s.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều'}
                      </span>
                      <span className={`text-[10px] text-[var(--text-muted)]`}>•</span>
                      <span className={`text-[10px] text-[var(--text-muted)]`}>{formatDate(s.date)}</span>
                    </div>
                    {event?.locationId && (
                      <p className={`text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1`}>
                        <MapPin size={10} />
                        {locations.find(l => l.id === event.locationId)?.name || 'Không rõ địa điểm'}
                      </p>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-medium text-[var(--text-secondary)]`}>{formatCurrency(s.amount)}</p>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default memo(TransactionDetailModal);
