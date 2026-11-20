import { Ground, GroundSport } from '../types';
import {
  ComplexSport,
  PeakHour,
  SportPricing,
  SportsComplex,
  SportId,
} from '../types/admin';

const ADMIN_TO_GROUND_SPORT: Record<SportId, string> = {
  football: '1',
  cricket: '2',
  badminton: '3',
  basketball: '4',
  'table-tennis': '5',
  volleyball: '6',
};

export interface PricingBreakdownItem {
  key: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  hourlyRate: number;
  amount: number;
  isPeak: boolean;
  isWeekend: boolean;
}

export interface PricingCalculation {
  total: number;
  breakdown: PricingBreakdownItem[];
}

export const getAdminComplexForGround = (
  complexes: SportsComplex[],
  groundId: string,
) => complexes.find(complex => complex.groundId === groundId);

const fallbackPricing = (hourlyRate: number): SportPricing => {
  const rate = Math.max(1, Number(hourlyRate) || 1);
  return {
    weekdayNormalRate: rate,
    weekdayPeakRate: Math.round(rate * 1.5),
    weekendNormalRate: Math.round(rate * 1.25),
    weekendPeakRate: Math.round(rate * 1.75),
    peakHours: [{ id: 'DEFAULT_PEAK', startTime: '17:00', endTime: '21:00' }],
    weekendDays: [0, 6],
  };
};

export const getSportPricing = (
  ground: Ground,
  sport: GroundSport,
  complexes: SportsComplex[],
): SportPricing => {
  const complex = getAdminComplexForGround(complexes, ground.id);
  //const complex = getAdminComplexForGround(complexes, ground.id);
  const adminSport = complex?.sports.find(
    item => ADMIN_TO_GROUND_SPORT[item.sportId] === sport.sportId,
  );

  if (adminSport?.pricing) return adminSport.pricing;
  return fallbackPricing(sport.price);
};

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const getDateDay = (date: string): number => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
};

const isMinutePeak = (minuteOfDay: number, peakHours: PeakHour[]) =>
  peakHours.some(peak => {
    const start = toMinutes(peak.startTime);
    const end = toMinutes(peak.endTime);
    return minuteOfDay >= start && minuteOfDay < end;
  });

const rateLabel = (isWeekend: boolean, isPeak: boolean) => {
  if (isWeekend && isPeak) return 'Weekend Peak';
  if (isWeekend) return 'Weekend Normal';
  if (isPeak) return 'Weekday Peak';
  return 'Weekday Normal';
};

/**
 * Splits a booking into weekday/weekend and normal/peak periods.
 * Prices are prorated by minute, so a booking crossing a peak boundary
 * receives the correct rate for each part.
 */
export const calculateDynamicPrice = (
  pricing: SportPricing,
  bookingDate: string,
  startMinutes: number,
  durationMinutes: number,
): PricingCalculation => {
  if (
    !pricing ||
    !Number.isFinite(startMinutes) ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return { total: 0, breakdown: [] };
  }

  const weekendDays = Array.isArray(pricing.weekendDays)
    ? pricing.weekendDays
    : [0, 6];
  const peakHours = Array.isArray(pricing.peakHours) ? pricing.peakHours : [];
  const isWeekend = weekendDays.includes(getDateDay(bookingDate));

  const groups: PricingBreakdownItem[] = [];

  for (
    let minute = startMinutes;
    minute < startMinutes + durationMinutes;
    minute += 1
  ) {
    const minuteOfDay = minute % 1440;
    const isPeak = isMinutePeak(minuteOfDay, peakHours);

    const hourlyRate = isWeekend
      ? isPeak
        ? pricing.weekendPeakRate
        : pricing.weekendNormalRate
      : isPeak
      ? pricing.weekdayPeakRate
      : pricing.weekdayNormalRate;

    const label = rateLabel(isWeekend, isPeak);
    const last = groups[groups.length - 1];

    if (last && last.label === label && last.hourlyRate === hourlyRate) {
      last.endMinutes = minute + 1;
      last.durationMinutes += 1;
      last.amount = roundMoney((last.durationMinutes / 60) * hourlyRate);
    } else {
      groups.push({
        key: `${label}-${minute}`,
        label,
        startMinutes: minute,
        endMinutes: minute + 1,
        durationMinutes: 1,
        hourlyRate,
        amount: roundMoney(hourlyRate / 60),
        isPeak,
        isWeekend,
      });
    }
  }

  const breakdown = groups.map(item => ({
    ...item,
    amount: roundMoney((item.durationMinutes / 60) * item.hourlyRate),
  }));

  return {
    total: roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0)),
    breakdown,
  };
};
