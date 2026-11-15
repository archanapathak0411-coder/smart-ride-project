export type SearchBody = {
  pickup_place_id: string;
  drop_place_id: string;
  ride_date: string;
  ride_time: string;
  women_only: boolean;
  max_cost: number | null;
};

export type RootStack = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Find: undefined;
  Offer: undefined;
  Match: { search: SearchBody };
  MyRides: undefined;
  Admin: undefined;
};
