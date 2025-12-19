import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PayrollSummary, Shift, Event, Employee, UserSettings } from '../types';

// Format tiền tệ
const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

export const exportPayrollToExcel = async (summary: PayrollSummary[], shifts: Shift[], title: string = 'Bảng Công Nợ') => {
    // Đã cũ. Dùng exportDetailedReport
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
    const sheet = workbook.addWorksheet('Báo Cáo Chi Tiết');

    // Cấu hình cột Excel
    sheet.columns = [
        { header: 'Ngày', key: 'date', width: 15 },
        { header: 'Tên sự kiện', key: 'event', width: 40 },
        { header: 'Ca làm', key: 'session', width: 15 },
        { header: 'Tổng công', key: 'count', width: 15 },
        { header: 'Người làm', key: 'workers', width: 50 },
        { header: 'Tổng tiền', key: 'amount', width: 20 },
    ];

    // Style tiêu đề
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Gom nhóm theo ca
    const groupedData = new Map<string, {
        date: string;
        eventTitle: string;
        session: string;
        shiftIds: string[];
        amount: number;
        workerNames: string[];
    }>();

    // Lọc ca theo tháng
    const filteredShifts = shifts.filter(s => {
        const d = new Date(s.eventDate);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    filteredShifts.forEach(shift => {
        const key = `${shift.eventId}_${shift.session}`;

        if (!groupedData.has(key)) {
            const event = events.find(e => e.id === shift.eventId);
            groupedData.set(key, {
                date: shift.eventDate,
                eventTitle: event ? event.title : 'Sự kiện không xác định',
                session: shift.session === 'morning' ? 'Sáng' : 'Chiều',
                shiftIds: [],
                amount: 0,
                workerNames: []
            });
        }

        const group = groupedData.get(key)!;
        group.shiftIds.push(shift.id);
        group.amount += shift.amount;
        group.workerNames.push(shift.employeeName);
    });

    // Sắp xếp ngày tăng dần
    const sortedGroups = Array.from(groupedData.values()).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.session === 'Sáng' ? -1 : 1;
    });

    // Ghi dữ liệu vào dòng
    sortedGroups.forEach(group => {
        const row = sheet.addRow({
            date: group.date,
            event: group.eventTitle,
            session: group.session,
            count: group.workerNames.length,
            workers: group.workerNames.join(', '),
            amount: group.amount
        });

        // Style cho các ô
        row.getCell('date').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('session').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('count').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('workers').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell('amount').alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell('amount').numFmt = '#,##0 "₫"';
    });

    // Thêm viền bảng
    sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Xuất file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Tải file về máy
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `Bao_Cao_Thang_${month}_${year}.xlsx`;
    saveAs(blob, filename);
};
