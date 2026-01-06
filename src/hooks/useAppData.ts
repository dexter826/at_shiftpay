import { useState, useEffect, useMemo, useRef } from 'react';
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

    // Refs cho Cache và Subscriptions
    const subsRef = useRef<Map<string, () => void>>(new Map());
    const dataCacheRef = useRef<Map<string, { events: Event[], shifts: Shift[] }>>(new Map());
    const employeesRef = useRef<Employee[]>([]);
    const locationsRef = useRef<Location[]>([]);
    const settingsRef = useRef<UserSettings>(DEFAULT_SETTINGS);
    const unpaidShiftsRef = useRef<Shift[]>([]);
    const extraEventsRef = useRef<Event[]>([]);

    const updateGlobalState = () => {
        const allEvents = new Map<string, Event>();
        dataCacheRef.current.forEach(cache => cache.events.forEach(e => allEvents.set(e.id, e)));
        extraEventsRef.current.forEach(e => allEvents.set(e.id, e));
        setEvents(Array.from(allEvents.values()));

        const allShifts = new Map<string, Shift>();
        dataCacheRef.current.forEach(cache => cache.shifts.forEach(s => allShifts.set(s.id, s)));
        unpaidShiftsRef.current.forEach(s => allShifts.set(s.id, s));
        setShifts(Array.from(allShifts.values()));
    };

    // Tải data chính
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const targetKey = `${month}-${year}`;
        const hasCache = dataCacheRef.current.has(targetKey);

        // Chỉ hiện loading nếu chưa có cache hoặc load lần đầu
        if (!hasCache || refreshKey > 0) {
            setIsLoading(true);
        }

        // Dải 3 tháng lân cận + tháng dashboard
        const needed = [
            { m: month, y: year },
            { m: month === 0 ? 11 : month - 1, y: month === 0 ? year - 1 : year },
            { m: month === 11 ? 0 : month + 1, y: month === 11 ? year + 1 : year },
            { m: currentMonth, y: currentYear }
        ];

        const neededKeys = new Set(needed.map(t => `${t.m}-${t.y}`));

        // Cleanup các subs quá xa (giữ trong vòng 2 tháng so với viewDate để tiết kiệm)
        subsRef.current.forEach((unsub, key) => {
            const [m, y] = key.split('-').map(Number);
            const dist = Math.abs((y * 12 + m) - (year * 12 + month));
            if (dist > 2 && !neededKeys.has(key)) {
                unsub();
                subsRef.current.delete(key);
                // Giữ data cache lâu hơn 1 chút để lỡ quay lại ngay
                if (dist > 5) dataCacheRef.current.delete(key);
            }
        });

        let loadedCount = 0;
        const totalToLoad = needed.filter(t => !subsRef.current.has(`${t.m}-${t.y}`)).length * 2 + 4; // *2 (events+shifts) + emps + locs + settings + unpaid

        const checkLoaded = () => {
            loadedCount++;
            // Nếu đã có cache cho tháng hiện tại, ta không cần đợi full v1
            if (dataCacheRef.current.has(targetKey) && refreshKey === 0) {
                setIsLoading(false);
            } else if (loadedCount >= 6) {
                setIsLoading(false);
            }
        };

        // Đăng ký cho các tháng thiếu
        needed.forEach(({ m, y }) => {
            const key = `${m}-${y}`;
            if (!subsRef.current.has(key)) {
                const unsubEvt = dbService.subscribeEventsByMonth(m, y, (data) => {
                    const current = dataCacheRef.current.get(key) || { events: [], shifts: [] };
                    dataCacheRef.current.set(key, { ...current, events: data });
                    updateGlobalState();
                    if (key === targetKey) checkLoaded();
                });
                const unsubShf = dbService.subscribeShiftsByMonth(m, y, (data) => {
                    const current = dataCacheRef.current.get(key) || { events: [], shifts: [] };
                    dataCacheRef.current.set(key, { ...current, shifts: data });
                    updateGlobalState();
                    if (key === targetKey) checkLoaded();
                });

                // Wrap unsubs
                subsRef.current.set(key, () => {
                    unsubEvt();
                    unsubShf();
                });
            } else {
                // Đã có sub, coi như đã "load" 2 phần tín hiệu nếu có dữ liệu
                if (dataCacheRef.current.has(key)) {
                    loadedCount += 2;
                }
            }
        });

        // App-wide data (luôn subscribe 1 lần, dựa vào user)
        if (!subsRef.current.has('app-data')) {
            const unsubEmp = dbService.subscribeEmployees((data) => {
                setEmployees(data);
                employeesRef.current = data;
                checkLoaded();
            });
            const unsubLoc = dbService.subscribeLocations((data) => {
                setLocations(data);
                locationsRef.current = data;
                checkLoaded();
            });
            const unsubSet = dbService.subscribeSettings((data) => {
                if (data) {
                    setSettings(data);
                    settingsRef.current = data;
                }
                checkLoaded();
            });
            const unsubUnp = dbService.subscribeUnpaidShifts(async (data) => {
                unpaidShiftsRef.current = data;
                const eventIds = Array.from(new Set(data.filter(s => s.eventId).map(s => s.eventId)));
                const existingIds = new Set(
                    Array.from(dataCacheRef.current.values() as IterableIterator<{ events: Event[], shifts: Shift[] }>)
                        .flatMap(c => c.events.map(e => e.id))
                );
                const missing = eventIds.filter(id => id && !existingIds.has(id));
                if (missing.length > 0) {
                    try {
                        extraEventsRef.current = await dbService.getEventsByIds(missing);
                    } catch (e) {
                        console.error(e);
                    }
                }
                updateGlobalState();
                checkLoaded();
            });

            subsRef.current.set('app-data', () => {
                unsubEmp();
                unsubLoc();
                unsubSet();
                unsubUnp();
            });
        }

        // Sync state ban đầu nếu đã có ref
        if (employeesRef.current.length > 0) setEmployees(employeesRef.current);
        if (locationsRef.current.length > 0) setLocations(locationsRef.current);
        if (settingsRef.current !== DEFAULT_SETTINGS) setSettings(settingsRef.current);
        updateGlobalState();

        // Không cleanup subs ở đây vì ta muốn persistent
    }, [user, viewDate, refreshKey]);

    // Lần cuối cùng khi component unmount hoàn toàn
    useEffect(() => {
        return () => {
            subsRef.current.forEach(unsub => unsub());
            subsRef.current.clear();
        };
    }, []);

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

