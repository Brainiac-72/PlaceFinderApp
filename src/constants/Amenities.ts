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

export type AmenityId = typeof AMENITIES[number]['id'];

export const getAmenityById = (id: string) => AMENITIES.find(a => a.id === id);
