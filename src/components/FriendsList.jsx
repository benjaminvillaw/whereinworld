import { useState, useMemo } from 'react';

// Calculate distance between two coordinates in km
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

// Get freshness level
function getFreshness(updatedAt) {
    if (!updatedAt) return 0;
    const hoursAgo = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) return 1;
    if (hoursAgo >= 72) return 0;
    return 1 - (hoursAgo - 24) / 48;
}

export function FriendsList({ friends = [], userLocation, onSelectFriend }) {
    const [filter, setFilter] = useState('all'); // 'all', 'nearby', 'stale'
    const [sortBy, setSortBy] = useState('distance'); // 'distance', 'recent', 'name'

    // Process friends with distance and sorting
    const processedFriends = useMemo(() => {
        let result = friends.map(friend => {
            let distance = null;
            if (userLocation?.lat && friend.location?.lat) {
                distance = getDistance(
                    userLocation.lat, userLocation.lng,
                    friend.location.lat, friend.location.lng
                );
            }

            const freshness = getFreshness(friend.location?.updatedAt);

            return {
                ...friend,
                distance,
                freshness,
                isNearby: distance !== null && distance <= 50 // Within 50km
            };
        });

        // Filter
        if (filter === 'nearby') {
            result = result.filter(f => f.isNearby);
        } else if (filter === 'stale') {
            result = result.filter(f => f.freshness < 0.5);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'distance') {
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            }
            if (sortBy === 'recent') {
                const aTime = a.location?.updatedAt ? new Date(a.location.updatedAt).getTime() : 0;
                const bTime = b.location?.updatedAt ? new Date(b.location.updatedAt).getTime() : 0;
                return bTime - aTime;
            }
            if (sortBy === 'name') {
                return (a.displayName || '').localeCompare(b.displayName || '');
            }
            return 0;
        });

        return result;
    }, [friends, userLocation, filter, sortBy]);

    const nearbyCount = processedFriends.filter(f => f.isNearby).length;

    return (
        <div className="friends-list">
            {/* Header with filters */}
            <div className="friends-header">
                <h3 className="friends-title">
                    Friends
                    <span className="friends-count">{friends.length}</span>
                </h3>

                <div className="friends-filters">
                    <select
                        className="filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Friends</option>
                        <option value="nearby">Nearby ({nearbyCount})</option>
                        <option value="stale">Need Update</option>
                    </select>

                    <select
                        className="filter-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="distance">By Distance</option>
                        <option value="recent">By Recent</option>
                        <option value="name">By Name</option>
                    </select>
                </div>
            </div>

            {/* Nearby alert */}
            {nearbyCount > 0 && filter !== 'nearby' && (
                <div className="nearby-alert" onClick={() => setFilter('nearby')}>
                    <span className="nearby-icon">📍</span>
                    <span><strong>{nearbyCount}</strong> friend{nearbyCount > 1 ? 's' : ''} nearby!</span>
                    <span className="nearby-cta">View →</span>
                </div>
            )}

            {/* Friends list */}
            <div className="friends-scroll">
                {processedFriends.length === 0 ? (
                    <div className="friends-empty">
                        <div className="empty-icon">👥</div>
                        <p>No friends to show</p>
                        <p className="text-muted text-sm">
                            {filter === 'nearby'
                                ? 'No friends within 50km'
                                : 'Sync your contacts to find friends'}
                        </p>
                    </div>
                ) : (
                    processedFriends.map(friend => (
                        <div
                            key={friend.id}
                            className={`friend-item fade-in ${friend.isNearby ? 'nearby' : ''}`}
                            onClick={() => onSelectFriend?.(friend)}
                        >
                            <div
                                className="friend-avatar"
                                style={{ opacity: 0.4 + friend.freshness * 0.6 }}
                            >
                                {friend.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            <div className="friend-info">
                                <div className="friend-name">{friend.displayName || 'Unknown'}</div>
                                <div className="friend-location">
                                    📍 {friend.location?.city || 'Unknown'}, {friend.location?.country || ''}
                                </div>
                            </div>

                            <div className="friend-meta">
                                {friend.isNearby && (
                                    <span className="badge badge-success">Nearby</span>
                                )}
                                {friend.distance !== null && (
                                    <span className="friend-distance">
                                        {friend.distance < 1
                                            ? '< 1 km'
                                            : friend.distance < 100
                                                ? `${Math.round(friend.distance)} km`
                                                : `${Math.round(friend.distance / 100) * 100}+ km`}
                                    </span>
                                )}
                                <span className={`friend-updated ${friend.freshness < 0.5 ? 'stale' : ''}`}>
                                    {timeAgo(friend.location?.updatedAt)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
        .friends-list {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        
        .friends-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .friends-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 700;
        }
        
        .friends-count {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 2px 10px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
        }
        
        .friends-filters {
          display: flex;
          gap: 8px;
        }
        
        .filter-select {
          flex: 1;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 13px;
          cursor: pointer;
          outline: none;
        }
        
        .filter-select:focus {
          border-color: var(--accent-primary);
        }
        
        .nearby-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(16, 185, 129, 0.1);
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        
        .nearby-alert:hover {
          background: rgba(16, 185, 129, 0.15);
        }
        
        .nearby-icon {
          font-size: 18px;
        }
        
        .nearby-cta {
          margin-left: auto;
          color: var(--success);
          font-weight: 600;
        }
        
        .friends-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .friends-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          margin-bottom: 8px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          border: 1px solid transparent;
        }
        
        .friend-item:hover {
          background: var(--bg-glass-hover);
          border-color: var(--border-accent);
        }
        
        .friend-item.nearby {
          border-color: rgba(16, 185, 129, 0.3);
        }
        
        .friend-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: white;
          flex-shrink: 0;
        }
        
        .friend-info {
          flex: 1;
          min-width: 0;
        }
        
        .friend-name {
          font-weight: 600;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .friend-location {
          font-size: 13px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .friend-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }
        
        .friend-distance {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .friend-updated {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .friend-updated.stale {
          color: var(--warning);
        }
      `}</style>
        </div>
    );
}
