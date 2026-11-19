import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Admin: undefined;
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
  };

  BookingSummary: {
    groundId: string;
    sportId: string;
    bookingDate: string;
    slotId: string;
  };
};
