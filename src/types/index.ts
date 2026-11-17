import { GroundSlot } from './booking';

export interface Sport {
  id: string;
  name: string;
  icon: string;
  image: string;
  description: string;
}

export interface GroundSport {
  id: string; // Unique id for this sport setup inside the venue
  sportId: string;
  sportName: string;
  icon: string;
  image: string;
  price: number;
  slots: GroundSlot[];
}

export interface Ground {
  id: string;
  name: string;
  image: string;
  images: string[];
  location: string;
  rating: number;
  reviews: number;
  openingTime: string;
  closingTime: string;
  amenities: string[];
  description: string;
  sports: GroundSport[];

  // Backward compatibility for older Home/Explore components.
  // New booking logic must always use `sports` and selected sportId.
  sportId: string;
  sportName: string;
  slots: GroundSlot[];
  price: number;
  priceUnit: string;
  status: 'active' | 'inactive';
}
