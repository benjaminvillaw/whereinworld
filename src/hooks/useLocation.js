import { useState, useEffect, useCallback } from 'react';

// Reverse geocode coordinates to city name using OpenStreetMap Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'User-Agent': 'WhereInWorld/1.0' } }
    );
    const data = await response.json();

    const city = data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.address?.county ||
      'Unknown';
    const country = data.address?.country || 'Unknown';

    return { city, country, displayName: data.display_name };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { city: 'Unknown', country: 'Unknown', displayName: '' };
  }
}

// Fuzz coordinates to ~5km radius for privacy
function fuzzCoordinates(lat, lng) {
  // ~5km is roughly 0.045 degrees at equator
  const fuzzFactor = 0.045;
  const latOffset = (Math.random() - 0.5) * fuzzFactor;
  const lngOffset = (Math.random() - 0.5) * fuzzFactor;

  return {
    lat: Math.round((lat + latOffset) * 100) / 100, // Round to 2 decimal places
    lng: Math.round((lng + lngOffset) * 100) / 100
  };
}

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt');

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state);
        result.onchange = () => setPermission(result.state);
      });
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Don't need high accuracy for city-level
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      const fuzzed = fuzzCoordinates(latitude, longitude);
      const geocoded = await reverseGeocode(fuzzed.lat, fuzzed.lng);

      const locationData = {
        lat: fuzzed.lat,
        lng: fuzzed.lng,
        city: geocoded.city,
        country: geocoded.country,
        updatedAt: new Date().toISOString()
      };

      setLocation(locationData);
      setPermission('granted');

      // Store in localStorage as cache
      localStorage.setItem('whereinworld_location', JSON.stringify(locationData));

      return locationData;
    } catch (err) {
      const errorMessage =
        err.code === 1 ? 'Location permission denied' :
          err.code === 2 ? 'Location unavailable' :
            err.code === 3 ? 'Location request timed out' :
              'Failed to get location';

      setError(errorMessage);
      if (err.code === 1) setPermission('denied');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cached location on mount
  useEffect(() => {
    const cached = localStorage.getItem('whereinworld_location');
    if (cached) {
      try {
        setLocation(JSON.parse(cached));
      } catch {
        localStorage.removeItem('whereinworld_location');
      }
    }
  }, []);

  return {
    location,
    loading,
    error,
    permission,
    requestLocation
  };
}
