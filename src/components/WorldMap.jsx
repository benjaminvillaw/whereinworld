import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';

// Fix for default marker icons in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Calculate how "fresh" a location is (0 = stale, 1 = fresh)
function getFreshness(updatedAt) {
    if (!updatedAt) return 0;
    const hoursAgo = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
    // Fresh for 24 hours, then linear decay to 0 at 72 hours
    if (hoursAgo <= 24) return 1;
    if (hoursAgo >= 72) return 0;
    return 1 - (hoursAgo - 24) / 48;
}

// Create a custom pixel sprite marker icon
function createAvatarIcon(name, freshness) {
    const initial = name?.charAt(0)?.toUpperCase() || '?';
    const opacity = 0.4 + (freshness * 0.6); // Min 40% opacity
    const isStale = freshness < 0.5;
    const isFresh = freshness > 0.9;

    // Pixel character colors based on freshness
    const bgColor = isStale ? '#5d5d8d' : (isFresh ? '#38b764' : '#41a6f6');
    const borderColor = isStale ? '#3a4466' : (isFresh ? '#257953' : '#73eff7');

    return L.divIcon({
        className: 'friend-marker-wrapper',
        html: `
      <div class="friend-marker ${isStale ? 'stale' : ''} ${isFresh ? 'fresh' : ''}" 
           style="opacity: ${opacity}; background: ${bgColor}; border-color: ${borderColor};">
        ${initial}
      </div>
    `,
        iconSize: [48, 48],
        iconAnchor: [24, 32],
        popupAnchor: [0, -32]
    });
}

// Auto-fit map to markers
function FitBounds({ friends, userLocation }) {
    const map = useMap();

    useEffect(() => {
        const points = [];

        if (userLocation?.lat && userLocation?.lng) {
            points.push([userLocation.lat, userLocation.lng]);
        }

        friends?.forEach(friend => {
            if (friend.location?.lat && friend.location?.lng) {
                points.push([friend.location.lat, friend.location.lng]);
            }
        });

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
    }, [friends, userLocation, map]);

    return null;
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

export function WorldMap({ friends = [], userLocation, onSelectFriend }) {
    // Create markers for friends
    const friendMarkers = useMemo(() => {
        return friends
            .filter(f => f.location?.lat && f.location?.lng)
            .map(friend => {
                const freshness = getFreshness(friend.location?.updatedAt);
                return {
                    ...friend,
                    freshness,
                    icon: createAvatarIcon(friend.displayName, freshness)
                };
            });
    }, [friends]);

    // Default center (world view)
    const defaultCenter = userLocation?.lat && userLocation?.lng
        ? [userLocation.lat, userLocation.lng]
        : [20, 0];

    return (
        <div className="world-map-container">
            <MapContainer
                center={defaultCenter}
                zoom={3}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                {/* Dark mode map tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <FitBounds friends={friends} userLocation={userLocation} />

                {/* User's own location marker */}
                {userLocation?.lat && userLocation?.lng && (
                    <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={L.divIcon({
                            className: 'friend-marker-wrapper',
                            html: `<div class="friend-marker fresh" style="background: #38b764; border-color: #257953;">
                      <span style="font-size: 16px;">★</span>
                     </div>`,
                            iconSize: [48, 48],
                            iconAnchor: [24, 32]
                        })}
                    >
                        <Popup>
                            <div className="popup-content">
                                <strong>YOU ARE HERE</strong>
                                <div className="text-muted text-sm">
                                    {userLocation.city}, {userLocation.country}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Friend markers */}
                {friendMarkers.map(friend => (
                    <Marker
                        key={friend.id}
                        position={[friend.location.lat, friend.location.lng]}
                        icon={friend.icon}
                        eventHandlers={{
                            click: () => onSelectFriend?.(friend)
                        }}
                    >
                        <Popup>
                            <div className="popup-content">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="avatar avatar-sm">
                                        {friend.displayName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <strong>{friend.displayName}</strong>
                                </div>
                                <div className="text-secondary text-sm">
                                    📍 {friend.location.city}, {friend.location.country}
                                </div>
                                <div className={`text-sm mt-1 ${friend.freshness < 0.5 ? 'text-muted' : 'text-secondary'}`}>
                                    🕒 {timeAgo(friend.location.updatedAt)}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Map legend */}
            <div className="map-legend glass-card">
                <div className="legend-item">
                    <div className="legend-dot fresh"></div>
                    <span>Updated recently</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot stale"></div>
                    <span>Not updated in 24h+</span>
                </div>
            </div>

            <style>{`
        .world-map-container {
          position: relative;
          height: 100%;
          width: 100%;
          overflow: hidden;
          border: 4px solid var(--bg-tertiary);
        }
        
        .friend-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }
        
        .popup-content {
          min-width: 150px;
          font-family: 'Press Start 2P', monospace;
          font-size: 8px;
          line-height: 1.8;
        }
        
        .map-legend {
          position: absolute;
          bottom: 16px;
          left: 16px;
          z-index: 1000;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--bg-secondary);
          border: 4px solid var(--bg-tertiary);
          box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
        }
        
        .map-legend::before {
          content: '◆ LEGEND ◆';
          font-size: 8px;
          color: var(--accent-secondary);
          margin-bottom: 4px;
          letter-spacing: 1px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 8px;
          color: var(--text-secondary);
        }
        
        .legend-dot {
          width: 12px;
          height: 12px;
          border: 2px solid;
        }
        
        .legend-dot.fresh {
          background: var(--success);
          border-color: var(--success-dark);
          box-shadow: 0 0 8px rgba(56, 183, 100, 0.6);
        }
        
        .legend-dot.stale {
          background: var(--text-muted);
          border-color: var(--bg-tertiary);
          opacity: 0.6;
        }
      `}</style>
        </div>
    );
}
