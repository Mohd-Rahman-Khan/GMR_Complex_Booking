import { Booking } from '../types/booking';
import { SportAdminUser, SportsComplex } from '../types/admin';

/**
 * Client-side demo selector. Always repeat this authorization on the backend in production.
 */
export type ScopedBooking = Booking & { complexId: string };\n\nexport const getBookingsForComplexAdmin = (bookings: ScopedBooking[], complex: SportsComplex) =>\n  bookings.filter(booking => booking.complexId === complex.id);

export const getBookingsForSportAdmin = (
  bookings: ScopedBooking[],
  admin: SportAdminUser,
  complex: SportsComplex,
) => {
  const allowedSportIds = new Set(
    complex.sports
      .filter(s => s.primarySubAdminId === admin.id)
      .map(s => s.sportId),
  );

  if (admin.role !== 'sport_admin' || admin.complexId !== complex.id) return [];
  return bookings.filter(
    booking => allowedSportIds.has(booking.sportId) &&
      complex.sports.some(s => s.sportId === booking.sportId),
  );
};
