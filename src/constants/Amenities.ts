/**
 * A central registry of all available amenities that can be associated with a property.
 * Each amenity has a unique ID, a user-facing label, and an associated icon name.
 */
export const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: 'wifi-outline' },
  { id: 'parking', label: 'Parking', icon: 'car-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'water', label: 'Water', icon: 'water-outline' },
  { id: 'power', label: 'Backup Power', icon: 'flash-outline' },
  { id: 'ac', label: 'Air-con', icon: 'snow-outline' },
  { id: 'gym', label: 'Gym', icon: 'fitness-outline' },
  { id: 'pool', label: 'Pool', icon: 'sunny-outline' },
  { id: 'furnished', label: 'Furnished', icon: 'bed-outline' },
] as const;

/**
 * Type representing all possible amenity IDs extracted dynamically from the AMENITIES array.
 */
export type AmenityId = typeof AMENITIES[number]['id'];

/**
 * Utility function to find a full amenity object based on its string ID.
 * @param id - The ID of the amenity (e.g., 'wifi', 'gym')
 * @returns The matching amenity object, or undefined if not found.
 */
export const getAmenityById = (id: string) => AMENITIES.find(a => a.id === id);
