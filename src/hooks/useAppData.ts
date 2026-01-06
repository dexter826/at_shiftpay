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

        // Chỉ hiện loading cho lần đầu hoặc khi refresh thủ công
        const isInitialLoad = events.length === 0 && shifts.length === 0;
        if (isInitialLoad || refreshKey > 0) {
            setIsLoading(true);
        }

        let loadedCount = 0;
        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount >= 6) setIsLoading(false);
        };

        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Danh sách các tháng cần tải: tháng đang xem, tháng trước, tháng sau
        const targetMonths = [
            { m: month, y: year },
            { m: month === 0 ? 11 : month - 1, y: month === 0 ? year - 1 : year },
            { m: month === 11 ? 0 : month + 1, y: month === 11 ? year + 1 : year }
        ];

        // Luôn đảm bảo có tháng hiện tại (cho Dashboard)
        if (!targetMonths.some(t => t.m === currentMonth && t.y === currentYear)) {
            targetMonths.push({ m: currentMonth, y: currentYear });
        }

        const eventsMapByMonth = new Map<string, Event[]>();
        const shiftsMapByMonth = new Map<string, Shift[]>();
        let extraEvents: Event[] = [];
        let unpaidShifts: Shift[] = [];

        const updateData = () => {
            const allEvents = new Map<string, Event>();
            eventsMapByMonth.forEach(monthEvents => {
                monthEvents.forEach(e => allEvents.set(e.id, e));
            });
            extraEvents.forEach(e => allEvents.set(e.id, e));
            setEvents(Array.from(allEvents.values()));

            const allShifts = new Map<string, Shift>();
            shiftsMapByMonth.forEach(monthShifts => {
                monthShifts.forEach(s => allShifts.set(s.id, s));
            });
            unpaidShifts.forEach(s => allShifts.set(s.id, s));
            setShifts(Array.from(allShifts.values()));
        };

        const unsubs: any[] = [];

        // Đăng ký cho tất cả các tháng mục tiêu
        targetMonths.forEach(({ m, y }) => {
            const key = `${m}-${y}`;

            unsubs.push(dbService.subscribeEventsByMonth(m, y, (data) => {
                eventsMapByMonth.set(key, data);
                updateData();
                checkLoaded();
            }));

            unsubs.push(dbService.subscribeShiftsByMonth(m, y, (data) => {
                shiftsMapByMonth.set(key, data);
                updateData();
                checkLoaded();
            }));
        });

        // Chỉ cần 1 subscription cho unpaid
        unsubs.push(dbService.subscribeUnpaidShifts(async (data) => {
            unpaidShifts = data;

            const eventIds = Array.from(new Set(data.map(s => s.eventId)));
            const existingEventIds = new Set(Array.from(eventsMapByMonth.values()).flat().map(e => e.id));
            const missingEventIds = eventIds.filter(id => id && !existingEventIds.has(id));

            if (missingEventIds.length > 0) {
                try {
                    extraEvents = await dbService.getEventsByIds(missingEventIds);
                } catch (error) {
                    console.error("Error fetching extra events:", error);
                }
            }

            updateData();
            checkLoaded();
        }));

        const unsubEmp = dbService.subscribeEmployees((data) => {
            setEmployees(data);
            checkLoaded();
        });
        unsubs.push(unsubEmp);

        const unsubLoc = dbService.subscribeLocations((data) => {
            setLocations(data);
            checkLoaded();
        });
        unsubs.push(unsubLoc);

        const unsubSettings = dbService.subscribeSettings((data) => {
            if (data) setSettings(data);
            checkLoaded();
        });
        unsubs.push(unsubSettings);

        return () => {
            unsubs.forEach(unsub => {
                if (typeof unsub === 'function') unsub();
            });
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

