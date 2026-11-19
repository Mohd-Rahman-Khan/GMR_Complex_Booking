import { Booking } from '../types/booking';

export type AvailableStartTime = {
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
};

type GenerateParams = {
  openingTime: string;
  closingTime: string;
  durationMinutes: number;
  bookings: Booking[];
  selectedDate: string;
  groundId: string;
  sportId: string;
};

export const timeToMinutes = (time: string): number => {
  const value = time.trim().toUpperCase();

  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);

  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3];

  if (minutes > 59 || hours > 24) {
    throw new Error(`Invalid time: ${time}`);
  }

  if (period) {
    if (hours < 1 || hours > 12) {
      throw new Error(`Invalid time: ${time}`);
    }

    if (period === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  }

  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )} ${suffix}`;
};

export const generateAvailableStartTimes = ({
  openingTime,
  closingTime,
  durationMinutes,
  bookings,
  selectedDate,
  groundId,
  sportId,
}: GenerateParams): AvailableStartTime[] => {
  const openingMinutes = timeToMinutes(openingTime);
  const closingMinutes = timeToMinutes(closingTime);

  if (durationMinutes <= 0 || durationMinutes % 30 !== 0) {
    return [];
  }

  const availableTimes: AvailableStartTime[] = [];

  // Fixed 60-minute start-time interval.
  const interval = 60;

  for (
    let start = openingMinutes;
    start + durationMinutes <= closingMinutes;
    start += interval
  ) {
    const end = start + durationMinutes;

    const conflict = bookings.some(booking => {
      if (booking.status !== 'confirmed') {
        return false;
      }

      if (
        booking.groundId !== groundId ||
        booking.sportId !== sportId ||
        booking.bookingDate !== selectedDate
      ) {
        return false;
      }

      return start < booking.endMinutes && end > booking.startMinutes;
    });

    if (!conflict) {
      availableTimes.push({
        startMinutes: start,
        endMinutes: end,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      });
    }
  }

  return availableTimes;
};
