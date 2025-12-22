import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PayrollSummary, Shift, Event, Employee, UserSettings } from '../types';


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
        { header: 'Ngày', key: 'date' },
        { header: 'Tên sự kiện', key: 'event' },
        { header: 'Địa điểm', key: 'location' },
        { header: 'Ca làm', key: 'session' },
        { header: 'Tổng công', key: 'count' },
        { header: 'Người làm', key: 'workers' },
        { header: 'Lương/người', key: 'eventAmount' },
        { header: 'Phụ phí', key: 'surcharge' },
        { header: 'Tổng tiền', key: 'amount' },
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
        location: string;
        eventAmount: number;
        session: string;
        shiftIds: string[];
        surcharge: number;
        amount: number;
        workerNames: string[];
    }>();

    // Lọc ca theo tháng
    const filteredShifts = shifts.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    filteredShifts.forEach(shift => {
        const key = `${shift.eventId}_${shift.session}`;

        if (!groupedData.has(key)) {
            const event = events.find(e => e.id === shift.eventId);
            groupedData.set(key, {
                date: shift.date,
                eventTitle: event ? event.title : 'Sự kiện không xác định',
                location: event?.location || '',
                eventAmount: event?.amount || 0,
                session: shift.session === 'morning' ? 'Sáng' : 'Chiều',
                shiftIds: [],
                surcharge: event?.surcharge || 0,
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
            location: group.location,
            session: group.session,
            count: group.workerNames.length,
            workers: group.workerNames.join(', '),
            eventAmount: group.eventAmount,
            surcharge: group.surcharge,
            amount: group.amount
        });

        // Style cho các ô
        row.getCell('date').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('location').alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell('session').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('count').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('workers').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell('eventAmount').alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell('eventAmount').numFmt = '#,##0 "₫"';
        row.getCell('surcharge').alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell('surcharge').numFmt = '#,##0 "₫"';
        row.getCell('amount').alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell('amount').numFmt = '#,##0 "₫"';
    });

    // Auto-fit cột dựa trên nội dung
    sheet.columns.forEach((col, index) => {
        let maxLength = col.header?.length || 0;
        sheet.getColumn(index + 1).eachCell((cell, rowNumber) => {
            if (rowNumber > 1) { // Bỏ qua header
                const cellValue = cell.value ? cell.value.toString() : '';
                if (cellValue.length > maxLength) {
                    maxLength = cellValue.length;
                }
            }
        });
        col.width = Math.min(maxLength + 2, 50); // Giới hạn max width là 50
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
