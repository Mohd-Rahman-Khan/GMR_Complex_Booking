import { Ground, GroundSport } from '../types';
import { GroundSlot } from '../types/booking';

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${suffix}`;
};

const makeSlots = (
  venueId: string,
  sportId: string,
  data: [number, number, number][],
): GroundSlot[] =>
  data.map(([start, end, price], index) => ({
    id: `${venueId}-${sportId}-S${index + 1}`,
    startTime: formatTime(start),
    endTime: formatTime(end),
    startMinutes: start,
    endMinutes: end,
    price,
  }));

type SportTemplate = {
  sportId: string;
  sportName: string;
  icon: string;
  image: string;
  price: number;
  slotData: [number, number, number][];
};

const sportTemplates: SportTemplate[] = [
  {
    sportId: '1', sportName: 'Football', icon: '⚽',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
    price: 2400, slotData: [[480, 600, 1800], [600, 720, 2000], [900, 1020, 2400], [1020, 1140, 2600]],
  },
  {
    sportId: '2', sportName: 'Cricket', icon: '🏏',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
    price: 1800, slotData: [[360, 480, 1800], [720, 840, 2000], [900, 1020, 2200], [1080, 1200, 2500]],
  },
  {
    sportId: '3', sportName: 'Badminton', icon: '🏸',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    price: 500, slotData: [[360, 420, 400], [420, 480, 450], [900, 960, 500], [960, 1020, 550]],
  },
  {
    sportId: '4', sportName: 'Basketball', icon: '🏀',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    price: 1200, slotData: [[480, 600, 1000], [600, 720, 1200], [900, 1020, 1400], [1020, 1140, 1500]],
  },
  {
    sportId: '5', sportName: 'Table Tennis', icon: '🏓',
    image: 'https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800',
    price: 300, slotData: [[360, 420, 250], [420, 480, 300], [900, 960, 350], [960, 1020, 400]],
  },
  {
    sportId: '6', sportName: 'Volleyball', icon: '🏐',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800',
    price: 1000, slotData: [[420, 540, 900], [780, 900, 1100], [1020, 1140, 1300]],
  },
];

const createVenueSports = (venueId: string, multiplier = 1): GroundSport[] =>
  sportTemplates.map(sport => ({
    id: `${venueId}-SPORT-${sport.sportId}`,
    sportId: sport.sportId,
    sportName: sport.sportName,
    icon: sport.icon,
    image: sport.image,
    price: sport.price * multiplier,
    slots: makeSlots(
      venueId,
      sport.sportId,
      sport.slotData.map(([start, end, price]) => [start, end, Math.round(price * multiplier)]),
    ),
  }));

export const grounds: Ground[] = [
  {
    id: 'G001',
    name: 'Sports Arena – Sector 62',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200'],
    location: 'Sector 62, Noida',
    rating: 4.8,
    reviews: 120,
    openingTime: '06:00 AM',
    closingTime: '11:00 PM',
    amenities: ['Parking', 'Changing Room', 'Floodlights', 'Washroom', 'Drinking Water'],
    description: 'A multi-sport venue with dedicated playing areas for different sports.',
    sports: createVenueSports('G001'),
    sportId: '1',
    sportName: 'Football',
    slots: makeSlots('G001', '1', sportTemplates[0].slotData),
    price: sportTemplates[0].price,
    priceUnit: 'per session',
    status: 'active',
  },
  {
    id: 'G002',
    name: 'PlayZone Multi-Sports Club',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800',
    images: [],
    location: 'Sector 63, Noida',
    rating: 4.6,
    reviews: 90,
    openingTime: '06:00 AM',
    closingTime: '10:00 PM',
    amenities: ['Parking', 'Changing Room', 'Cafe'],
    description: 'Indoor and outdoor sports facilities for friends, families and teams.',
    sports: createVenueSports('G002', 1.05),
    sportId: '1',
    sportName: 'Football',
    slots: makeSlots('G002', '1', sportTemplates[0].slotData),
    price: sportTemplates[0].price * 1.05,
    priceUnit: 'per session',
    status: 'active',
  },
  {
    id: 'G003',
    name: 'Elite Sports Complex',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    images: [],
    location: 'Sector 50, Noida',
    rating: 4.7,
    reviews: 85,
    openingTime: '06:00 AM',
    closingTime: '10:00 PM',
    amenities: ['Parking', 'Washroom', 'Floodlights', 'Seating Area'],
    description: 'Premium sports complex with multiple dedicated courts and turfs.',
    sports: createVenueSports('G003', 1.1),
    sportId: '1',
    sportName: 'Football',
    slots: makeSlots('G003', '1', sportTemplates[0].slotData),
    price: sportTemplates[0].price * 1.1,
    priceUnit: 'per session',
    status: 'active',
  },
  {
    id: 'G004',
    name: 'City Sports Hub',
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    images: [],
    location: 'Sector 18, Noida',
    rating: 4.5,
    reviews: 70,
    openingTime: '07:00 AM',
    closingTime: '11:00 PM',
    amenities: ['Parking', 'Seating Area', 'Drinking Water'],
    description: 'A convenient multi-sport venue for casual games and regular practice.',
    sports: createVenueSports('G004', 0.95),
    sportId: '1',
    sportName: 'Football',
    slots: makeSlots('G004', '1', sportTemplates[0].slotData),
    price: sportTemplates[0].price * 0.95,
    priceUnit: 'per session',
    status: 'active',
  },
];

export const getGroundSport = (ground: Ground, sportId: string) =>
  ground.sports.find(sport => sport.sportId === sportId);
