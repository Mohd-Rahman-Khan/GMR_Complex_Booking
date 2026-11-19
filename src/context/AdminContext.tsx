import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AdminStore,
  ComplexSport,
  SportAdminUser,
  SportsComplex,
  SportPricing,
} from '../types/admin';
import { ADMIN_SEED, DEFAULT_SPORT_PRICING } from '../data/adminSeed';

const STORAGE_KEY = '@sportsarena_admin_store_v2';

type AdminContextValue = AdminStore & {
  loading: boolean;
  addComplex: (
    item: Omit<SportsComplex, 'id' | 'createdAt' | 'sports' | 'adminId'> & {
      adminId?: string;
    },
  ) => void;
  updateComplex: (id: string, patch: Partial<SportsComplex>) => void;
  toggleComplex: (id: string) => void;
  addSport: (complexId: string, sport: ComplexSport) => void;
  removeSport: (complexId: string, sportId: string) => void;
  updateSport: (
    complexId: string,
    sportId: string,
    patch: Partial<ComplexSport>,
  ) => void;
  saveAdmin: (admin: Omit<SportAdminUser, 'id'> & { id?: string }) => void;
  assignPrimarySubAdmin: (
    complexId: string,
    sportId: string,
    adminId: string | null,
  ) => { success: boolean; message?: string };
  toggleAdmin: (adminId: string) => void;
  resetDemoData: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const normalizePricing = (
  raw: any,
  sportId: keyof typeof DEFAULT_SPORT_PRICING,
  oldPricePerHour?: number,
): SportPricing => {
  const defaults = DEFAULT_SPORT_PRICING[sportId];
  const fallbackRate =
    Number(oldPricePerHour) > 0
      ? Number(oldPricePerHour)
      : Math.round(
          (Number(raw?.twoHours) || defaults.weekdayNormalRate * 2) / 2,
        );

  return {
    weekdayNormalRate:
      Number(raw?.weekdayNormalRate) > 0
        ? Number(raw.weekdayNormalRate)
        : fallbackRate,
    weekdayPeakRate:
      Number(raw?.weekdayPeakRate) > 0
        ? Number(raw.weekdayPeakRate)
        : defaults.weekdayPeakRate,
    weekendNormalRate:
      Number(raw?.weekendNormalRate) > 0
        ? Number(raw.weekendNormalRate)
        : defaults.weekendNormalRate,
    weekendPeakRate:
      Number(raw?.weekendPeakRate) > 0
        ? Number(raw.weekendPeakRate)
        : defaults.weekendPeakRate,
    peakHours: Array.isArray(raw?.peakHours)
      ? raw.peakHours
      : defaults.peakHours.map(x => ({ ...x })),
    weekendDays: Array.isArray(raw?.weekendDays)
      ? raw.weekendDays
      : [...defaults.weekendDays],
  };
};

const normalizeStore = (raw: any): AdminStore => {
  const source: AdminStore = raw?.complexes && raw?.admins ? raw : ADMIN_SEED;

  return {
    ...source,
    complexes: source.complexes.map((complex: any) => ({
      ...complex,
      groundId:
        complex.groundId ||
        (complex.id === 'CMP001'
          ? 'G001'
          : complex.id === 'CMP002'
          ? 'G002'
          : ''),
      adminId:
        complex.adminId ||
        source.admins.find(
          a => a.complexId === complex.id && a.role === 'complex_admin',
        )?.id ||
        '',
      sports: (complex.sports || []).map((item: any) => ({
        ...item,
        pricePerHour:
          Number(item.pricePerHour) ||
          DEFAULT_SPORT_PRICING[
            item.sportId as keyof typeof DEFAULT_SPORT_PRICING
          ]?.weekdayNormalRate ||
          500,
        primarySubAdminId: item.primarySubAdminId ?? item.adminId ?? null,
        pricing: normalizePricing(
          item.pricing,
          item.sportId,
          item.pricePerHour,
        ),
        additionalStaffIds: item.additionalStaffIds || [],
        slots: item.slots || [],
      })),
    })),
  };
};

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [store, setStore] = useState<AdminStore>(ADMIN_SEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (raw) {
          const normalized = normalizeStore(JSON.parse(raw));
          setStore(normalized);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } else {
          setStore(normalizeStore(ADMIN_SEED));
        }
      } catch (e) {
        console.warn('Unable to load admin demo data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store)).catch(e =>
        console.warn('Unable to persist admin demo data', e),
      );
    }
  }, [store, loading]);

  const addComplex = useCallback(
    (
      item: Omit<SportsComplex, 'id' | 'createdAt' | 'sports'> & {
        adminId?: string;
      },
    ) => {
      setStore(prev => ({
        ...prev,
        complexes: [
          {
            ...item,
            adminId: item.adminId || '',
            id: `CMP${Date.now()}`,
            createdAt: new Date().toISOString(),
            sports: [],
          },
          ...prev.complexes,
        ],
      }));
    },
    [],
  );

  const updateComplex = useCallback(
    (id: string, patch: Partial<SportsComplex>) => {
      setStore(prev => ({
        ...prev,
        complexes: prev.complexes.map(c =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      }));
    },
    [],
  );

  const toggleComplex = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      complexes: prev.complexes.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c,
      ),
    }));
  }, []);

  const addSport = useCallback((complexId: string, sport: ComplexSport) => {
    setStore(prev => ({
      ...prev,
      complexes: prev.complexes.map(c =>
        c.id === complexId && !c.sports.some(s => s.sportId === sport.sportId)
          ? {
              ...c,
              sports: [
                ...c.sports,
                {
                  ...sport,
                  pricePerHour:
                    Number(sport.pricePerHour) ||
                    DEFAULT_SPORT_PRICING[sport.sportId].weekdayNormalRate,
                  pricing: normalizePricing(
                    sport.pricing,
                    sport.sportId,
                    sport.pricePerHour,
                  ),
                  primarySubAdminId: null,
                  additionalStaffIds: [],
                  slots: sport.slots || [],
                },
              ],
            }
          : c,
      ),
    }));
  }, []);

  const removeSport = useCallback((complexId: string, sportId: string) => {
    setStore(prev => ({
      ...prev,
      complexes: prev.complexes.map(c =>
        c.id === complexId
          ? { ...c, sports: c.sports.filter(s => s.sportId !== sportId) }
          : c,
      ),
      admins: prev.admins.map(a =>
        a.complexId === complexId
          ? {
              ...a,
              assignedSportIds: a.assignedSportIds.filter(id => id !== sportId),
            }
          : a,
      ),
    }));
  }, []);

  const updateSport = useCallback(
    (complexId: string, sportId: string, patch: Partial<ComplexSport>) => {
      setStore(prev => ({
        ...prev,
        complexes: prev.complexes.map(c =>
          c.id === complexId
            ? {
                ...c,
                sports: c.sports.map(s => {
                  if (s.sportId !== sportId) return s;

                  const updated = { ...s, ...patch };

                  if (patch.pricing) {
                    updated.pricing = {
                      ...s.pricing,
                      ...patch.pricing,
                    };
                    updated.pricePerHour = updated.pricing.weekdayNormalRate;
                  }

                  return updated;
                }),
              }
            : c,
        ),
      }));
    },
    [],
  );

  const saveAdmin = useCallback(
    (admin: Omit<SportAdminUser, 'id'> & { id?: string }) => {
      setStore(prev => {
        const id = admin.id || `ADM${Date.now()}`;
        const nextAdmin: SportAdminUser = { ...admin, id };
        const exists = prev.admins.some(a => a.id === id);

        return {
          ...prev,
          admins: exists
            ? prev.admins.map(a => (a.id === id ? nextAdmin : a))
            : [nextAdmin, ...prev.admins],
        };
      });
    },
    [],
  );

  const assignPrimarySubAdmin = useCallback(
    (complexId: string, sportId: string, adminId: string | null) => {
      const complex = store.complexes.find(c => c.id === complexId);
      const sport = complex?.sports.find(s => s.sportId === sportId);
      const admin = adminId ? store.admins.find(a => a.id === adminId) : null;

      if (!complex || !sport)
        return { success: false, message: 'Complex or sport not found.' };

      if (
        adminId &&
        (!admin ||
          admin.role !== 'sport_admin' ||
          admin.complexId !== complexId ||
          !admin.isActive)
      ) {
        return {
          success: false,
          message: 'Select an active sport subadmin from this complex only.',
        };
      }

      setStore(prev => ({
        ...prev,
        admins: prev.admins.map(a => {
          if (a.complexId !== complexId) return a;

          const assignedSportIds = a.assignedSportIds.filter(
            id => id !== sportId,
          );

          if (a.id === adminId) assignedSportIds.push(sportId);

          return { ...a, assignedSportIds };
        }),
        complexes: prev.complexes.map(c =>
          c.id === complexId
            ? {
                ...c,
                sports: c.sports.map(s =>
                  s.sportId === sportId
                    ? {
                        ...s,
                        primarySubAdminId: adminId,
                        additionalStaffIds: s.additionalStaffIds || [],
                      }
                    : s,
                ),
              }
            : c,
        ),
      }));

      return { success: true };
    },
    [store],
  );

  const toggleAdmin = useCallback((adminId: string) => {
    setStore(prev => ({
      ...prev,
      admins: prev.admins.map(a =>
        a.id === adminId ? { ...a, isActive: !a.isActive } : a,
      ),
    }));
  }, []);

  const resetDemoData = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setStore(normalizeStore(ADMIN_SEED));
  }, []);

  const value = useMemo(
    () => ({
      ...store,
      loading,
      addComplex,
      updateComplex,
      toggleComplex,
      addSport,
      removeSport,
      updateSport,
      saveAdmin,
      assignPrimarySubAdmin,
      toggleAdmin,
      resetDemoData,
    }),
    [
      store,
      loading,
      addComplex,
      updateComplex,
      toggleComplex,
      addSport,
      removeSport,
      updateSport,
      saveAdmin,
      assignPrimarySubAdmin,
      toggleAdmin,
      resetDemoData,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const value = useContext(AdminContext);

  if (!value) throw new Error('useAdmin must be used inside AdminProvider');

  return value;
};
