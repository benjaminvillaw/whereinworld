import { useMemo, useState, useRef, useCallback } from 'react';

// City images - curated high quality images for popular cities, with dynamic fallback
const CITY_IMAGES = {
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
    'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80',
    'berlin': 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&q=80',
    'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    'boston': 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=800&q=80',
    'chicago': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80',
    'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&q=80',
    'seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800&q=80',
    'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
    'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80',
    'toronto': 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&q=80',
    'vancouver': 'https://images.unsplash.com/photo-1559511260-66a68e7c8e80?w=800&q=80',
    'denver': 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=800&q=80',
    'austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80',
    'nashville': 'https://images.unsplash.com/photo-1545419913-775e3e48e48e?w=800&q=80',
    'portland': 'https://images.unsplash.com/photo-1507245351670-7a1b4a7d4e91?w=800&q=80',
    'atlanta': 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=800&q=80',
    'philadelphia': 'https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?w=800&q=80',
    'washington': 'https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=800&q=80',
    'san diego': 'https://images.unsplash.com/photo-1538689621163-f60939e00d32?w=800&q=80',
    'las vegas': 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80',
    'phoenix': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80'
};

// Color palette for city cards - lime first for user's city
const CITY_COLORS = [
    { bg: '#CCFF00', name: 'lime' },        // Lime (user's city)
    { bg: '#C4A7E7', name: 'lavender' },    // Lavender
    { bg: '#FFEB3B', name: 'yellow' },      // Yellow
    { bg: '#FF90B3', name: 'pink' },        // Pink
    { bg: '#A0E8AF', name: 'mint' },        // Mint
    { bg: '#FF7F6C', name: 'coral' },       // Coral
];

// Weather icons mapping
const WEATHER_ICONS = {
    'clear': 'sunny',
    'sunny': 'sunny',
    'cloudy': 'partly_cloudy_day',
    'rain': 'cloud',
    'snow': 'ac_unit',
    'default': 'partly_cloudy_day'
};

// Mock weather data (in a real app, this would come from an API)
const MOCK_WEATHER = ['Clear', 'Cloudy', 'Rain', 'Sunny'];

function getCityImage(cityName) {
    const key = cityName?.toLowerCase() || 'default';

    // Check if we have a curated image for this city
    if (CITY_IMAGES[key]) {
        return CITY_IMAGES[key];
    }

    // Use Unsplash Source API as dynamic fallback for any city
    // This fetches a real, high-quality image based on the city name
    const encodedCity = encodeURIComponent(cityName + ' city skyline');
    return `https://source.unsplash.com/800x600/?${encodedCity}`;
}

// City videos - generated with Veo3 (placeholder URLs - replace with actual generated videos)
// Videos should be 8-10 second looping clips, 1080p, hosted on your CDN
const CITY_VIDEOS = {
    // Uncomment and add your Veo3-generated video URLs here:
    // 'boston': 'https://your-cdn.com/cities/boston.mp4',
    // 'new york': 'https://your-cdn.com/cities/new-york.mp4',
    // 'san francisco': 'https://your-cdn.com/cities/san-francisco.mp4',
};

function getCityVideo(cityName) {
    const key = cityName?.toLowerCase();
    return CITY_VIDEOS[key] || null;
}

function getWeatherIcon(weather) {
    const key = weather?.toLowerCase() || 'default';
    return WEATHER_ICONS[key] || WEATHER_ICONS.default;
}

// Format relative time
function timeAgo(dateString) {
    if (!dateString) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
}

// Get freshness level (0-1)
function getFreshness(updatedAt) {
    if (!updatedAt) return 0;
    const hoursAgo = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) return 1;
    if (hoursAgo >= 72) return 0;
    return 1 - (hoursAgo - 24) / 48;
}

// Wave SVG paths for variety
const WAVE_PATHS = [
    "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
    "M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,106.7C672,117,768,171,864,197.3C960,224,1056,224,1152,208C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
    "M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,122.7C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
];

