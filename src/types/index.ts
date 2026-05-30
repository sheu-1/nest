export type PropertyType = 'Apartment' | 'House' | 'Studio' | 'Villa' | 'Bedsitter';
export type UserRole = 'tenant' | 'landlord';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  rating?: number;
  idNumber?: string;
  createdAt?: string;
}

export interface Landlord {

  id: string;
  name: string;
  avatar: string;
  rating: number;
}

export interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  type: PropertyType;
  category?: string;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  images: string[];
  emoji: string;
  isVerified: boolean;
  isSaved: boolean;
  amenities: string[];
  landlord: Landlord;
  postedAt: string;
  status: 'Available' | 'Taken';
  available: boolean;
  landlordId?: string; // user.id of the landlord who posted it
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export type RootTabParamList = {
  Browse: undefined;
  Saved: undefined;
  Settings: undefined;
};

