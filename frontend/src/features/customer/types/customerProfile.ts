// types/customer.ts

export interface SavedAddress {
  _id: string;
  label?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface CustomerProfile {
  _id: string;
  userId: string;
  savedAddresses: SavedAddress[];
  defaultAddress: string | null;
  totalOrders: number;
  codAllowed: boolean;
  createdAt: string;
}

// Comes from the auth store / login response — not from CustomerProfile
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface AddAddressPayload {
  label?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}