// Major cities database for nearest city lookup
const MAJOR_CITIES = [
    { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', country: 'United States', lat: 29.7604, lng: -95.3698 },
    { name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918 },
    { name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
    { name: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321 },
    { name: 'Boston', country: 'United States', lat: 42.3601, lng: -71.0589 },
    { name: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903 },
    { name: 'Atlanta', country: 'United States', lat: 33.7490, lng: -84.3880 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
    { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
    { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
    { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
];

// Calculate distance between two points using Haversine formula
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find nearest major city
function getNearestCity(lat, lng) {
    let nearest = MAJOR_CITIES[0];
    let minDistance = Infinity;

    for (const city of MAJOR_CITIES) {
        const distance = getDistance(lat, lng, city.lat, city.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = city;
        }
    }

    return { ...nearest, distance: Math.round(minDistance) };
}

export function CityList({ friends = [], userLocation, user, onSelectCity, onSelectFriend, onInvite, onToggleGhostMode, onUpdateLocation, onMapView, onSettings, ghostMode = false, notificationsMuted = false, onToggleNotifications, onRefresh, refreshing = false }) {
    // Pull-to-refresh state
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const containerRef = useRef(null);
    const startY = useRef(0);
    const PULL_THRESHOLD = 80;

    const handleTouchStart = useCallback((e) => {
        if (containerRef.current?.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling || !containerRef.current) return;
        if (containerRef.current.scrollTop > 0) {
            setIsPulling(false);
            setPullDistance(0);
            return;
        }
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;
        if (diff > 0) {
            setPullDistance(Math.min(diff * 0.5, 120));
        }
    }, [isPulling]);

    const handleTouchEnd = useCallback(() => {
        if (pullDistance >= PULL_THRESHOLD && onRefresh && !refreshing) {
            onRefresh();
        }
        setPullDistance(0);
        setIsPulling(false);
    }, [pullDistance, onRefresh, refreshing]);
    // Group friends by city (using nearest major city within 30km for grouping)
    // Now includes current user as a special "friend" in their city
    const citiesData = useMemo(() => {
        const cityMap = new Map();
        const PROXIMITY_THRESHOLD_KM = 30; // Group cities within 30km as same metro area

        // Determine user's metro area and add user as first "friend"
        let userMetroCityKey = null;
        if (userLocation?.lat && userLocation?.lng && !ghostMode) {
            const userLat = parseFloat(userLocation.lat);
            const userLng = parseFloat(userLocation.lng);
            if (!isNaN(userLat) && !isNaN(userLng)) {
                const userNearestMajor = getNearestCity(userLat, userLng);
                const userDisplayCity = userNearestMajor.distance <= PROXIMITY_THRESHOLD_KM
                    ? userNearestMajor.name
                    : (userLocation.city || 'Your Location');
                const userDisplayCountry = userNearestMajor.distance <= PROXIMITY_THRESHOLD_KM
                    ? userNearestMajor.country
                    : (userLocation.country || '');

                userMetroCityKey = `${userDisplayCity}|${userDisplayCountry}`;

                // Create city entry for user's location
                if (!cityMap.has(userMetroCityKey)) {
                    cityMap.set(userMetroCityKey, {
                        city: userDisplayCity,
                        country: userDisplayCountry,
                        friends: [],
                        weather: MOCK_WEATHER[Math.floor(Math.random() * MOCK_WEATHER.length)],
                        isUserCity: true
                    });
                }

                // Add current user as first "friend" in their city
                cityMap.get(userMetroCityKey).friends.push({
                    id: user?.id || 'current-user',
                    display_name: user?.display_name || user?.displayName || 'You',
                    avatar_url: user?.avatar_url || user?.avatarUrl,
                    city: userLocation.city,
                    country: userLocation.country,
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    location_updated_at: userLocation.updatedAt || new Date().toISOString(),
                    isCurrentUser: true, // Special flag to identify current user
                    originalCity: userLocation.city,
                    freshness: 1, // Always show user as fresh
                    updatedAt: userLocation.updatedAt || new Date().toISOString()
                });
            }
        }

        // Group friends by nearest major city
        friends.forEach(friend => {
            const lat = parseFloat(friend.lat);
            const lng = parseFloat(friend.lng);
            const originalCity = friend.city;
            const country = friend.country;

            if (!originalCity || isNaN(lat) || isNaN(lng)) return;

            // Find nearest major city
            const nearestMajor = getNearestCity(lat, lng);

            // Use major city name if within threshold, otherwise use original city
            const displayCity = nearestMajor.distance <= PROXIMITY_THRESHOLD_KM
                ? nearestMajor.name
                : originalCity;
            const displayCountry = nearestMajor.distance <= PROXIMITY_THRESHOLD_KM
                ? nearestMajor.country
                : country;

            const key = `${displayCity}|${displayCountry}`;

            if (!cityMap.has(key)) {
                cityMap.set(key, {
                    city: displayCity,
                    country: displayCountry,
                    friends: [],
                    weather: MOCK_WEATHER[Math.floor(Math.random() * MOCK_WEATHER.length)]
                });
            }

            cityMap.get(key).friends.push({
                ...friend,
                originalCity: originalCity,
                freshness: getFreshness(friend.location_updated_at),
                updatedAt: friend.location_updated_at
            });
        });

        // Convert to array and sort - user's city first, then by friend count
        const cities = Array.from(cityMap.values());
        cities.sort((a, b) => {
            // User's city always first
            if (a.isUserCity) return -1;
            if (b.isUserCity) return 1;
            // Then by friend count
            return b.friends.length - a.friends.length;
        });

        // Sort friends within each city - current user first, then by freshness
        cities.forEach(city => {
            city.friends.sort((a, b) => {
                if (a.isCurrentUser) return -1;
                if (b.isCurrentUser) return 1;
                return b.freshness - a.freshness;
            });
        });

        return cities;
    }, [friends, userLocation, user, ghostMode]);

    return (
        <div
            className="city-list-container"
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}
        >
            {/* Pull to refresh indicator */}
            {(pullDistance > 0 || refreshing) && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: `translateX(-50%) translateY(${refreshing ? 20 : pullDistance - 40}px)`,
                    zIndex: 100,
                    transition: refreshing ? 'none' : 'transform 0.1s ease-out'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--accent-lime)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        animation: refreshing ? 'spin 1s linear infinite' : 'none',
                        opacity: pullDistance >= PULL_THRESHOLD || refreshing ? 1 : pullDistance / PULL_THRESHOLD
                    }}>
                        <span className="material-symbols-outlined" style={{ color: 'black', fontSize: '1.25rem' }}>
                            {refreshing ? 'sync' : (pullDistance >= PULL_THRESHOLD ? 'arrow_downward' : 'arrow_downward')}
                        </span>
                    </div>
                </div>
            )}
            {/* Header */}
            <header className="header">
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
                            transition: 'transform 0.2s, box-shadow 0.2s'
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
                    <div style={{ lineHeight: 1.1 }}>
                        <h1 style={{
                            fontSize: '1.3rem',
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                            color: 'white',
                            marginBottom: '0'
                        }}>Where In</h1>
                        <h1 style={{
                            fontSize: '2.2rem',
                            fontWeight: 900,
                            letterSpacing: '-0.02em',
                            textTransform: 'uppercase',
                            color: 'white',
                            marginTop: '-2px'
                        }}>World</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onInvite && (
                        <button
                            className="btn-hard"
                            style={{ width: '3rem', height: '3rem', padding: 0, background: 'var(--accent-lime)', color: 'black' }}
                            onClick={onInvite}
                            title="Invite Friends"
                        >
                            <span className="material-symbols-outlined">person_add</span>
                        </button>
                    )}
                    <button
                        className="btn-hard"
                        style={{
                            width: '3rem',
                            height: '3rem',
                            padding: 0,
                            background: notificationsMuted ? '#ef4444' : 'var(--surface-dark)',
                            transition: 'background 0.2s'
                        }}
                        onClick={onToggleNotifications}
                        title={notificationsMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                    >
                        <span className="material-symbols-outlined">
                            {notificationsMuted ? 'notifications_off' : 'notifications'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Ghost Mode Toggle */}
            <section className="px-6 mb-4">
                <div className="card-hard" style={{ overflow: 'hidden' }}>
                    <div className="flex items-center justify-between p-4" style={{ background: ghostMode ? '#0d0d1a' : 'var(--graphic-paper)' }}>
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
                                    transition: 'left 0.2s'
                                }}></div>
                            </div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Section Header */}
            <div className="flex items-center justify-between px-6 py-4">
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontStyle: 'italic',
                    transform: 'skewX(-6deg)',
                    color: 'white'
                }}>
                    Earth
                </h2>
                <button
                    onClick={onMapView}
                    style={{
                        color: 'var(--accent-lime)',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontStyle: 'italic',
                        transform: 'skewX(-6deg)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}>
                    Map View
                </button>
            </div>

            {/* City Cards */}
            <div className="flex flex-col gap-6 px-6 pb-28">
                {/* Ghost Mode Display - Large centered ghost */}
                {ghostMode && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3rem 1rem',
                        marginTop: '2rem'
                    }}>
                        <svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9 }}>
                            <path d="M50 10C30 10 20 30 20 50C20 70 25 90 30 90C35 90 35 80 40 80C45 80 45 90 50 90C55 90 55 80 60 80C65 80 65 90 70 90C75 90 80 70 80 50C80 30 70 10 50 10Z" stroke="rgba(204,255,0,0.8)" strokeWidth="2.5" fill="rgba(204,255,0,0.1)" />
                            <circle cx="38" cy="45" r="5" fill="rgba(204,255,0,0.9)" />
                            <circle cx="62" cy="45" r="5" fill="rgba(204,255,0,0.9)" />
                            <ellipse cx="50" cy="60" rx="6" ry="8" fill="rgba(204,255,0,0.9)" />
                        </svg>
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
                )}


                {citiesData.length === 0 && !userLocation?.lat ? (
                    <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '4rem', opacity: 0.5 }}>location_city</span>
                        <p className="mt-4 font-bold uppercase">No active zones yet</p>
                        <p className="text-sm mt-2">Invite friends to see where they are!</p>
                    </div>
                ) : (
                    citiesData.map((cityData, index) => {
                        const color = CITY_COLORS[index % CITY_COLORS.length];
                        const wavePath = WAVE_PATHS[index % WAVE_PATHS.length];
                        const rotations = [-2, 2, -1, 1, 0];
                        const tagRotation = rotations[index % rotations.length];

                        return (
                            <div
                                key={`${cityData.city}-${cityData.country}`}
                                className="city-card"
                                onClick={() => onSelectCity?.(cityData)}
                            >
                                {/* Background Image or Video */}
                                <div className="city-card-image">
                                    {getCityVideo(cityData.city) ? (
                                        <video
                                            src={getCityVideo(cityData.city)}
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <img
                                            src={getCityImage(cityData.city)}
                                            alt={cityData.city}
                                            loading="lazy"
                                        />
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)'
                                    }}></div>
                                </div>

                                {/* Wave Separator */}
                                <div className="city-card-wave" style={{ color: color.bg }}>
                                    <svg preserveAspectRatio="none" viewBox="0 0 1440 320" style={{ height: '4rem' }}>
                                        <path d={wavePath} fill="currentColor" fillOpacity="1"></path>
                                    </svg>
                                </div>

                                {/* Content Area */}
                                <div className="city-card-content" style={{ background: color.bg, paddingBottom: '1.5rem' }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="city-card-title">{cityData.city}</h3>
                                            <p className="city-card-weather">
                                                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
                                                    {getWeatherIcon(cityData.weather)}
                                                </span>
                                                {cityData.weather}
                                            </p>
                                        </div>
                                        <div
                                            className="badge-tag badge-tag-large"
                                            style={{
                                                transform: `rotate(${tagRotation}deg)`,
                                                background: cityData.isUserCity ? 'black' : undefined,
                                                color: cityData.isUserCity ? color.bg : undefined
                                            }}
                                        >
                                            {cityData.isUserCity ? (
                                                `📍 YOU${cityData.friends.length > 1 ? ` + ${cityData.friends.length - 1}` : ''}`
                                            ) : (
                                                `${cityData.friends.length} Friend${cityData.friends.length !== 1 ? 's' : ''}`
                                            )}
                                        </div>
                                    </div>

                                    <div className="city-card-footer">
                                        {/* Avatar Stack */}
                                        <div className="avatar-stack-large">
                                            {cityData.friends.slice(0, 4).map((friend, idx) => (
                                                <div key={friend.id} className="avatar-large" style={{
                                                    zIndex: 10 - idx,
                                                    background: ['#A0E8AF', '#FF7F6C', '#C4A7E7', '#FFEB3B'][idx % 4],
                                                    marginLeft: idx > 0 ? '-0.75rem' : 0
                                                }}>
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    ) : (
                                                        friend.displayName?.charAt(0)?.toUpperCase() ||
                                                        friend.display_name?.charAt(0)?.toUpperCase() || '?'
                                                    )}
                                                </div>
                                            ))}
                                            {cityData.friends.length > 4 && (
                                                <div className="avatar-large" style={{
                                                    background: 'white',
                                                    color: 'black',
                                                    fontSize: '0.875rem',
                                                    marginLeft: '-0.75rem'
                                                }}>
                                                    +{cityData.friends.length - 4}
                                                </div>
                                            )}
                                        </div>

                                        {/* Arrow Button */}
                                        <button className="btn-hard" style={{
                                            width: '2.5rem',
                                            height: '2.5rem',
                                            padding: 0,
                                            background: 'black',
                                            color: 'white',
                                            border: '2px solid black'
                                        }}>
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                .city-list-container {
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
                
                .avatar-stack-large {
                    display: flex;
                    align-items: center;
                }
                
                .avatar-large {
                    width: 3rem;
                    height: 3rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1rem;
                    color: black;
                    border: 3px solid black;
                    overflow: hidden;
                    flex-shrink: 0;
                }
            `}</style>
        </div>
    );
}
