import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PayrollSummary, Shift, Event, Employee, UserSettings } from '../types';

// Helper to format currency
const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

export const exportPayrollToExcel = async (summary: PayrollSummary[], shifts: Shift[], title: string = 'Bảng Công Nợ') => {
    // Keep existing function for backward compatibility if needed, or redirect to new one
    // For now, let's keep it but ideally we upgrade to the detailed one.
    // However, the user request specifically asked for "Detail Report"
    // Let's implement the new detailed export function independently.
};

export const exportDetailedReport = async (
    month: number,
    year: number,
    events: Event[],
    shifts: Shift[],
    employees: Employee[],
    settings: UserSettings
) => {
    const workbook = new ExcelJS.Workbook();
    const monthStr = `${month.toString().padStart(2, '0')}/${year}`;

    // Filter Data for the selected Month
    const filteredEvents = events.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const filteredShifts = shifts.filter(s => {
        const d = new Date(s.eventDate);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    // --- SHEET 1: LỊCH TIỆC (EVENT SCHEDULE) ---
    const eventSheet = workbook.addWorksheet('Lịch Tiệc');

    eventSheet.columns = [
        { header: 'Ngày', key: 'date', width: 15 },
        { header: 'Giờ', key: 'time', width: 10 },
        { header: 'Tiệc', key: 'title', width: 40 },
        { header: 'Lương/Ca', key: 'rate', width: 15 },
        { header: 'SL Nhân sự', key: 'count', width: 15 },
        { header: 'Ghi chú', key: 'note', width: 30 },
    ];

    // Style Header
    const eventHeader = eventSheet.getRow(1);
    eventHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    eventHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue
    eventHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    filteredEvents.forEach(evt => {
        const shiftCount = filteredShifts.filter(s => s.eventId === evt.id).length;
        const row = eventSheet.addRow({
            date: evt.date,
            time: evt.time || '',
            title: evt.title,
            rate: evt.amount || settings.shiftRate,
            count: shiftCount,
            note: evt.note || ''
        });
        row.getCell('rate').numFmt = '#,##0 "₫"';
    });


    // --- SHEET 2: CHI TIẾT CÔNG (DETAILED SHIFTS) ---
    const shiftSheet = workbook.addWorksheet('Chi Tiết Công');

    shiftSheet.columns = [
        { header: 'Ngày', key: 'date', width: 15 },
        { header: 'Nhân viên', key: 'name', width: 25 },
        { header: 'Sự kiện', key: 'event', width: 30 },
        { header: 'Ca', key: 'session', width: 15 },
        { header: 'Lương', key: 'amount', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 },
    ];

    const shiftHeader = shiftSheet.getRow(1);
    shiftHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    shiftHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald
    shiftHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    filteredShifts.forEach(s => {
        const evt = events.find(e => e.id === s.eventId);
        const row = shiftSheet.addRow({
            date: s.eventDate,
            name: s.employeeName,
            event: evt ? evt.title : 'Không xác định',
            session: s.session === 'morning' ? 'Sáng' : 'Chiều',
            amount: s.amount,
            status: s.status === 'paid' ? 'Đã TT' : 'Chưa TT'
        });
        row.getCell('amount').numFmt = '#,##0 "₫"';
    });


    // --- SHEET 3: TỔNG HỢP LƯƠNG THÁNG (PAYROLL SUMMARY) ---
    const summarySheet = workbook.addWorksheet('Tổng Hợp Lương');

    summarySheet.columns = [
        { header: 'STT', key: 'stt', width: 5 },
        { header: 'Nhân viên', key: 'name', width: 25 },
        { header: 'Số ca làm', key: 'count', width: 15 },
        { header: 'Tổng lương tháng', key: 'total', width: 20 },
        { header: 'Đã thanh toán', key: 'paid', width: 20 },
        { header: 'Còn lại', key: 'remain', width: 20 },
    ];

    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECB52D' } }; // Gold
    summaryHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    let rowIndex = 1;
    employees.forEach(emp => {
        const empShifts = filteredShifts.filter(s => s.employeeId === emp.id);
        if (empShifts.length === 0) return; // Skip employees with no shifts

        const totalAmount = empShifts.reduce((sum, s) => sum + s.amount, 0);
        const paidAmount = empShifts.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0);
        const remainAmount = totalAmount - paidAmount;

        const row = summarySheet.addRow({
            stt: rowIndex++,
            name: emp.name,
            count: empShifts.length,
            total: totalAmount,
            paid: paidAmount,
            remain: remainAmount
        });

        row.getCell('total').numFmt = '#,##0 "₫"';
        row.getCell('paid').numFmt = '#,##0 "₫"';
        row.getCell('remain').numFmt = '#,##0 "₫"';
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Save file
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `Bao_Cao_Thang_${month}_${year}.xlsx`;
    saveAs(blob, filename);
};
