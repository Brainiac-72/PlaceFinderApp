import { DUMMY_PROPERTIES } from '../data/dummyProperties';

export interface Property {
  id: string;
  title: string;
  type: 'Residential' | 'Commercial' | 'Office' | 'Shop' | 'Event';
  price: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSize?: number;
  description?: string;
  status: 'Available' | 'Taken' | 'Negotiations' | string; // Expanded for DB constraints
  currency: string;
  imageUrl: string;
  owner_id?: string;
  amenities?: string[];
  viewCount?: number;
  shareCount?: number;
  owner_phone?: string;
}

export const mapSupabaseProperty = (p: any): Property => ({
  id: p.id,
  title: p.title || 'Untitled Space',
  type: p.type || 'Residential',
  price: p.price || 0,
  location: p.location || 'Unknown Location',
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  areaSize: p.area_size,
  description: p.description,
  status: p.status || 'Available',
  currency: 'GHS',
  imageUrl: p.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80',
  owner_id: p.owner_id,
  amenities: p.amenities || [],
  viewCount: p.view_count || 0,
  shareCount: p.share_count || 0,
  owner_phone: p.profiles?.phone_number || (Array.isArray(p.profiles) ? p.profiles[0]?.phone_number : null)
});

export const combineWithDummyData = (supabaseProperties: Property[]) => {
  return [...supabaseProperties, ...DUMMY_PROPERTIES];
};
