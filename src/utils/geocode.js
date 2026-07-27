// ======================================================
// GEOCODE UTILITIES
// HydroHub Admin
// OpenStreetMap (Nominatim)
// ======================================================

// Cache to avoid repeated API requests
const addressCache = new Map();

/**
 * Convert latitude & longitude into a readable address.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {Promise<string>}
 */
export async function reverseGeocode(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return "No location";
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return "Invalid location";
  }

  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;

  // Return cached address if available
  if (addressCache.has(key)) {
    return addressCache.get(key);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Reverse geocoding failed.");
    }

    const data = await response.json();

    const address =
      data.display_name ||
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    addressCache.set(key, address);

    return address;
  } catch (error) {
    console.error("Reverse Geocode Error:", error);

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Convert an address into coordinates.
 *
 * @param {string} address
 * @returns {Promise<{latitude:number,longitude:number}|null>}
 */
export async function geocodeAddress(address) {
  if (!address) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        address
      )}`
    );

    if (!response.ok) {
      throw new Error("Geocoding failed.");
    }

    const results = await response.json();

    if (!results.length) return null;

    return {
      latitude: Number(results[0].lat),
      longitude: Number(results[0].lon),
    };
  } catch (error) {
    console.error("Geocode Error:", error);

    return null;
  }
}

/**
 * Open coordinates in OpenStreetMap.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 */
export function openInMap(latitude, longitude) {
  if (
    latitude === null ||
    longitude === null
  ) {
    return;
  }

  window.open(
    `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`,
    "_blank"
  );
}

/**
 * Calculate the distance between two coordinates.
 *
 * Returns kilometers.
 */
export function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return Number((R * c).toFixed(2));
}

/**
 * Clear cached addresses.
 */
export function clearGeocodeCache() {
  addressCache.clear();
}