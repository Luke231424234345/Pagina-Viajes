export interface User {
  id: string;
  email: string;
  name?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language?: string;
  currency?: string;
  country?: string;
  travelStyle?: string; // e.g., "solo", "couple", "friends", "family"
  interests?: string[]; // e.g., "popular", "nature", "history", "museums", "food", "shopping"
  preferredPace?: "relaxed" | "medium" | "intense";
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate?: Date;
  endDate?: Date;
  numberOfDays?: number;
  budget?: number;
  style?: string;
  status: "draft" | "planned" | "ongoing" | "completed";
  collaborators?: string[]; // user ids
}

export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  image?: string;
  description?: string;
  openingHours?: string;
  suggestedDuration?: string; // e.g., "2 hours"
  category: "restaurant" | "cafe" | "attraction" | "hotel" | "other";
  sourceUrl?: string; // TikTok/Instagram/Google Maps link
}

export interface TripDay {
  id: string;
  tripId: string;
  dayNumber: number;
  activities: DayPlace[];
}

export interface DayPlace {
  id: string;
  placeId: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  isLocked: boolean;
  order: number;
  estimatedTravelTimeFromPrevious?: string; // e.g., "15 mins"
}

export interface SavedList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  placeIds: string[];
}