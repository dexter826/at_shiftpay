import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PayrollSummary, Shift } from '../types';

export const exportPayrollToExcel = async (summary: PayrollSummary[], shifts: Shift[], title: string = 'Bảng Công Nợ') => {
    const workbook = new ExcelJS.Workbook();

    // --- SHEET 1: TỔNG HỢP ---
    const summarySheet = workbook.addWorksheet('Tổng Hợp');

    // Define columns
    summarySheet.columns = [
        { header: 'STT', key: 'stt', width: 5 },
        { header: 'Tên nhân viên', key: 'name', width: 25 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Số công chưa thanh toán', key: 'count', width: 20 },
        { header: 'Tổng tiền nợ', key: 'amount', width: 20 },
    ];

    // Style header row
    const headerRow = summarySheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFECB52D' } // Gold
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data
    summary.forEach((item, index) => {
        const row = summarySheet.addRow({
            stt: index + 1,
            name: item.employeeName,
            phone: item.phone,
            count: item.unpaidCount,
            amount: item.totalUnpaid
        });

        if (typeof item.totalUnpaid === 'number') {
            row.getCell('amount').numFmt = '#,##0 "₫"';
        }
    });

    // Add Total Row
    const totalAmount = summary.reduce((sum, item) => sum + item.totalUnpaid, 0);
    const totalCount = summary.reduce((sum, item) => sum + item.unpaidCount, 0);

    summarySheet.addRow({});
    const totalRow = summarySheet.addRow({
        name: 'TỔNG CỘNG',
        count: totalCount,
        amount: totalAmount
    });

    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = '#,##0 "₫"';


    // --- SHEET 2: CHI TIẾT ---
    const detailSheet = workbook.addWorksheet('Chi Tiết');

    detailSheet.columns = [
        { header: 'STT', key: 'stt', width: 5 },
        { header: 'Ngày', key: 'date', width: 15 },
        { header: 'Tên nhân viên', key: 'name', width: 25 },
        { header: 'Ca làm việc', key: 'session', width: 15 },
        { header: 'Số tiền', key: 'amount', width: 15 },
    ];

    // Style detail header
    const detailHeader = detailSheet.getRow(1);
    detailHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' } // Dark Slate
    };
    detailHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    // Filter only unpaid shifts and sort by date
    const unpaidShifts = shifts
        .filter(s => s.status === 'unpaid')
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    unpaidShifts.forEach((shift, index) => {
        const row = detailSheet.addRow({
            stt: index + 1,
            date: shift.eventDate, // Keeping YYYY-MM-DD format
            name: shift.employeeName,
            session: shift.session === 'morning' ? 'Tiệc Sáng' : 'Tiệc Chiều',
            amount: shift.amount
        });

        row.getCell('amount').numFmt = '#,##0 "₫"';
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Save file
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `Bang_Cong_No_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, filename);
};
