export type BookingStatus = 'confirmed' | 'cancelled';

export interface GroundSlot {
  id: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  price: number;
}

export interface GeneratedSlot extends GroundSlot {
  status: 'available' | 'booked' | 'unavailable';
}

export interface Booking {
  id: string;
  bookingNumber: string;
  groundId: string;
  groundName: string;
  sportId: string;
  sportName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  duration: number;
  /** Total payable including GST, after coupon discount. */
  amount: number;
  /** Original admin-configured duration price before discount and GST. */
  basePrice?: number;
  couponCode?: string;
  discountAmount?: number;
  gstAmount?: number;
  status: BookingStatus;
  createdAt: string;
}
