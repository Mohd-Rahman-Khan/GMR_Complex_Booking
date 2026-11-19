export type AdminRole =
  | 'player'
  | 'super_admin'
  | 'complex_admin'
  | 'sport_admin';

export type SportId =
  | 'football'
  | 'cricket'
  | 'badminton'
  | 'basketball'
  | 'table-tennis'
  | 'volleyball';

export interface PeakHour {
  id: string;
  startTime: string; // 24-hour format: 17:00
  endTime: string; // 24-hour format: 21:00
}

export interface SportPricing {
  weekdayNormalRate: number;
  weekdayPeakRate: number;
  weekendNormalRate: number;
  weekendPeakRate: number;
  peakHours: PeakHour[];
  weekendDays: number[]; // Sunday = 0, Saturday = 6
}

export interface SportSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
}

export interface ComplexSport {
  id: string;
  sportId: SportId;
  sportName: string;
  icon: string;
  pricePerHour: number;
  pricing: SportPricing;
  primarySubAdminId: string | null;
  additionalStaffIds: string[];
  isActive: boolean;
  slots: SportSlot[];
}

export interface SportsComplex {
  id: string;
  groundId?: string;
  name: string;
  ownerName: string;
  adminId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  description: string;
  isActive: boolean;
  sports: ComplexSport[];
  createdAt: string;
}

export interface SportAdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'sport_admin' | 'complex_admin';
  complexId: string;
  assignedSportIds: string[];
  isActive: boolean;
}

export interface AdminStore {
  complexes: SportsComplex[];
  admins: SportAdminUser[];
}
