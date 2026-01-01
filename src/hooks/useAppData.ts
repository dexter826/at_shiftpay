import { useState, useEffect, useMemo } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { dbService } from '../services';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS, Location } from '../types';

export function useAppData() {
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Khởi tạo state
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Theo dõi đăng nhập
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Tải data khi có user
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        let loadedCount = 0;

        // Kiểm tra tiến độ tải
        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount >= 6) setIsLoading(false);
        };

        const unsubEmp = dbService.subscribeEmployees((data) => {
            setEmployees(data);
            checkLoaded();
        });

        const unsubLoc = dbService.subscribeLocations((data) => {
            setLocations(data);
            checkLoaded();
        });

        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let viewEvents: Event[] = [];
        let dashboardEvents: Event[] = [];
        let extraEvents: Event[] = [];
        let viewShifts: Shift[] = [];
        let dashboardShifts: Shift[] = [];
        let unpaidShifts: Shift[] = [];

        const updateData = () => {
            // Gộp events: tháng đang xem + tháng hiện tại + các event lẻ từ ca chưa thanh toán
            const eventMap = new Map();
            [...viewEvents, ...dashboardEvents, ...extraEvents].forEach(e => eventMap.set(e.id, e));
            setEvents(Array.from(eventMap.values()));

            // Gộp shifts: tháng đang xem + tháng hiện tại + tất cả unpaid
            const shiftMap = new Map();
            [...viewShifts, ...dashboardShifts, ...unpaidShifts].forEach(s => shiftMap.set(s.id, s));
            setShifts(Array.from(shiftMap.values()));
        };

        const unsubEvents = dbService.subscribeEventsByMonth(month, year, (data) => {
            viewEvents = data;
            updateData();
            checkLoaded();
        });

        const unsubShifts = dbService.subscribeShiftsByMonth(month, year, (data) => {
            viewShifts = data;
            updateData();
            checkLoaded();
        });

        const unsubUnpaid = dbService.subscribeUnpaidShifts(async (data) => {
            unpaidShifts = data;
            
            // Tải thêm các event bị thiếu cho các ca chưa thanh toán (khác tháng)
            const eventIds = Array.from(new Set(data.map(s => s.eventId)));
            const existingEventIds = new Set([...viewEvents, ...dashboardEvents].map(e => e.id));
            const missingEventIds = eventIds.filter(id => id && !existingEventIds.has(id));
            
            if (missingEventIds.length > 0) {
                try {
                    const fetchedExtra = await dbService.getEventsByIds(missingEventIds);
                    extraEvents = fetchedExtra;
                } catch (error) {
                    console.error("Error fetching extra events:", error);
                }
            }
            
            updateData();
            checkLoaded();
        });

        // Nếu tháng đang xem khác tháng hiện tại, sub thêm tháng hiện tại cho Dashboard
        let unsubDashEvents: any = null;
        let unsubDashShifts: any = null;

        if (month !== currentMonth || year !== currentYear) {
            unsubDashEvents = dbService.subscribeEventsByMonth(currentMonth, currentYear, (data) => {
                dashboardEvents = data;
                updateData();
            });
            unsubDashShifts = dbService.subscribeShiftsByMonth(currentMonth, currentYear, (data) => {
                dashboardShifts = data;
                updateData();
            });
        }

        const unsubSettings = dbService.subscribeSettings((data) => {
            if (data) setSettings(data);
            checkLoaded();
        });

        // Cleanup: unsubscribe tất cả listeners
        return () => {
            if (unsubEmp) unsubEmp();
            if (unsubLoc) unsubLoc();
            if (unsubEvents) unsubEvents();
            if (unsubShifts) unsubShifts();
            if (unsubUnpaid) unsubUnpaid();
            if (unsubSettings) unsubSettings();
            if (unsubDashEvents) unsubDashEvents();
            if (unsubDashShifts) unsubDashShifts();
        };
    }, [user, viewDate, refreshKey]);

    // Tính tổng nợ
    const totalDebt = useMemo(() =>
        shifts
            .filter(s => s.status === 'unpaid')
            .reduce((sum, s) => sum + s.amount, 0),
        [shifts]
    );

    return {
        user,
        authLoading,
        employees,
        locations,
        events,
        shifts,
        settings,
        isLoading,
        viewDate,
        setViewDate,
        totalDebt,
        refreshData
    };
}

