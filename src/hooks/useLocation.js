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

// Get approximate location from IP address (no permission needed)
// This provides city-level accuracy without needing browser location permission
async function getLocationFromIP() {
  try {
    // Using ipapi.co - free tier allows 1000 requests/day
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'User-Agent': 'WhereInWorld/1.0' }
    });

    if (!response.ok) {
      throw new Error('IP geolocation failed');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.reason || 'IP geolocation error');
    }

    return {
      lat: Math.round(data.latitude * 100) / 100, // Already city-level precision
      lng: Math.round(data.longitude * 100) / 100,
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown',
      isApproximate: true, // Flag to indicate this is IP-based (less precise)
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    return null;
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
  const [ipLocationAttempted, setIpLocationAttempted] = useState(false);

  // Check permission status on mount and keep it updated
  const checkPermissionStatus = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(result.state);
        result.onchange = () => setPermission(result.state);
        return result.state;
      } catch {
        // Safari and some browsers don't support permissions API for geolocation
        // This is fine - we'll still try to get location when requested
        return 'prompt';
      }
    }
    return 'prompt';
  }, []);

  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Get IP-based location as initial fallback (runs once on mount)
  useEffect(() => {
    const initIPLocation = async () => {
      // Only attempt IP location if we don't have any location yet
      const cached = localStorage.getItem('whereinworld_location');
      if (cached) {
        try {
          setLocation(JSON.parse(cached));
          return;
        } catch {
          localStorage.removeItem('whereinworld_location');
        }
      }

      // Get IP-based location as a starting point
      // This gives users something immediately while they decide on browser permission
      if (!ipLocationAttempted) {
        setIpLocationAttempted(true);
        const ipLocation = await getLocationFromIP();
        if (ipLocation) {
          setLocation(ipLocation);
          // Store IP-based location with a flag so we know to upgrade later
          localStorage.setItem('whereinworld_location', JSON.stringify(ipLocation));
        }
      }
    };

    initIPLocation();
  }, [ipLocationAttempted]); // Removed location from deps to prevent loop

  const requestLocation = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      // Fall back to IP location
      const ipLocation = await getLocationFromIP();
      if (ipLocation) {
        setLocation(ipLocation);
        localStorage.setItem('whereinworld_location', JSON.stringify(ipLocation));
        return ipLocation;
      }
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // This call will trigger the browser's native permission popup if permission is 'prompt'
      // The popup appears when getCurrentPosition is called, not before
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false, // Don't need high accuracy for city-level
            timeout: 15000, // Increased timeout to allow user to respond to popup
            maximumAge: 300000 // Cache for 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const fuzzed = fuzzCoordinates(latitude, longitude);
      const geocoded = await reverseGeocode(fuzzed.lat, fuzzed.lng);

      const locationData = {
        lat: fuzzed.lat,
        lng: fuzzed.lng,
        city: geocoded.city,
        country: geocoded.country,
        isApproximate: false, // This is browser-based (more precise)
        updatedAt: new Date().toISOString()
      };

      setLocation(locationData);
      setPermission('granted');
      setError(null);

      // Store in localStorage as cache
      localStorage.setItem('whereinworld_location', JSON.stringify(locationData));

      return locationData;
    } catch (err) {
      // Re-check permission status after error to get accurate state
      await checkPermissionStatus();

      const errorMessage =
        err.code === 1 ? 'Location permission denied' :
          err.code === 2 ? 'Location unavailable' :
            err.code === 3 ? 'Location request timed out' :
              'Failed to get location';

      setError(errorMessage);
      if (err.code === 1) setPermission('denied');

      // If browser location failed, try IP-based location as fallback
      if (!location || location.isApproximate) {
        const ipLocation = await getLocationFromIP();
        if (ipLocation) {
          setLocation(ipLocation);
          localStorage.setItem('whereinworld_location', JSON.stringify(ipLocation));
          // Clear the error since we have a fallback
          setError(null);
          return ipLocation;
        }
      }

      return location || null; // Return existing location if we have one
    } finally {
      setLoading(false);
    }
  }, [checkPermissionStatus, location]);

  return {
    location,
    loading,
    error,
    permission,
    requestLocation,
    checkPermissionStatus,
    isApproximate: location?.isApproximate || false
  };
}

