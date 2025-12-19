import { useState, useEffect, useMemo } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { dbService } from '../services/firebase';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS } from '../types';

export function useAppData() {
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Khởi tạo state
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());

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
            if (loadedCount >= 5) setIsLoading(false);
        };

        const unsubEmp = dbService.subscribeEmployees((data) => {
            setEmployees(data);
            checkLoaded();
        });

        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();

        const unsubEvents = dbService.subscribeEventsByMonth(month, year, (data) => {
            setEvents(data);
            checkLoaded();
        });

        // Gộp ca làm việc
        let currentShifts: Shift[] = [];
        let unpaidShifts: Shift[] = [];

        const updateShifts = () => {
            // Loại bỏ ID trùng
            const map = new Map();
            [...currentShifts, ...unpaidShifts].forEach(s => map.set(s.id, s));
            setShifts(Array.from(map.values()));
        };

        const unsubShifts = dbService.subscribeShiftsByMonth(month, year, (data) => {
            currentShifts = data;
            updateShifts();
            checkLoaded();
        });

        const unsubUnpaid = dbService.subscribeUnpaidShifts((data) => {
            unpaidShifts = data;
            updateShifts();
            checkLoaded();
        });

        const unsubSettings = dbService.subscribeSettings((data) => {
            if (data) setSettings(data);
            checkLoaded();
        });

        return () => {
            unsubEmp();
            unsubEvents();
            unsubShifts();
            unsubUnpaid();
            unsubSettings();
        };
    }, [user, viewDate]);

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
        events,
        shifts,
        settings,
        isLoading,
        viewDate,
        setViewDate,
        totalDebt
    };
}
