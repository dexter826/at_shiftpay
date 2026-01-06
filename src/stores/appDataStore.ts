import { create } from 'zustand';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS, Location } from '../types';
import { dbService } from '../services';

interface AppDataState {
    // Data
    employees: Employee[];
    locations: Location[];
    events: Event[];
    shifts: Shift[];
    settings: UserSettings;

    // UI State
    isLoading: boolean;
    viewDate: Date;
    activeTab: 'dashboard' | 'calendar' | 'employees' | 'payroll' | 'settings' | 'locations';

    // Computed
    totalDebt: number;

    // Actions
    setEmployees: (employees: Employee[]) => void;
    setLocations: (locations: Location[]) => void;
    setEvents: (events: Event[]) => void;
    setShifts: (shifts: Shift[]) => void;
    setSettings: (settings: UserSettings) => void;
    setIsLoading: (loading: boolean) => void;
    setViewDate: (date: Date) => void;
    setActiveTab: (tab: AppDataState['activeTab']) => void;

    // Subscriptions
    _subscriptions: Map<string, () => void>;
    _dataCache: Map<string, { events: Event[], shifts: Shift[] }>;
    _unpaidShifts: Shift[];
    _extraEvents: Event[];

    initSubscriptions: (userId: string) => void;
    cleanupSubscriptions: () => void;
    refreshData: () => void;
}

export const useAppDataStore = create<AppDataState>((set, get) => ({
    // Initial data
    employees: [],
    locations: [],
    events: [],
    shifts: [],
    settings: DEFAULT_SETTINGS,

    // UI State
    isLoading: true,
    viewDate: new Date(),
    activeTab: (localStorage.getItem('activeTab') as AppDataState['activeTab']) || 'dashboard',

    // Computed
    totalDebt: 0,

    // Actions
    setEmployees: (employees) => set({ employees }),
    setLocations: (locations) => set({ locations }),
    setEvents: (events) => set({ events }),
    setShifts: (shifts) => {
        const totalDebt = shifts
            .filter(s => s.status === 'unpaid')
            .reduce((sum, s) => sum + s.amount, 0);
        set({ shifts, totalDebt });
    },
    setSettings: (settings) => set({ settings }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setViewDate: (viewDate) => set({ viewDate }),
    setActiveTab: (activeTab) => {
        localStorage.setItem('activeTab', activeTab);
        set({ activeTab });
    },

    // Internal state for subscriptions
    _subscriptions: new Map(),
    _dataCache: new Map(),
    _unpaidShifts: [],
    _extraEvents: [],

    refreshData: () => {
        const state = get();
        state.cleanupSubscriptions();
        set({ isLoading: true });
        // Re-init will be triggered by viewDate change effect
    },

    initSubscriptions: (userId) => {
        if (!userId) {
            set({ isLoading: false });
            return;
        }

        const state = get();
        const { viewDate, _subscriptions, _dataCache } = state;

        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const targetKey = `${month}-${year}`;
        const hasCache = _dataCache.has(targetKey);

        if (!hasCache) {
            set({ isLoading: true });
        }

        // Helper to update global state from cache
        const updateGlobalState = () => {
            const currentState = get();
            const allEvents = new Map<string, Event>();
            currentState._dataCache.forEach(cache => cache.events.forEach(e => allEvents.set(e.id, e)));
            currentState._extraEvents.forEach(e => allEvents.set(e.id, e));

            const allShifts = new Map<string, Shift>();
            currentState._dataCache.forEach(cache => cache.shifts.forEach(s => allShifts.set(s.id, s)));
            currentState._unpaidShifts.forEach(s => allShifts.set(s.id, s));

            const shiftsArray = Array.from(allShifts.values());
            const totalDebt = shiftsArray
                .filter(s => s.status === 'unpaid')
                .reduce((sum, s) => sum + s.amount, 0);

            set({
                events: Array.from(allEvents.values()),
                shifts: shiftsArray,
                totalDebt
            });
        };

        // Months to subscribe
        const needed = [
            { m: month, y: year },
            { m: month === 0 ? 11 : month - 1, y: month === 0 ? year - 1 : year },
            { m: month === 11 ? 0 : month + 1, y: month === 11 ? year + 1 : year },
            { m: currentMonth, y: currentYear }
        ];

        const neededKeys = new Set(needed.map(t => `${t.m}-${t.y}`));

        // Cleanup old subscriptions
        _subscriptions.forEach((unsub, key) => {
            if (key === 'app-data') return;
            const [m, y] = key.split('-').map(Number);
            const dist = Math.abs((y * 12 + m) - (year * 12 + month));
            if (dist > 2 && !neededKeys.has(key)) {
                unsub();
                _subscriptions.delete(key);
                if (dist > 5) _dataCache.delete(key);
            }
        });

        let loadedCount = 0;
        const checkLoaded = () => {
            loadedCount++;
            if (_dataCache.has(targetKey) || loadedCount >= 6) {
                set({ isLoading: false });
            }
        };

        // Subscribe to months
        needed.forEach(({ m, y }) => {
            const key = `${m}-${y}`;
            if (!_subscriptions.has(key)) {
                const unsubEvt = dbService.subscribeEventsByMonth(m, y, (data) => {
                    const current = _dataCache.get(key) || { events: [], shifts: [] };
                    _dataCache.set(key, { ...current, events: data });
                    updateGlobalState();
                    if (key === targetKey) checkLoaded();
                });

                const unsubShf = dbService.subscribeShiftsByMonth(m, y, (data) => {
                    const current = _dataCache.get(key) || { events: [], shifts: [] };
                    _dataCache.set(key, { ...current, shifts: data });
                    updateGlobalState();
                    if (key === targetKey) checkLoaded();
                });

                _subscriptions.set(key, () => {
                    unsubEvt();
                    unsubShf();
                });
            }
        });

        // App-wide subscriptions
        if (!_subscriptions.has('app-data')) {
            const unsubEmp = dbService.subscribeEmployees((data) => {
                set({ employees: data });
                checkLoaded();
            });

            const unsubLoc = dbService.subscribeLocations((data) => {
                set({ locations: data });
                checkLoaded();
            });

            const unsubSet = dbService.subscribeSettings((data) => {
                if (data) set({ settings: data });
                checkLoaded();
            });

            const unsubUnp = dbService.subscribeUnpaidShifts(async (data) => {
                const currentState = get();
                currentState._unpaidShifts = data;

                const eventIds = Array.from(new Set(data.filter(s => s.eventId).map(s => s.eventId)));
                const existingIds = new Set(
                    Array.from(currentState._dataCache.values())
                        .flatMap(c => c.events.map(e => e.id))
                );
                const missing = eventIds.filter(id => id && !existingIds.has(id));

                if (missing.length > 0) {
                    try {
                        currentState._extraEvents = await dbService.getEventsByIds(missing);
                    } catch (e) {
                        console.error(e);
                    }
                }
                updateGlobalState();
                checkLoaded();
            });

            _subscriptions.set('app-data', () => {
                unsubEmp();
                unsubLoc();
                unsubSet();
                unsubUnp();
            });
        }

        updateGlobalState();
    },

    cleanupSubscriptions: () => {
        const { _subscriptions, _dataCache } = get();
        _subscriptions.forEach(unsub => unsub());
        _subscriptions.clear();
        _dataCache.clear();
        set({ _unpaidShifts: [], _extraEvents: [] });
    }
}));
