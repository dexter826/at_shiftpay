import { Shift, Event, Employee, UserSettings, Location } from '../types';

export const exportDetailedReport = (
    month: number,
    year: number,
    events: Event[],
    shifts: Shift[],
    employees: Employee[],
    locations: Location[],
    settings: UserSettings,
    onlyDebt: boolean = false
) => {
    // Gom nhóm theo ca
    const groupedData = new Map<string, {
        date: string;
        eventTitle: string;
        location: string;
        eventNote: string;
        eventAmount: number;
        session: string;
        shiftIds: string[];
        surcharge: number;
        amount: number;
        workerNames: string[];
    }>();

    // Lọc theo tháng và công nợ
    const filteredShifts = shifts.filter(s => {
        // Kiểm tra thời gian
        const d = new Date(s.date);
        let matchesTime = true;

        if (month !== 0) {
            matchesTime = d.getMonth() + 1 === month && d.getFullYear() === year;
        } else if (year !== 0) {
            matchesTime = d.getFullYear() === year;
        }

        if (!matchesTime) return false;

        // Lọc theo công nợ
        if (onlyDebt) {
            return s.status !== 'paid';
        }

        return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    filteredShifts.forEach(shift => {
        const key = `${shift.eventId}_${shift.session}`;

        if (!groupedData.has(key)) {
            const event = events.find(e => e.id === shift.eventId);
            const locationName = event?.locationId
                ? locations.find(l => l.id === event.locationId)?.name || ''
                : '';

            groupedData.set(key, {
                date: shift.date,
                eventTitle: event ? event.title : 'Sự kiện không xác định',
                location: locationName,
                eventNote: event?.note || '',
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

    // Tạo CSV
    const headers = ['Ngày', 'Tên sự kiện', 'Địa điểm', 'Ca làm', 'Ghi chú', 'Tổng công', 'Người làm', 'Lương/người', 'Phụ phí', 'Tổng tiền'];
    const csvRows = [headers];

    sortedGroups.forEach(group => {
        const row = [
            group.date,
            group.eventTitle,
            group.location,
            group.session,
            group.eventNote,
            group.workerNames.length.toString(),
            group.workerNames.join('; '), // Dùng ; để tránh conflict với ,
            group.eventAmount.toString(),
            group.surcharge.toString(),
            group.amount.toString()
        ];
        csvRows.push(row);
    });

    // Chuyển thành CSV string
    const csvContent = csvRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    // Thêm BOM để Excel hiển thị đúng tiếng Việt
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Download CSV
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    let fileName = '';
    if (month === 0) {
        fileName = year === 0 ? 'Bao_Cao_Tat_Ca' : `Bao_Cao_Nam_${year}`;
    } else {
        fileName = `Bao_Cao_Thang_${month}_${year}`;
    }

    if (onlyDebt) fileName += '_Cong_No';
    fileName += '.csv';

    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
