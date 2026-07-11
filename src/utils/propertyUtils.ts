import { DUMMY_PROPERTIES } from '../data/dummyProperties';

/**
 * Represents the core data structure of a real estate property.
 * Maps to the database schema for properties.
 */

export interface Property {
  id: string;
  title: string;
  type: 'Residential' | 'Commercial' | 'Office' | 'Shop' | 'Event';
  price: number;
  pricePeriod?: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSize?: number;
  description?: string;
  status: 'Available' | 'Taken' | 'Negotiations' | string; // Expanded for DB constraints
  currency: string;
  imageUrl: string;
  landlord_id?: string;
  amenities?: string[];
  viewCount?: number;
  shareCount?: number;
  landlord_phone?: string;
}

/**
 * Transforms a raw Supabase database property record into the structured `Property` interface.
 * Handles fallbacks for missing data and type casting.
 * 
 * @param p - The raw database record fetched from Supabase.
 * @returns A strictly typed `Property` object.
 */
export const mapSupabaseProperty = (p: any): Property => ({
  id: p.id,
  title: p.title || 'Untitled Space',
  type: p.type || 'Residential',
  price: Number(p.price) || 0,
  pricePeriod: p.price_period || 'month',
  location: p.location || 'Unknown Location',
  bedrooms: p.bedrooms ? Number(p.bedrooms) : undefined,
  bathrooms: p.bathrooms ? Number(p.bathrooms) : undefined,
  areaSize: p.area_size ? Number(p.area_size) : undefined,
  description: p.description,
  status: p.status || 'Available',
  currency: 'GHS',
  imageUrl: p.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80',
  landlord_id: p.landlord_id,
  amenities: p.amenities || [],
  viewCount: p.view_count || 0,
  shareCount: p.share_count || 0,
  landlord_phone: p.profiles?.phone_number || (Array.isArray(p.profiles) ? p.profiles[0]?.phone_number : null)
});

/**
 * Merges real properties fetched from the database with hardcoded dummy properties.
 * Useful for ensuring the UI always has content during development or when the DB is empty.
 * 
 * @param supabaseProperties - Array of active properties from the database.
 * @returns Combined array of real and dummy properties.
 */
export const combineWithDummyData = (supabaseProperties: Property[]) => {
  return [...supabaseProperties, ...DUMMY_PROPERTIES];
};

/**
 * Formats the price period for display
 */
export const formatPricePeriod = (period?: string) => {
  if (period === 'year' || period === 'yearly') return '/ yr';
  if (period === 'full' || period === 'full price') return '';
  return '/ mo';
};
