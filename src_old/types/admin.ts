export type AdminRole = 'player' | 'super_admin' | 'complex_admin' | 'sport_admin';
export type SportId = 'football' | 'cricket' | 'badminton' | 'basketball' | 'table-tennis' | 'volleyball';

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
  /** Exactly one primary subadmin is allowed for this sport in this complex. */
  primarySubAdminId: string | null;
  /** Reserved for a future staff feature; not assignable in this version. */
  additionalStaffIds: string[];
  isActive: boolean;
  slots: SportSlot[];
}

export interface SportsComplex {
  id: string;
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
  password: string; // Demo only; production must use secure backend authentication.
  role: 'sport_admin' | 'complex_admin';
  complexId: string;
  /** One sport per subadmin assignment in this demo. */
  assignedSportIds: string[];
  isActive: boolean;
}

export interface AdminStore {
  complexes: SportsComplex[];
  admins: SportAdminUser[];
}
