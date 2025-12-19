// Hệ thống màu sắc thống nhất cho ứng dụng

export const PAYMENT_COLORS = {
    // Màu chủ đạo của ứng dụng
    PRIMARY: '#ecb52d',

    // Màu sắc cho các trạng thái thanh toán
    UNPAID: '#ecb52d',        // Còn cần trả (vàng chủ đạo)
    PAID: '#10b981',          // Đã thanh toán (xanh lá)
    ADVANCED: '#f97316',      // Đã ứng tiền (cam)
    TOTAL_EARNED: '#3b82f6',  // Tổng đã làm (xanh dương)

    // Màu sắc cho các loại giao dịch
    REGULAR_PAYMENT: '#10b981',   // Thanh toán thường
    ADVANCE_PAYMENT: '#f97316',   // Ứng tiền
    SETTLEMENT: '#3b82f6',        // Quyết toán

    // Màu sắc cho trạng thái
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
} as const;

export const PAYMENT_COLOR_CLASSES = {
    // Text colors
    UNPAID_TEXT: 'text-[#ecb52d]',
    PAID_TEXT: 'text-emerald-500',
    ADVANCED_TEXT: 'text-orange-500',
    TOTAL_EARNED_TEXT: 'text-blue-500',

    // Background colors
    UNPAID_BG: 'bg-[#ecb52d]/10',
    PAID_BG: 'bg-emerald-50 dark:bg-emerald-900/20',
    ADVANCED_BG: 'bg-orange-50 dark:bg-orange-900/20',
    TOTAL_EARNED_BG: 'bg-blue-50 dark:bg-blue-900/20',

    // Border colors
    UNPAID_BORDER: 'border-[#ecb52d]/20',
    PAID_BORDER: 'border-emerald-200 dark:border-emerald-800',
    ADVANCED_BORDER: 'border-orange-200 dark:border-orange-800',
    TOTAL_EARNED_BORDER: 'border-blue-200 dark:border-blue-800',
} as const;

// Hàm helper để lấy màu theo trạng thái
export const getPaymentStatusColor = (status: 'unpaid' | 'paid' | 'advanced') => {
    switch (status) {
        case 'unpaid':
            return PAYMENT_COLORS.UNPAID;
        case 'paid':
            return PAYMENT_COLORS.PAID;
        case 'advanced':
            return PAYMENT_COLORS.ADVANCED;
        default:
            return PAYMENT_COLORS.PRIMARY;
    }
};

// Hàm helper để lấy class CSS theo trạng thái
export const getPaymentStatusClass = (status: 'unpaid' | 'paid' | 'advanced') => {
    switch (status) {
        case 'unpaid':
            return PAYMENT_COLOR_CLASSES.UNPAID_TEXT;
        case 'paid':
            return PAYMENT_COLOR_CLASSES.PAID_TEXT;
        case 'advanced':
            return PAYMENT_COLOR_CLASSES.ADVANCED_TEXT;
        default:
            return PAYMENT_COLOR_CLASSES.UNPAID_TEXT;
    }
};