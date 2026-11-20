import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: { phone?: string } | undefined;
  Signup: undefined;
  AdminRegister: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore:
    | {
        sportId?: string;
        sportName?: string;
      }
    | undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;

  GroundListing: {
    sportId?: string;
    sportName?: string;
  };

  GroundDetails: {
    groundId: string;
  };

  SlotBooking: {
    groundId: string;
    sportId: string;
  };

  BookingSummary: {
    groundId: string;
    sportId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    startMinutes: number;
    endMinutes: number;
    durationMinutes: number;
    price: number;
  };
};
