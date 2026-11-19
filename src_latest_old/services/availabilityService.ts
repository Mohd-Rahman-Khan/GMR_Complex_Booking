import { Booking, GeneratedSlot } from '../types/booking';

interface GenerateAvailableStartTimesParams {
  openingTime: string;
  closingTime: string;
  durationMinutes: number;
  bookings: Booking[];
  selectedDate: string;
  groundId: string;
  sportId: string;
}

export const timeToMinutes = (time: string): number => {
  const [timePart, modifier] = time.trim().split(/\s+/);
  const [hours, minutes] = timePart.split(':').map(Number);

  let convertedHours = hours;

  if (modifier?.toUpperCase() === 'PM' && hours !== 12) {
    convertedHours += 12;
  }

  if (modifier?.toUpperCase() === 'AM' && hours === 12) {
    convertedHours = 0;
  }

  return convertedHours * 60 + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const modifier = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )} ${modifier}`;
};

export const generateAvailableStartTimes = ({
  openingTime,
  closingTime,
  durationMinutes,
  bookings,
  selectedDate,
  groundId,
  sportId,
}: GenerateAvailableStartTimesParams): GeneratedSlot[] => {
  const openingMinutes = timeToMinutes(openingTime);
  const closingMinutes = timeToMinutes(closingTime);

  if (
    durationMinutes <= 0 ||
    closingMinutes <= openingMinutes ||
    durationMinutes > closingMinutes - openingMinutes
  ) {
    return [];
  }

  const selectedBookings = bookings.filter(
    booking =>
      booking.groundId === groundId &&
      booking.sportId === sportId &&
      booking.bookingDate === selectedDate &&
      booking.status === 'confirmed',
  );

  const availableSlots: GeneratedSlot[] = [];

  for (
    let startMinutes = openingMinutes;
    startMinutes + durationMinutes <= closingMinutes;
    startMinutes += 60
  ) {
    const endMinutes = startMinutes + durationMinutes;

    const hasOverlap = selectedBookings.some(
      booking =>
        startMinutes < booking.endMinutes && endMinutes > booking.startMinutes,
    );

    if (hasOverlap) {
      continue;
    }

    availableSlots.push({
      id: `${groundId}-${sportId}-${selectedDate}-${startMinutes}`,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      startMinutes,
      endMinutes,
      price: 0,
      status: 'available',
    });
  }

  return availableSlots;
};
