export interface DiscardSearchPayload {
  material: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface DiscardPoint {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingsTotal: number | null;
  openNow: boolean | null;
}
