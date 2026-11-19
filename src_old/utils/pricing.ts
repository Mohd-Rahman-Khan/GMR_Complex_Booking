import { Ground } from '../types';

export const getSlotPrice = (ground: Ground, duration: number): number => {
  const hourlyPrice = ground.price;

  const total = (hourlyPrice / 60) * duration;

  return Math.round(total);
};
