import AsyncStorage from '@react-native-async-storage/async-storage';

import { Booking } from '../types/booking';

const STORAGE_KEY = '@sports_arena_bookings';

export const saveBookings = async (bookings: Booking[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const getBookings = async (): Promise<Booking[] | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);

    if (!data) {
      return null;
    }

    const parsed: unknown = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed as Booking[];
  } catch {
    return null;
  }
};
