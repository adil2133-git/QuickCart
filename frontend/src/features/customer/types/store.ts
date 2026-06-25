// src/features/customer/types/store.ts

export interface OperatingHour {
    day: string;
    openTime?: string;
    closeTime?: string;
    isClosed?: boolean;
}

export interface StoreProfileSummary {
    _id: string;
    storeName: string;
    address: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    operatingHours: OperatingHour[];
    status: "OPEN" | "CLOSED" | "BUSY";
    averageRating: number;
    reviewCount: number;
    totalOrders: number;
    distanceKm: number | null;
}