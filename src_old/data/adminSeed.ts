import {
  AdminStore,
  SportsComplex,
  SportAdminUser,
  SportId,
} from '../types/admin';

export const AVAILABLE_SPORTS: { id: SportId; name: string; icon: string }[] = [
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
];

const sport = (
  id: string,
  sportId: SportId,
  sportName: string,
  icon: string,
  pricePerHour: number,
  primarySubAdminId: string,
) => ({
  id,
  sportId,
  sportName,
  icon,
  pricePerHour,
  primarySubAdminId,
  additionalStaffIds: [] as string[],
  isActive: true,
  slots: [],
});

const demoComplexes: SportsComplex[] = [
  {
    id: 'CMP001',
    name: 'SportArena',
    ownerName: 'Rahman Khan',
    adminId: 'CADM001',
    phone: '9876500000',
    email: 'rahman@complex1.demo',
    address: 'Sector 15, Rohini',
    city: 'Delhi',
    description: 'Multi-sport sports complex.',
    isActive: true,
    createdAt: new Date().toISOString(),
    sports: [
      sport('C1S1', 'cricket', 'Cricket', '🏏', 2000, 'C1ADM001'),
      sport('C1S2', 'football', 'Football', '⚽', 1500, 'C1ADM002'),
      sport('C1S3', 'badminton', 'Badminton', '🏸', 500, 'C1ADM003'),
    ],
  },
  {
    id: 'CMP002',
    name: 'Complex 2',
    ownerName: 'Vijay Kumar',
    adminId: 'CADM002',
    phone: '9876500002',
    email: 'vijay@complex2.demo',
    address: 'Dwarka Sector 10',
    city: 'Delhi',
    description: 'Indoor and outdoor sports facility.',
    isActive: true,
    createdAt: new Date().toISOString(),
    sports: [
      sport('C2S1', 'cricket', 'Cricket', '🏏', 1800, 'C2ADM001'),
      sport('C2S2', 'table-tennis', 'Table Tennis', '🏓', 400, 'C2ADM002'),
    ],
  },
];

const demoAdmins: SportAdminUser[] = [
  {
    id: 'CADM001',
    name: 'Rahman Khan',
    email: 'rahman@complex1.demo',
    phone: '9876500000',
    password: '123456',
    role: 'complex_admin',
    complexId: 'CMP001',
    assignedSportIds: [],
    isActive: true,
  },
  {
    id: 'CADM002',
    name: 'Vijay Kumar',
    email: 'vijay@complex2.demo',
    phone: '9876500002',
    password: '123456',
    role: 'complex_admin',
    complexId: 'CMP002',
    assignedSportIds: [],
    isActive: true,
  },

  {
    id: 'C1ADM001',
    name: 'User-1',
    email: 'user1.cricket.c1@demo.com',
    phone: '9876510001',
    password: '123456',
    role: 'sport_admin',
    complexId: 'CMP001',
    assignedSportIds: ['cricket'],
    isActive: true,
  },
  {
    id: 'C1ADM002',
    name: 'User-2',
    email: 'user2.football.c1@demo.com',
    phone: '9876510002',
    password: '123456',
    role: 'sport_admin',
    complexId: 'CMP001',
    assignedSportIds: ['football'],
    isActive: true,
  },
  {
    id: 'C1ADM003',
    name: 'User-3',
    email: 'user3.badminton.c1@demo.com',
    phone: '9876510003',
    password: '123456',
    role: 'sport_admin',
    complexId: 'CMP001',
    assignedSportIds: ['badminton'],
    isActive: true,
  },

  {
    id: 'C2ADM001',
    name: 'User-1',
    email: 'user1.cricket.c2@demo.com',
    phone: '9876520001',
    password: '123456',
    role: 'sport_admin',
    complexId: 'CMP002',
    assignedSportIds: ['cricket'],
    isActive: true,
  },
  {
    id: 'C2ADM002',
    name: 'User-2',
    email: 'user2.tt.c2@demo.com',
    phone: '9876520002',
    password: '123456',
    role: 'sport_admin',
    complexId: 'CMP002',
    assignedSportIds: ['table-tennis'],
    isActive: true,
  },
];

export const ADMIN_SEED: AdminStore = {
  complexes: demoComplexes,
  admins: demoAdmins,
};
