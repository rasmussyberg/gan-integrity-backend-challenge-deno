const earthRadiusKm = 6371;
const earthRadiusMiles = 3959;

/**
 * Calculate distance between two coordinates used the Haversine formula
 */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function calculateDistance(
  coor1: Coordinates,
  coor2: Coordinates,
  unit: 'km' | 'miles' = 'km'
): number {
  const earthRadius = unit === 'km' ? earthRadiusKm : earthRadiusMiles;
  const { latitude: lat1, longitude: lon1 } = coor1;
  const { latitude: lat2, longitude: lon2 } = coor2;

  const dLat = (lat2 - lat1) * (Math.PI / 180); 
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c; // Distance in units (km or miles)
  return distance;
}

export function calculateBoundingBox(
  center: Coordinates,
  radius: number,
  unit: 'km' | 'miles' = 'km'
) {
  const earthRadius = unit === 'km' ? earthRadiusKm : earthRadiusMiles;
  const latRadian = (center.latitude * Math.PI) / 180; // Convert latitude to radians
  //const lonRadian = (center.longitude * Math.PI) / 180; // Convert longitude to radians

  // Calculate the differences in latitude and longitude for the bounding box
  const latDiff = (radius / earthRadius) * (180 / Math.PI);
  const lonDiff =
    (radius / (earthRadius * Math.cos(latRadian))) *
    (180 / Math.PI);

  // Calculate the coordinates of the bounding box
  const minLat = center.latitude - latDiff;
  const maxLat = center.latitude + latDiff;
  const minLon = center.longitude - lonDiff;
  const maxLon = center.longitude + lonDiff;

  return {
    from: { latitude: minLat, longitude: minLon },
    to: { latitude: maxLat, longitude: maxLon },
  };
}
