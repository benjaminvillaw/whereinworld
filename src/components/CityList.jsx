import { useMemo } from 'react';

// City images - using high quality Unsplash images
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
    'default': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80'
};

// Color palette for city cards
const CITY_COLORS = [
    { bg: '#C4A7E7', name: 'lavender' },    // Lavender
    { bg: '#CCFF00', name: 'lime' },        // Lime
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
    return CITY_IMAGES[key] || CITY_IMAGES.default;
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

export function CityList({ friends = [], userLocation, onSelectCity, onSelectFriend }) {
    // Group friends by city
    const citiesData = useMemo(() => {
        const cityMap = new Map();

        // Group friends by city
        friends.forEach(friend => {
            const location = friend.location;
            if (!location?.city) return;

            const key = `${location.city}|${location.country}`;

            if (!cityMap.has(key)) {
                cityMap.set(key, {
                    city: location.city,
                    country: location.country,
                    friends: [],
                    weather: MOCK_WEATHER[Math.floor(Math.random() * MOCK_WEATHER.length)]
                });
            }

            cityMap.get(key).friends.push({
                ...friend,
                freshness: getFreshness(location.updatedAt || friend.location_updated_at),
                updatedAt: location.updatedAt || friend.location_updated_at
            });
        });

        // Convert to array and sort by friend count
        const cities = Array.from(cityMap.values());
        cities.sort((a, b) => b.friends.length - a.friends.length);

        // Sort friends within each city by freshness
        cities.forEach(city => {
            city.friends.sort((a, b) => b.freshness - a.freshness);
        });

        return cities;
    }, [friends]);

    return (
        <div className="city-list-container">
            {/* Header */}
            <header className="header">
                <div>
                    <h1 className="header-title text-primary">Dashboard</h1>
                    <p className="header-subtitle">Location Tracking</p>
                </div>
                <button className="btn-hard" style={{ width: '3rem', height: '3rem', padding: 0 }}>
                    <span className="material-symbols-outlined">notifications</span>
                </button>
            </header>

            {/* User Location Card */}
            {userLocation?.city && (
                <section className="px-6 mb-6">
                    <div className="card-hard" style={{ overflow: 'hidden' }}>
                        <div className="flex items-center justify-between p-4" style={{ background: 'white' }}>
                            <div className="flex items-center gap-3">
                                <div style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    background: 'black',
                                    color: 'var(--accent-lime)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid black'
                                }}>
                                    <span className="material-symbols-outlined filled">my_location</span>
                                </div>
                                <div className="flex flex-col">
                                    <span style={{ fontSize: '0.625rem', fontWeight: 900, color: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }}>You are in</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'black', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>{userLocation.city}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4" style={{ borderTop: '2px solid black', background: 'var(--graphic-paper)' }}>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined" style={{ color: 'black' }}>visibility_off</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'black', textTransform: 'uppercase' }}>Ghost Mode</span>
                            </div>
                            <label style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" style={{ display: 'none' }} className="ghost-toggle" />
                                <div style={{
                                    width: '4rem',
                                    height: '2rem',
                                    background: 'white',
                                    border: '2px solid black',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: '0.25rem',
                                        top: '0.25rem',
                                        width: '1.25rem',
                                        height: '1.25rem',
                                        background: 'black',
                                        transition: 'transform 0.2s'
                                    }}></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </section>
            )}

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
                    Active Zones
                </h2>
                <button style={{
                    color: 'var(--accent-lime)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                }}>
                    Map View
                </button>
            </div>

            {/* City Cards */}
            <div className="flex flex-col gap-6 px-6 pb-28">
                {citiesData.length === 0 ? (
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
                                {/* Background Image */}
                                <div className="city-card-image">
                                    <img
                                        src={getCityImage(cityData.city)}
                                        alt={cityData.city}
                                        loading="lazy"
                                    />
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
                                        <div className="badge-tag" style={{ transform: `rotate(${tagRotation}deg)` }}>
                                            {cityData.friends.length} Friend{cityData.friends.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    <div className="city-card-footer">
                                        {/* Avatar Stack */}
                                        <div className="avatar-stack">
                                            {cityData.friends.slice(0, 3).map((friend, idx) => (
                                                <div key={friend.id} className="avatar grayscale" style={{
                                                    background: ['#A0E8AF', '#FF7F6C', '#C4A7E7', '#FFEB3B'][idx % 4],
                                                    zIndex: 10 - idx
                                                }}>
                                                    {friend.displayName?.charAt(0)?.toUpperCase() ||
                                                        friend.display_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            ))}
                                            {cityData.friends.length > 3 && (
                                                <div className="avatar" style={{
                                                    background: 'white',
                                                    color: 'black',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    +{cityData.friends.length - 3}
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
            `}</style>
        </div>
    );
}
