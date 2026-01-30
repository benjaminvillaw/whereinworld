import { useState, useMemo } from 'react';
import { BottomNav } from './BottomNav';

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

// Format date added
function formatAddedDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get freshness level
function getFreshness(updatedAt) {
  if (!updatedAt) return 0;
  const hoursAgo = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 24) return 1;
  if (hoursAgo >= 72) return 0;
  return 1 - (hoursAgo - 24) / 48;
}

export function FriendsList({ friends = [], userLocation, onSelectFriend, onBack, onSettings, onShowCities, onShowMap, onToggleHiddenFromFriend, ghostMode = false, onInvite, onGoToUserLocation }) {
  const [filter, setFilter] = useState('all'); // 'all', 'nearby', 'stale'
  const [sortBy, setSortBy] = useState('recent'); // 'distance', 'recent', 'name', 'added'
  const [hiddenFromFriends, setHiddenFromFriends] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('whereinworld_hidden_from_friends');
    return saved ? JSON.parse(saved) : {};
  });

  // Toggle hidden from specific friend
  const toggleHiddenFromFriend = (friendId) => {
    const newHidden = {
      ...hiddenFromFriends,
      [friendId]: !hiddenFromFriends[friendId]
    };
    setHiddenFromFriends(newHidden);
    localStorage.setItem('whereinworld_hidden_from_friends', JSON.stringify(newHidden));
    onToggleHiddenFromFriend?.(friendId, !hiddenFromFriends[friendId]);
  };

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
        isNearby: distance !== null && distance <= 50, // Within 50km
        isHiddenFrom: hiddenFromFriends[friend.id] || false
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
      if (sortBy === 'added') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      }
      return 0;
    });

    return result;
  }, [friends, userLocation, filter, sortBy, hiddenFromFriends]);

  const nearbyCount = processedFriends.filter(f => f.isNearby).length;

  return (
    <div className="friends-list-page">
      {/* Header */}
      <div className="friends-header-bar">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="page-title">Friends</h1>
        <div style={{ width: '2.5rem' }} /> {/* Spacer for alignment */}
      </div>

      {/* Filters */}
      <div className="friends-filters-bar">
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Friends ({friends.length})</option>
          <option value="nearby">Nearby ({nearbyCount})</option>
          <option value="stale">Need Update</option>
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Last Location</option>
          <option value="added">Date Added</option>
          <option value="distance">Distance</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Friends list */}
      <div className="friends-scroll">
        {ghostMode ? (
          /* Ghost Mode Active - Show Ghost */
          <div className="friends-empty ghost-mode-empty">
            <div className="ghost-icon-large">
              <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10C30 10 20 30 20 50C20 70 25 90 30 90C35 90 35 80 40 80C45 80 45 90 50 90C55 90 55 80 60 80C65 80 65 90 70 90C75 90 80 70 80 50C80 30 70 10 50 10Z" stroke="var(--accent-lime)" strokeWidth="3" fill="none" />
                <circle cx="38" cy="45" r="5" fill="var(--accent-lime)" />
                <circle cx="62" cy="45" r="5" fill="var(--accent-lime)" />
                <ellipse cx="50" cy="60" rx="6" ry="8" fill="var(--accent-lime)" />
              </svg>
            </div>
            <h3 className="ghost-mode-title">Ghost Mode Active</h3>
            <p className="text-muted text-sm">
              You're invisible! Disable ghost mode to see your friends' locations.
            </p>
          </div>
        ) : friends.length === 0 ? (
          /* No Friends Added - Show Invite */
          <div className="friends-empty">
            <div className="empty-icon">👥</div>
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>No friends yet</p>
            <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
              Invite friends to see where they are in the world
            </p>
            <button className="btn-invite-friends" onClick={onInvite}>
              <span className="material-symbols-outlined">person_add</span>
              Invite Friends
            </button>
          </div>
        ) : processedFriends.length === 0 ? (
          /* Filter returned no results */
          <div className="friends-empty">
            <div className="empty-icon">🔍</div>
            <p>No friends match this filter</p>
            <p className="text-muted text-sm">
              {filter === 'nearby'
                ? 'No friends within 50km'
                : 'Try a different filter'}
            </p>
          </div>
        ) : (
          processedFriends.map(friend => {
            const isGhost = friend.is_ghost || friend.isGhost;
            const isStale = friend.freshness < 0.3;

            return (
              <div
                key={friend.id}
                className={`friend-card ${friend.isNearby ? 'nearby' : ''} ${isGhost ? 'ghost' : ''} ${friend.isHiddenFrom ? 'hidden-from' : ''}`}
              >
                <div className="friend-card-main" onClick={() => onSelectFriend?.(friend)}>
                  <div
                    className="friend-avatar"
                    style={{ opacity: isGhost ? 0.4 : (0.4 + friend.freshness * 0.6) }}
                  >
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" />
                    ) : (
                      friend.displayName?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>

                  <div className="friend-info">
                    <div className="friend-name-row">
                      <span className="friend-name">
                        {friend.displayName || 'Unknown'}
                      </span>
                      {isGhost && <span className="ghost-badge" title="This friend is in ghost mode">👻</span>}
                      {friend.isNearby && <span className="nearby-badge">Nearby</span>}
                    </div>
                    <div className="friend-location">
                      📍 {friend.location?.city || 'Unknown'}{friend.location?.country ? `, ${friend.location.country}` : ''}
                    </div>
                    <div className="friend-meta-row">
                      <span className="friend-added">
                        Added {formatAddedDate(friend.created_at || friend.addedAt)}
                      </span>
                      <span className="friend-updated">
                        • Location {timeAgo(friend.location?.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {friend.distance !== null && (
                    <span className="friend-distance">
                      {friend.distance < 1
                        ? '< 1 km'
                        : friend.distance < 100
                          ? `${Math.round(friend.distance)} km`
                          : `${Math.round(friend.distance / 100) * 100}+ km`}
                    </span>
                  )}
                </div>

                {/* Hide Location Toggle */}
                <div className="friend-card-actions">
                  <label className="hide-toggle">
                    <span className="hide-toggle-label">
                      {friend.isHiddenFrom ? 'Hidden' : 'Visible'}
                    </span>
                    <button
                      className={`toggle-btn ${friend.isHiddenFrom ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHiddenFromFriend(friend.id);
                      }}
                      aria-label={friend.isHiddenFrom ? 'Show location to this friend' : 'Hide location from this friend'}
                    >
                      <span className="toggle-track">
                        <span className="toggle-thumb" />
                      </span>
                    </button>
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab="friends"
        onTabChange={(tab) => {
          if (tab === 'cities') onShowCities?.();
          if (tab === 'map') onShowMap?.();
          if (tab === 'you') onSettings?.();
        }}
        onLocationPress={onGoToUserLocation}
      />

      <style>{`
        .friends-list-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
          max-width: 28rem;
          margin: 0 auto;
          background: var(--background-dark);
          padding-bottom: 6rem;
        }

        .friends-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--background-dark);
        }

        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          background: none;
          border: none;
          color: var(--accent-lime);
          cursor: pointer;
          border-radius: 50%;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-style: italic;
          transform: skewX(-6deg);
          color: white;
          margin: 0;
        }

        .friends-filters-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0 1rem 1rem;
        }

        .filter-select {
          flex: 1;
          padding: 0.625rem 0.75rem;
          background: var(--surface-border);
          border: 2px solid black;
          color: white;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .friends-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0 1rem;
        }

        .friends-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .ghost-mode-empty {
          padding: 4rem 1.5rem;
        }

        .ghost-icon-large {
          margin-bottom: 1.5rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .ghost-mode-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--accent-lime);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .btn-invite-friends {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: var(--accent-lime);
          border: 2px solid black;
          color: black;
          font-weight: 800;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-invite-friends:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(204, 255, 0, 0.3);
        }

        .btn-invite-friends .material-symbols-outlined {
          font-size: 1.25rem;
        }

        .friend-card {
          background: var(--surface-card);
          border: 2px solid black;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }

        .friend-card.nearby {
          border-color: var(--accent-lime);
        }

        .friend-card.hidden-from {
          opacity: 0.6;
        }

        .friend-card-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          cursor: pointer;
        }

        .friend-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-coral), var(--accent-lime));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          color: black;
          flex-shrink: 0;
          overflow: hidden;
        }

        .friend-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .friend-info {
          flex: 1;
          min-width: 0;
        }

        .friend-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.125rem;
        }

        .friend-name {
          font-weight: 700;
          font-size: 0.9375rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ghost-badge {
          font-size: 0.875rem;
        }

        .nearby-badge {
          font-size: 0.625rem;
          font-weight: 700;
          background: var(--accent-lime);
          color: black;
          padding: 0.125rem 0.375rem;
          text-transform: uppercase;
        }

        .friend-location {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }

        .friend-meta-row {
          display: flex;
          gap: 0.375rem;
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .friend-distance {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          flex-shrink: 0;
        }

        .friend-card-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0.5rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.2);
        }

        .hide-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .hide-toggle-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .toggle-btn {
          position: relative;
          width: 2.5rem;
          height: 1.375rem;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .toggle-track {
          display: block;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.2);
          border-radius: 999px;
          transition: background 0.2s ease;
        }

        .toggle-btn.active .toggle-track {
          background: var(--accent-coral);
        }

        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 1rem;
          height: 1rem;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .toggle-btn.active .toggle-thumb {
          transform: translateX(1.125rem);
        }
      `}</style>
    </div>
  );
}
