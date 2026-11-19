import { Ground } from '../types';
import { Booking, GeneratedSlot } from '../types/booking';

const getLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const generateSlots = (
  ground: Ground,
  sportId: string,
  selectedDate: string,
  bookings: Booking[],
): GeneratedSlot[] => {
  const now = new Date();
  const today = getLocalDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const selectedSport = ground?.sports?.find(sport => sport.sportId === sportId);
  if (!selectedSport || !Array.isArray(selectedSport.slots)) return [];

  return selectedSport.slots.map(slot => {
    // A booking blocks only the same venue + same sport + overlapping time.
    const isBooked = (Array.isArray(bookings) ? bookings : []).some(booking =>
      booking.groundId === ground.id &&
      booking.sportId === sportId &&
      booking.bookingDate === selectedDate &&
      booking.status === 'confirmed' &&
      slot.startMinutes < booking.endMinutes &&
      slot.endMinutes > booking.startMinutes
    );

    const isPast =
      selectedDate < today ||
      (selectedDate === today && slot.startMinutes <= currentMinutes);

    return {
      ...slot,
      status: isBooked ? 'booked' : isPast ? 'unavailable' : 'available',
    };
  });
};
