import React, { memo, useRef } from 'react';
import { Modal } from '../../ui/Modal';
import Button from '../../ui/Button';
import SimpleCheckedIcon from '../../ui/icons/simple-checked-icon';
import { formatCurrency } from '../../../utils/format';
import { AnimatedIconHandle } from '../../ui/icons/types';
import { PayrollSummary } from '../../../types';

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedShiftsTotal: number;
  selectedEmployeeSummary: PayrollSummary | null | undefined;
  selectedCount: number;
}

const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedShiftsTotal,
  selectedEmployeeSummary,
  selectedCount,
}) => {
  const confirmPayRef = useRef<AnimatedIconHandle>(null);

  return (
    <Modal
      title="Xác nhận thanh toán"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1"
            icon={<SimpleCheckedIcon ref={confirmPayRef} size={16} />}
            onMouseEnter={() => confirmPayRef.current?.startAnimation()}
            onMouseLeave={() => confirmPayRef.current?.stopAnimation()}
          >
            Xác nhận
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className={`text-sm text-[var(--text-secondary)]`}>
          Thanh toán {formatCurrency(selectedShiftsTotal)} cho {selectedEmployeeSummary?.employeeName}?
        </p>
        <div className={`p-3 hover:bg-[var(--border-color)] rounded-lg`}>
          <p className={`text-xs text-[var(--text-muted)] mb-1`}>Chi tiết:</p>
          <p className={`text-sm text-[var(--text-secondary)]`}>
            {selectedCount} ca làm việc được chọn
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default memo(ConfirmPaymentModal);
