import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Booking } from '../types/booking';
import { initialBookings } from '../data/bookings';
import { getBookings, saveBookings } from '../utils/bookingStorage';

interface BookingContextType {
  bookings: Booking[];
  loading: boolean;
  createBooking: (booking: Booking) => Promise<boolean>;
  cancelBooking: (id: string) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const bookingsRef = useRef<Booking[]>([]);
  const operationRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await getBookings();
        const initial = saved ?? initialBookings;

        bookingsRef.current = initial;
        setBookings(initial);

        if (saved === null) {
          await saveBookings(initial);
        }
      } catch (error) {
        console.warn('Booking loading failed:', error);
        bookingsRef.current = initialBookings;
        setBookings(initialBookings);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const createBooking = async (booking: Booking): Promise<boolean> => {
    if (loading || operationRef.current) {
      return false;
    }

    operationRef.current = true;

    try {
      // A slot conflict applies only to the same venue AND the same sport.
      // For example, Football and Cricket can be booked at the same time
      // when they are separate facilities within one venue.
      const conflict = bookingsRef.current.some(
        item =>
          item.groundId === booking.groundId &&
          item.sportId === booking.sportId &&
          item.bookingDate === booking.bookingDate &&
          item.status === 'confirmed' &&
          booking.startMinutes < item.endMinutes &&
          booking.endMinutes > item.startMinutes,
      );

      if (conflict) {
        return false;
      }

      const updated = [booking, ...bookingsRef.current];

      await saveBookings(updated);

      bookingsRef.current = updated;
      setBookings(updated);

      return true;
    } catch (error) {
      console.warn('Booking creation failed:', error);
      return false;
    } finally {
      operationRef.current = false;
    }
  };

  const cancelBooking = async (id: string): Promise<void> => {
    if (operationRef.current) {
      return;
    }

    operationRef.current = true;

    try {
      const updated = bookingsRef.current.map(item =>
        item.id === id ? { ...item, status: 'cancelled' as const } : item,
      );

      await saveBookings(updated);

      bookingsRef.current = updated;
      setBookings(updated);
    } catch (error) {
      console.warn('Booking cancellation failed:', error);
      throw error;
    } finally {
      operationRef.current = false;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        loading,
        createBooking,
        cancelBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingContext);

  if (!context) {
    throw new Error('useBookings must be used inside BookingProvider');
  }

  return context;
};
