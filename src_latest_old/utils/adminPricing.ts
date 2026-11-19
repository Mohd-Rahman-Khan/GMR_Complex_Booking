import { Ground, GroundSport } from '../types';
import { ComplexSport, SportPricing, SportsComplex, SportId } from '../types/admin';

const ADMIN_TO_GROUND_SPORT: Record<SportId, string> = {
  football: '1',
  cricket: '2',
  badminton: '3',
  basketball: '4',
  'table-tennis': '5',
  volleyball: '6',
};

export const getAdminComplexForGround = (
  complexes: SportsComplex[],
  groundId: string,
) => complexes.find(complex => complex.groundId === groundId);

export const getSportPricing = (
  ground: Ground,
  sport: GroundSport,
  complexes: SportsComplex[],
): SportPricing => {
  const complex = getAdminComplexForGround(complexes, ground.id);
  const adminSport = complex?.sports.find(
    item => ADMIN_TO_GROUND_SPORT[item.sportId] === sport.sportId,
  );

  if (adminSport?.pricing) return adminSport.pricing;

  // Static fallback for venues that are not linked to an admin complex.
  const twoHours = Math.max(1, Math.round(sport.price * 2));
  return {
    twoHours,
    fourHours: Math.round(twoHours * 1.75),
    fullDay: Math.round(twoHours * 5),
  };
};

export const getPriceForDuration = (
  pricing: SportPricing,
  durationMinutes: number,
): number => {
  if (durationMinutes === 120) return pricing.twoHours;
  if (durationMinutes === 240) return pricing.fourHours;
  return pricing.fullDay;
};
