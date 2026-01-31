import { useEffect, useRef, useMemo } from 'react';
import { BottomNav } from './BottomNav';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token - Get yours at https://www.mapbox.com/
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Major cities database with coordinates (fallback for missing location data)
const MAJOR_CITIES = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, color: '#FF7F6C' },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, color: '#A0E8AF' },
    { name: 'London', lat: 51.5074, lng: -0.1278, color: '#C4A7E7' },
    { name: 'Paris', lat: 48.8566, lng: 2.3522, color: '#FFEB3B' },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, color: '#FF90B3' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, color: '#CCFF00' },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, color: '#FF7F6C' },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, color: '#A0E8AF' },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, color: '#C4A7E7' },
    { name: 'Boston', lat: 42.3601, lng: -71.0589, color: '#FFEB3B' },
];

// Convert hex color to RGB array
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [204, 255, 0];
}

// Calculate distance between two coordinates using Haversine formula
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find nearest major city
function getNearestCity(lat, lng) {
    let nearest = MAJOR_CITIES[0];
    let minDistance = Infinity;
    MAJOR_CITIES.forEach(city => {
        const dist = getDistance(lat, lng, city.lat, city.lng);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = city;
        }
    });
    return { ...nearest, distance: Math.round(minDistance) };
}

export function MapView({ friends = [], userLocation, user, onSelectCity, onListView, onShowFriends, onSettings, onGoToUserCity, onInvite, onToggleGhostMode, onToggleNotifications, onUpdateLocation, onRequestLocation, ghostMode = false, notificationsMuted = false, centerOnUser = false, onCenterComplete }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const mapLoadedRef = useRef(false);
    const cityMarkersRef = useRef([]); // Track custom avatar markers

    // Group friends by city
    const citiesData = useMemo(() => {
        const cityMap = new Map();

        friends.forEach(friend => {
            const location = friend.location;
            if (!location?.city) return;

            const key = location.city.toLowerCase();
            if (!cityMap.has(key)) {
                cityMap.set(key, {
                    city: location.city,
                    country: location.country,
                    lat: location.lat,
                    lng: location.lng,
                    friends: []
                });
            }
            cityMap.get(key).friends.push(friend);
        });

        // Try to get coordinates for cities from MAJOR_CITIES
        for (const [key, data] of cityMap.entries()) {
            const majorCity = MAJOR_CITIES.find(c =>
                c.name.toLowerCase() === key ||
                data.city.toLowerCase().includes(c.name.toLowerCase())
            );
            if (majorCity && (!data.lat || !data.lng)) {
                data.lat = majorCity.lat;
                data.lng = majorCity.lng;
            }
            data.color = majorCity?.color || '#CCFF00';
        }

        return Array.from(cityMap.values()).filter(c => c.lat && c.lng);
    }, [friends]);

    // Create GeoJSON for cities
    const citiesGeoJson = useMemo(() => ({
        type: 'FeatureCollection',
        features: citiesData.map(city => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [city.lng, city.lat]
            },
            properties: {
                city: city.city,
                country: city.country,
                friendCount: city.friends.length,
                color: city.color,
                colorRgb: hexToRgb(city.color)
            }
        }))
    }), [citiesData]);

    // Calculate user's estimated city (defined first so it can be used in userGeoJson)
    const userEstimatedCity = useMemo(() => {
        if (!userLocation?.lat || !userLocation?.lng) return null;
        const userLat = parseFloat(userLocation.lat);
        const userLng = parseFloat(userLocation.lng);
        if (isNaN(userLat) || isNaN(userLng)) return null;
        const nearestMajor = getNearestCity(userLat, userLng);
        if (nearestMajor.distance <= 30) {
            return nearestMajor.name;
        }
        return userLocation.city || 'Your Location';
    }, [userLocation]);

    // Create GeoJSON for user location
    const userGeoJson = useMemo(() => {
        if (!userLocation?.lat || !userLocation?.lng) return null;
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [userLocation.lng, userLocation.lat]
                },
                properties: {
                    label: 'YOU',
                    city: userEstimatedCity || ''
                }
            }]
        };
    }, [userLocation, userEstimatedCity]);

    // Clear map reference when entering ghost mode so it reinitializes when exiting
    useEffect(() => {
        if (ghostMode && mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            mapLoadedRef.current = false;
        }
    }, [ghostMode]);

    // Initialize map
    useEffect(() => {
        if (ghostMode) return; // Don't init when in ghost mode
        if (!mapContainerRef.current || mapRef.current) return;

        // Check if we have an access token
        if (!mapboxgl.accessToken) {
            console.warn('Mapbox access token not found. Add VITE_MAPBOX_ACCESS_TOKEN to your .env file.');
            return;
        }

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [0, 20],
            zoom: 1.2,
            minZoom: 0.5,
            maxZoom: 6,
            projection: 'globe',
            attributionControl: false,
        });

        mapRef.current = map;

        // Add navigation controls
        map.addControl(
            new mapboxgl.NavigationControl({ showCompass: false }),
            'bottom-right'
        );

        // Add atmosphere and globe effects
        map.on('load', () => {
            mapLoadedRef.current = true;

            map.setFog({
                color: 'rgb(10, 10, 10)',
                'high-color': 'rgb(20, 20, 30)',
                'horizon-blend': 0.1,
                'space-color': 'rgb(5, 5, 5)',
                'star-intensity': 0.15
            });

            // Hide country borders, admin boundaries, and unwanted labels
            const layersToHide = [
                // Country and admin boundaries
                'admin-0-boundary',
                'admin-0-boundary-bg',
                'admin-0-boundary-disputed',
                'admin-1-boundary',
                'admin-1-boundary-bg',
                // Country and continent labels
                'country-label',
                'continent-label',
                // State/region labels
                'state-label',
                // Water labels (oceans, seas)
                'water-point-label',
                'water-line-label',
                'waterway-label',
                // Natural feature labels
                'natural-point-label',
                'natural-line-label',
                // POI labels we don't need
                'poi-label'
            ];

            layersToHide.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'visibility', 'none');
                }
            });

            // Configure city labels to only show at appropriate zoom levels
            if (map.getLayer('settlement-major-label')) {
                map.setLayoutProperty('settlement-major-label', 'visibility', 'visible');
                map.setLayerZoomRange('settlement-major-label', 3, 22);
            }
            if (map.getLayer('settlement-minor-label')) {
                map.setLayoutProperty('settlement-minor-label', 'visibility', 'visible');
                map.setLayerZoomRange('settlement-minor-label', 5, 22);
            }
            if (map.getLayer('settlement-subdivision-label')) {
                map.setLayoutProperty('settlement-subdivision-label', 'visibility', 'none');
            }

            // Add cities source
            map.addSource('cities', {
                type: 'geojson',
                data: citiesGeoJson
            });

            // Note: City markers are now handled by custom DOM markers with avatars
            // (see the avatar markers useEffect)

            // Add user location source if available
            if (userGeoJson) {
                map.addSource('user-location', {
                    type: 'geojson',
                    data: userGeoJson
                });

                // User location outer glow
                map.addLayer({
                    id: 'user-glow',
                    type: 'circle',
                    source: 'user-location',
                    paint: {
                        'circle-radius': 22,
                        'circle-color': '#CCFF00',
                        'circle-opacity': 0.3,
                        'circle-blur': 0.5
                    }
                });

                // User location circle
                map.addLayer({
                    id: 'user-circle',
                    type: 'circle',
                    source: 'user-location',
                    paint: {
                        'circle-radius': 15,
                        'circle-color': '#CCFF00',
                        'circle-stroke-color': '#000000',
                        'circle-stroke-width': 2
                    }
                });

                // User location label with city name
                map.addLayer({
                    id: 'user-label',
                    type: 'symbol',
                    source: 'user-location',
                    layout: {
                        'text-field': [
                            'format',
                            'YOU', { 'font-scale': 1.0 },
                            '\n', {},
                            ['get', 'city'], { 'font-scale': 0.85 }
                        ],
                        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                        'text-size': 10,
                        'text-allow-overlap': true,
                        'text-anchor': 'top',
                        'text-offset': [0, 0.5]
                    },
                    paint: {
                        'text-color': '#000000'
                    }
                });
            }

            // Note: City click/hover is now handled by avatar marker DOM elements
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                mapLoadedRef.current = false;
            }
        };
    }, [ghostMode]);

    // Update cities data when it changes
    useEffect(() => {
        if (!mapRef.current || !mapLoadedRef.current) return;

        const source = mapRef.current.getSource('cities');
        if (source) {
            source.setData(citiesGeoJson);
        }
    }, [citiesGeoJson]);

    // Create and update avatar markers for cities
    useEffect(() => {
        if (!mapRef.current || !mapLoadedRef.current) return;

        // Remove existing markers
        cityMarkersRef.current.forEach(marker => marker.remove());
        cityMarkersRef.current = [];

        // Create new markers for each city
        citiesData.forEach(city => {
            if (!city.lat || !city.lng || city.friends.length === 0) return;

            // Create marker element
            const el = document.createElement('div');
            el.className = 'city-avatar-marker';
            el.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
            `;

            // Create avatar container
            const avatarContainer = document.createElement('div');
            avatarContainer.style.cssText = `
                display: flex;
                align-items: center;
                position: relative;
            `;

            // Show up to 3 avatars, stacked
            const maxAvatars = Math.min(city.friends.length, 3);
            const avatarSize = 36;
            const overlap = 12;

            for (let i = 0; i < maxAvatars; i++) {
                const friend = city.friends[i];
                const avatarWrapper = document.createElement('div');
                avatarWrapper.style.cssText = `
                    width: ${avatarSize}px;
                    height: ${avatarSize}px;
                    border-radius: 50%;
                    border: 3px solid ${city.color || '#CCFF00'};
                    background: #1a1a1a;
                    overflow: hidden;
                    margin-left: ${i > 0 ? -overlap + 'px' : '0'};
                    position: relative;
                    z-index: ${maxAvatars - i};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                `;

                if (friend.avatar_url) {
                    const img = document.createElement('img');
                    img.src = friend.avatar_url;
                    img.style.cssText = `
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    `;
                    img.onerror = () => {
                        // Fallback to initials on error
                        avatarWrapper.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${city.color};font-weight:bold;font-size:14px;">${(friend.display_name || friend.displayName || '?')[0].toUpperCase()}</div>`;
                    };
                    avatarWrapper.appendChild(img);
                } else {
                    // Show initials
                    const initial = (friend.display_name || friend.displayName || '?')[0].toUpperCase();
                    avatarWrapper.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${city.color};font-weight:bold;font-size:14px;">${initial}</div>`;
                }

                avatarContainer.appendChild(avatarWrapper);
            }

            // Add count badge if more than shown
            if (city.friends.length > maxAvatars) {
                const badge = document.createElement('div');
                badge.style.cssText = `
                    position: absolute;
                    right: -8px;
                    top: -8px;
                    background: ${city.color || '#CCFF00'};
                    color: #000;
                    font-size: 11px;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 10px;
                    z-index: 10;
                `;
                badge.textContent = `+${city.friends.length - maxAvatars}`;
                avatarContainer.appendChild(badge);
            }

            el.appendChild(avatarContainer);

            // Create city label
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                margin-top: 4px;
                font-size: 10px;
                font-weight: bold;
                color: white;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                white-space: nowrap;
            `;
            label.textContent = city.city;
            el.appendChild(label);

            // Add click handler
            el.addEventListener('click', () => {
                onSelectCity?.({
                    city: city.city,
                    country: city.country,
                    friends: city.friends
                });
            });

            // Create and add marker
            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([city.lng, city.lat])
                .addTo(mapRef.current);

            cityMarkersRef.current.push(marker);
        });

        // Cleanup function
        return () => {
            cityMarkersRef.current.forEach(marker => marker.remove());
        };
    }, [citiesData, onSelectCity]);

    // Update user location when it changes
    useEffect(() => {
        if (!mapRef.current || !mapLoadedRef.current || !userGeoJson) return;

        const source = mapRef.current.getSource('user-location');
        if (source) {
            source.setData(userGeoJson);
        } else if (mapRef.current.isStyleLoaded()) {
            // Add user location if it wasn't available on initial load
            mapRef.current.addSource('user-location', {
                type: 'geojson',
                data: userGeoJson
            });

            mapRef.current.addLayer({
                id: 'user-glow',
                type: 'circle',
                source: 'user-location',
                paint: {
                    'circle-radius': 22,
                    'circle-color': '#CCFF00',
                    'circle-opacity': 0.3,
                    'circle-blur': 0.5
                }
            });

            mapRef.current.addLayer({
                id: 'user-circle',
                type: 'circle',
                source: 'user-location',
                paint: {
                    'circle-radius': 15,
                    'circle-color': '#CCFF00',
                    'circle-stroke-color': '#000000',
                    'circle-stroke-width': 2
                }
            });

            mapRef.current.addLayer({
                id: 'user-label',
                type: 'symbol',
                source: 'user-location',
                layout: {
                    'text-field': [
                        'format',
                        'YOU', { 'font-scale': 1.0 },
                        '\n', {},
                        ['get', 'city'], { 'font-scale': 0.85 }
                    ],
                    'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                    'text-size': 10,
                    'text-allow-overlap': true,
                    'text-anchor': 'top',
                    'text-offset': [0, 0.5]
                },
                paint: {
                    'text-color': '#000000'
                }
            });
        }
    }, [userGeoJson]);

    // Center on user location when centerOnUser prop changes to true
    useEffect(() => {
        if (centerOnUser && mapRef.current && mapLoadedRef.current && userLocation?.lat && userLocation?.lng) {
            mapRef.current.flyTo({
                center: [parseFloat(userLocation.lng), parseFloat(userLocation.lat)],
                zoom: 5,
                duration: 1500,
                essential: true
            });
            // Call onCenterComplete after animation
            setTimeout(() => {
                onCenterComplete?.();
            }, 1500);
        }
    }, [centerOnUser, userLocation, onCenterComplete]);

    // Fallback UI when no token is available
    const noTokenFallback = !mapboxgl.accessToken && (
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-dark)',
            color: 'var(--text-secondary)',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-lime)' }}>
                map
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>
                Mapbox Token Required
            </h3>
            <p style={{ fontSize: '0.875rem', maxWidth: '20rem', lineHeight: 1.6 }}>
                Add <code style={{ background: 'var(--surface-border)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>VITE_MAPBOX_ACCESS_TOKEN</code> to your .env file to enable the map view.
            </p>
        </div>
    );

    return (
        <div className="map-view-container">
            {/* Header - matches CityList */}
            <header className="header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem', position: 'relative' }}>
                {/* Top row: Avatar + Title + Notification Bell */}
                <div className="flex items-center gap-3">
                    {/* User Avatar - clickable to settings */}
                    <div
                        className="user-avatar-header"
                        onClick={onSettings}
                        style={{
                            width: '2.75rem',
                            height: '2.75rem',
                            borderRadius: '50%',
                            border: '2px solid var(--accent-lime)',
                            overflow: 'hidden',
                            background: 'var(--surface-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent-lime)', fontSize: '1.5rem' }}>person</span>
                        )}
                    </div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontStyle: 'italic',
                        transform: 'skewX(-6deg)',
                        color: 'white',
                        whiteSpace: 'nowrap',
                        flex: 1
                    }}>Where In World?</h1>

                    {/* Notification Bell - Top Right */}
                    <button
                        onClick={onToggleNotifications}
                        style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                        title={notificationsMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                    >
                        <span className="material-symbols-outlined filled animate-bell-jiggle" style={{
                            fontSize: '1.5rem',
                            color: '#ef4444'
                        }}>
                            {notificationsMuted ? 'notifications_off' : 'notifications'}
                        </span>
                    </button>
                </div>

                {/* Bottom row: Centered Add Friend button */}
                <div className="flex items-center justify-center">
                    {onInvite && (
                        <button
                            className="btn-hard"
                            style={{
                                height: '2.5rem',
                                padding: '0 3rem',
                                minWidth: '12rem',
                                background: 'var(--accent-lime)',
                                color: 'black',
                                fontSize: '0.8125rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                borderRadius: '2rem',
                                border: '2px solid black',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={onInvite}
                            title="Invite Friends"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>person_add</span>
                            Add Friends
                        </button>
                    )}
                </div>
            </header>

            {/* Location & Ghost Mode Combined Card */}
            <section className="px-6 mb-6">
                <div className="card-hard" style={{ overflow: 'hidden' }}>
                    {/* Location Banner - Top Section */}
                    <div
                        className="flex items-center justify-between p-4"
                        style={{
                            background: ghostMode ? '#1a1a2e' : (!userLocation && !ghostMode ? 'var(--accent-lime)' : 'white'),
                            cursor: ghostMode ? 'default' : 'pointer'
                        }}
                        onClick={ghostMode ? undefined : (userLocation ? onUpdateLocation : onRequestLocation)}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={userLocation && !ghostMode ? 'animate-location-pulse' : ''}
                                style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '50%',
                                    background: ghostMode ? 'transparent' : 'black',
                                    color: ghostMode ? 'white' : 'var(--accent-lime)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: ghostMode ? 'none' : '2px solid black'
                                }}>
                                {ghostMode ? (
                                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M50 10C30 10 20 30 20 50C20 70 25 90 30 90C35 90 35 80 40 80C45 80 45 90 50 90C55 90 55 80 60 80C65 80 65 90 70 90C75 90 80 70 80 50C80 30 70 10 50 10Z" stroke="white" strokeWidth="3" fill="none" />
                                        <circle cx="38" cy="45" r="5" fill="white" />
                                        <circle cx="62" cy="45" r="5" fill="white" />
                                        <ellipse cx="50" cy="60" rx="6" ry="8" fill="white" />
                                    </svg>
                                ) : !userLocation ? (
                                    <span className="material-symbols-outlined filled">location_off</span>
                                ) : (
                                    <span className="material-symbols-outlined filled">my_location</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                {!userLocation && !ghostMode ? (
                                    <>
                                        <span style={{ fontSize: '0.625rem', fontWeight: 900, color: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tap to</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'black', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>Enable Location</span>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '0.625rem', fontWeight: 900, color: ghostMode ? 'rgba(255,255,255,0.6)' : 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }}>You are in</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: ghostMode ? 'white' : 'black', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                            {ghostMode ? 'The Bermuda Triangle' : (userEstimatedCity || userLocation?.city || 'Unknown')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        {!ghostMode && (
                            <span className="material-symbols-outlined" style={{ color: 'black' }}>
                                {userLocation ? 'refresh' : 'chevron_right'}
                            </span>
                        )}
                    </div>

                    {/* Ghost Mode Toggle - Bottom Section */}
                    <div className="flex items-center justify-between p-4" style={{ borderTop: '2px solid black', background: ghostMode ? '#0d0d1a' : 'var(--graphic-paper)' }}>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ color: ghostMode ? 'var(--accent-lime)' : 'black' }}>visibility_off</span>
                            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: ghostMode ? 'var(--accent-lime)' : 'black', textTransform: 'uppercase' }}>Ghost Mode</span>
                        </div>
                        <label
                            style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={(e) => { e.preventDefault(); onToggleGhostMode?.(); }}
                        >
                            <div style={{
                                width: '4rem',
                                height: '2rem',
                                background: ghostMode ? 'var(--accent-lime)' : 'white',
                                border: '2px solid black',
                                borderRadius: '1rem',
                                position: 'relative',
                                transition: 'background 0.2s'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    left: ghostMode ? '2.25rem' : '0.25rem',
                                    top: '0.25rem',
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    background: 'black',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s'
                                }}></div>
                            </div>
                        </label>
                    </div>
                </div>
            </section>



            {/* Map Container or Ghost Mode Display */}
            {ghostMode ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    minHeight: '60vh',
                    padding: '3rem 1rem'
                }}>
                    <div className="ghost-float-icon">
                        <svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9 }}>
                            <path d="M50 10C30 10 20 30 20 50C20 70 25 90 30 90C35 90 35 80 40 80C45 80 45 90 50 90C55 90 55 80 60 80C65 80 65 90 70 90C75 90 80 70 80 50C80 30 70 10 50 10Z" stroke="rgba(204,255,0,0.8)" strokeWidth="2.5" fill="rgba(204,255,0,0.1)" />
                            <circle cx="38" cy="45" r="5" fill="rgba(204,255,0,0.9)" />
                            <circle cx="62" cy="45" r="5" fill="rgba(204,255,0,0.9)" />
                            <ellipse cx="50" cy="60" rx="6" ry="8" fill="rgba(204,255,0,0.9)" />
                        </svg>
                    </div>
                    <p style={{
                        marginTop: '1.5rem',
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        color: 'rgba(255,255,255,0.5)',
                        textAlign: 'center',
                        maxWidth: '280px',
                        lineHeight: 1.6
                    }}>
                        "The seer and the visible reciprocate one another"
                    </p>
                </div>
            ) : (
                <div className="map-container-wrapper">
                    <div ref={mapContainerRef} className="mapbox-container" />
                    {noTokenFallback}
                </div>
            )}

            {/* Floating Bottom Navigation */}
            <BottomNav
                activeTab="map"
                onTabChange={(tab) => {
                    if (tab === 'cities') onListView?.();
                    if (tab === 'friends') onShowFriends?.();
                    if (tab === 'you') onSettings?.();
                }}
                onLocationPress={onGoToUserCity}
            />

            <style>{`
                .map-view-container {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    width: 100%;
                    max-width: 28rem;
                    margin: 0 auto;
                    background: var(--background-dark);
                    overflow-x: hidden;
                    padding-bottom: 5rem;
                }
                
                .map-container-wrapper {
                    position: relative;
                    flex: 1;
                    width: 100%;
                    min-height: 60vh;
                    border: 3px solid black;
                    overflow: hidden;
                    border-radius: 8px;
                }
                
                .mapbox-container {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                }
                
                .mapboxgl-ctrl-group {
                    background: white !important;
                    border: 2px solid black !important;
                    border-radius: 0 !important;
                    box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1) !important;
                }
                
                .mapboxgl-ctrl-group button {
                    width: 36px !important;
                    height: 36px !important;
                }

                .ghost-float-icon {
                    animation: ghostFloat 3s ease-in-out infinite;
                }

                @keyframes ghostFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
        </div>
    );
}
