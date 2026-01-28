import { useState, useEffect, useMemo } from 'react';
import { getStreakData } from '../lib/streak';

/**
 * Engagement banners that use behavioral science to encourage location updates.
 * 
 * Techniques used:
 * - Variable reward schedule (new friends since last check)
 * - Social reciprocity (friends can see you)
 * - Loss aversion (location expiring)
 * - Streak gamification (consecutive days)
 */

export function EngagementBanners({
    friends = [],
    userLocation,
    lastLocationUpdate,
    onUpdateLocation
}) {
    const [dismissed, setDismissed] = useState({});
    // Capture current time once when component mounts to avoid impure Date.now() in render
    const [currentTime] = useState(() => Date.now());

    // Calculate time since last update
    const timeSinceUpdate = useMemo(() => {
        if (!lastLocationUpdate) return Infinity;
        return (currentTime - new Date(lastLocationUpdate).getTime()) / (1000 * 60 * 60); // hours
    }, [lastLocationUpdate, currentTime]);

    // Track new friends activity
    useEffect(() => {
        localStorage.setItem('whereinworld_friend_count', friends.length.toString());
    }, [friends.length]);

    // Get streak data
    const streak = getStreakData();

    // Calculate which banners to show
    const banners = [];

    // 1. NEW FRIENDS ALERT (Variable Reward)
    const newFriendsSinceLastCheck = friends.filter(f => {
        const updateTime = f.location?.updatedAt ? new Date(f.location.updatedAt).getTime() : 0;
        const lastCheck = parseInt(localStorage.getItem('whereinworld_last_check') || '0');
        return updateTime > lastCheck;
    }).length;

    if (newFriendsSinceLastCheck > 0 && !dismissed.newFriends) {
        banners.push({
            id: 'newFriends',
            type: 'reward',
            icon: '✨',
            title: `${newFriendsSinceLastCheck} friend${newFriendsSinceLastCheck > 1 ? 's' : ''} updated!`,
            message: 'See where they are now',
            action: null,
            priority: 1
        });
    }

    // 2. LOCATION EXPIRING (Loss Aversion)
    if (timeSinceUpdate > 20 && timeSinceUpdate < 48 && !dismissed.expiring) {
        const hoursLeft = Math.max(0, Math.round(48 - timeSinceUpdate));
        banners.push({
            id: 'expiring',
            type: 'warning',
            icon: '⏰',
            title: `Location expires in ${hoursLeft}h`,
            message: 'Update now to stay visible to friends',
            action: onUpdateLocation,
            actionText: 'Update Location',
            priority: 2
        });
    }

    // 3. LOCATION EXPIRED (Stronger Loss Aversion)
    if (timeSinceUpdate >= 48 && !dismissed.expired) {
        banners.push({
            id: 'expired',
            type: 'danger',
            icon: '👻',
            title: "You've gone invisible!",
            message: 'Friends can no longer see where you are',
            action: onUpdateLocation,
            actionText: 'Update Now',
            priority: 3
        });
    }

    // 4. SOCIAL RECIPROCITY
    const friendsWhoCanSeeYou = friends.filter(f => f.location?.updatedAt).length;
    if (friendsWhoCanSeeYou > 0 && timeSinceUpdate > 24 && !dismissed.reciprocity) {
        banners.push({
            id: 'reciprocity',
            type: 'info',
            icon: '👀',
            title: `${friendsWhoCanSeeYou} friends shared their location`,
            message: "They can't see yours—update to share back",
            action: onUpdateLocation,
            actionText: 'Share Back',
            priority: 2
        });
    }

    // 5. STREAK CELEBRATION
    if (streak.currentStreak >= 3 && !dismissed.streak) {
        banners.push({
            id: 'streak',
            type: 'success',
            icon: '🔥',
            title: `${streak.currentStreak} day streak!`,
            message: streak.currentStreak >= 7
                ? "You're a location-sharing champion!"
                : "Keep the streak going",
            priority: 0
        });
    }

    // 6. NEARBY FRIENDS (Immediate value)
    const nearbyFriends = friends.filter(f => {
        if (!userLocation?.lat || !f.location?.lat) return false;
        const distance = getDistance(userLocation.lat, userLocation.lng, f.location.lat, f.location.lng);
        return distance < 50; // Within 50km
    });

    if (nearbyFriends.length > 0 && !dismissed.nearby) {
        banners.push({
            id: 'nearby',
            type: 'success',
            icon: '📍',
            title: `${nearbyFriends.length} friend${nearbyFriends.length > 1 ? 's' : ''} nearby!`,
            message: nearbyFriends.map(f => f.displayName).slice(0, 2).join(', ') +
                (nearbyFriends.length > 2 ? ` +${nearbyFriends.length - 2} more` : ''),
            priority: 1
        });
    }

    // Sort by priority and show top 2
    const visibleBanners = banners
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 2);

    // Save last check time
    useEffect(() => {
        localStorage.setItem('whereinworld_last_check', Date.now().toString());
    }, []);

    if (visibleBanners.length === 0) return null;

    return (
        <div className="engagement-banners">
            {visibleBanners.map(banner => (
                <div
                    key={banner.id}
                    className={`engagement-banner banner-${banner.type} fade-in`}
                >
                    <span className="banner-icon">{banner.icon}</span>
                    <div className="banner-content">
                        <div className="banner-title">{banner.title}</div>
                        <div className="banner-message">{banner.message}</div>
                    </div>
                    {banner.action && (
                        <button
                            className="btn btn-primary banner-action"
                            onClick={banner.action}
                        >
                            {banner.actionText}
                        </button>
                    )}
                    <button
                        className="banner-dismiss"
                        onClick={() => setDismissed(d => ({ ...d, [banner.id]: true }))}
                    >
                        ×
                    </button>
                </div>
            ))}

            <style>{`
        .engagement-banners {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
        }
        
        .engagement-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: var(--radius-md);
          position: relative;
        }
        
        .banner-reward {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        
        .banner-warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .banner-danger {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .banner-info {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .banner-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .banner-icon {
          font-size: 28px;
          flex-shrink: 0;
        }
        
        .banner-content {
          flex: 1;
          min-width: 0;
        }
        
        .banner-title {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 2px;
        }
        
        .banner-message {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .banner-action {
          flex-shrink: 0;
          padding: 8px 16px;
          font-size: 13px;
        }
        
        .banner-dismiss {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          opacity: 0.5;
          transition: opacity var(--transition-fast);
        }
        
        .banner-dismiss:hover {
          opacity: 1;
        }
      `}</style>
        </div>
    );
}

// Helper function for distance calculation
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
