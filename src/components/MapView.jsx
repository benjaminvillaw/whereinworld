import { useMemo } from 'react';

// Major cities database with coordinates
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

// Convert lat/lng to SVG coordinates
function projectToSVG(lat, lng, width, height) {
    // Simple equirectangular projection
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
}

export function MapView({ friends = [], userLocation, onSelectCity }) {
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

    const width = 800;
    const height = 450;

    return (
        <div className="map-view-container">
            <h2 className="map-title">Earth</h2>

            <div className="map-svg-container">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="world-map-svg"
                >
                    {/* World background */}
                    <rect width={width} height={height} fill="var(--background-dark)" />

                    {/* Simple world outline */}
                    <g className="world-outline" stroke="rgba(255,255,255,0.15)" fill="none" strokeWidth="1">
                        {/* Continents rough outlines */}
                        {/* North America */}
                        <path d="M50,80 Q100,60 180,70 Q200,90 220,150 Q180,200 120,210 Q80,180 50,120 Z" />
                        {/* South America */}
                        <path d="M150,230 Q170,240 180,280 Q190,340 170,380 Q140,390 130,350 Q110,290 150,230 Z" />
                        {/* Europe */}
                        <path d="M380,80 Q420,70 460,80 Q480,100 450,130 Q400,140 380,110 Z" />
                        {/* Africa */}
                        <path d="M400,170 Q450,160 480,180 Q510,240 490,320 Q430,350 390,300 Q380,230 400,170 Z" />
                        {/* Asia */}
                        <path d="M500,60 Q600,50 700,80 Q750,120 750,180 Q700,200 600,200 Q520,180 480,130 Q490,80 500,60 Z" />
                        {/* Australia */}
                        <path d="M650,280 Q720,260 760,290 Q780,340 740,370 Q680,380 650,340 Q640,310 650,280 Z" />
                    </g>

                    {/* Grid lines */}
                    <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.5">
                        {[...Array(7)].map((_, i) => (
                            <line key={`h${i}`} x1="0" y1={i * (height / 6)} x2={width} y2={i * (height / 6)} />
                        ))}
                        {[...Array(13)].map((_, i) => (
                            <line key={`v${i}`} x1={i * (width / 12)} y1="0" x2={i * (width / 12)} y2={height} />
                        ))}
                    </g>

                    {/* User location marker */}
                    {userLocation?.lat && userLocation?.lng && (() => {
                        const pos = projectToSVG(userLocation.lat, userLocation.lng, width, height);
                        return (
                            <g transform={`translate(${pos.x}, ${pos.y})`}>
                                <circle r="15" fill="#CCFF00" stroke="black" strokeWidth="2" className="pulse-marker" />
                                <text textAnchor="middle" y="5" fill="black" fontSize="10" fontWeight="bold">YOU</text>
                            </g>
                        );
                    })()}

                    {/* City markers with friend counts */}
                    {citiesData.map((city, idx) => {
                        const pos = projectToSVG(city.lat, city.lng, width, height);
                        const friendCount = city.friends.length;
                        const size = Math.min(30, 12 + friendCount * 4);

                        return (
                            <g
                                key={city.city}
                                transform={`translate(${pos.x}, ${pos.y})`}
                                className="city-marker"
                                onClick={() => onSelectCity?.(city)}
                                style={{ cursor: 'pointer' }}
                            >
                                <circle
                                    r={size}
                                    fill={city.color}
                                    stroke="black"
                                    strokeWidth="2"
                                    opacity="0.9"
                                />
                                <text
                                    textAnchor="middle"
                                    y={size + 14}
                                    fill="white"
                                    fontSize="10"
                                    fontWeight="bold"
                                    textTransform="uppercase"
                                >
                                    {city.city}
                                </text>
                                <text
                                    textAnchor="middle"
                                    y="4"
                                    fill="black"
                                    fontSize="11"
                                    fontWeight="900"
                                >
                                    {friendCount}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* City list below map */}
            <div className="map-city-list">
                {citiesData.length === 0 ? (
                    <p className="no-friends-msg">No friends with locations yet</p>
                ) : (
                    citiesData.map(city => (
                        <div
                            key={city.city}
                            className="map-city-item"
                            onClick={() => onSelectCity?.(city)}
                        >
                            <div className="city-color-dot" style={{ background: city.color }} />
                            <div className="city-info">
                                <span className="city-name">{city.city}</span>
                                <span className="city-country">{city.country}</span>
                            </div>
                            <div className="friend-count">{city.friends.length} friends</div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .map-view-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    width: 100%;
                    max-width: 28rem;
                    margin: 0 auto;
                    background: var(--background-dark);
                    padding: 1rem;
                    padding-bottom: 6rem;
                }
                
                .map-title {
                    font-size: 1.25rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-style: italic;
                    transform: skewX(-6deg);
                    color: white;
                    margin-bottom: 1rem;
                    padding: 0 0.5rem;
                }
                
                .map-svg-container {
                    width: 100%;
                    aspect-ratio: 16/9;
                    border: 3px solid black;
                    background: var(--surface-dark);
                    overflow: hidden;
                }
                
                .world-map-svg {
                    width: 100%;
                    height: 100%;
                }
                
                .city-marker {
                    transition: transform 0.2s ease;
                }
                
                .city-marker:hover {
                    transform: scale(1.1);
                }
                
                .pulse-marker {
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                .map-city-list {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .map-city-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: var(--surface-dark);
                    border: 2px solid black;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .map-city-item:hover {
                    transform: translateX(4px);
                }
                
                .city-color-dot {
                    width: 1rem;
                    height: 1rem;
                    border-radius: 50%;
                    border: 2px solid black;
                    flex-shrink: 0;
                }
                
                .city-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .city-name {
                    font-weight: 800;
                    text-transform: uppercase;
                    color: white;
                }
                
                .city-country {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                
                .friend-count {
                    font-weight: 700;
                    color: var(--accent-lime);
                    font-size: 0.875rem;
                }
                
                .no-friends-msg {
                    text-align: center;
                    color: var(--text-muted);
                    padding: 2rem;
                }
            `}</style>
        </div>
    );
}
