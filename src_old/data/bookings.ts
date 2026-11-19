import { Booking } from '../types/booking';

const getTomorrow = () => {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const tomorrow = getTomorrow();

export const initialBookings: Booking[] = [
  {
    id: 'B001',
    bookingNumber: 'SB1001',
    groundId: 'G001',
    groundName: 'Football Turf 1',
    sportId: '1',
    sportName: 'Football',
    bookingDate: tomorrow,
    startTime: '06:00',
    endTime: '07:00',
    startMinutes: 360,
    endMinutes: 420,
    duration: 60,
    amount: 800,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'B002',
    bookingNumber: 'SB1002',
    groundId: 'G001',
    groundName: 'Football Turf 1',
    sportId: '1',
    sportName: 'Football',
    bookingDate: tomorrow,
    startTime: '18:00',
    endTime: '19:00',
    startMinutes: 1080,
    endMinutes: 1140,
    duration: 60,
    amount: 800,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'B003',
    bookingNumber: 'SB1003',
    groundId: 'G003',
    groundName: 'Cricket Turf 1',
    sportId: '2',
    sportName: 'Cricket',
    bookingDate: tomorrow,
    startTime: '18:00',
    endTime: '19:00',
    startMinutes: 1080,
    endMinutes: 1140,
    duration: 60,
    amount: 1000,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];
