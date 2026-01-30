import { useState, useEffect } from 'react';

/**
 * FriendJoinedNotification - Toast notification showing when a new friend joins via invite
 */
export function FriendJoinedNotification({ friend, onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 50);

        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300); // Wait for animation to complete
        }, 5000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const friendName = friend?.displayName || friend?.display_name || 'A friend';
    const friendCity = friend?.location?.city || 'somewhere new';

    return (
        <div
            className="fixed top-4 left-4 right-4 z-50"
            style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.3s ease-out'
            }}
        >
            <div
                className="card-hard mx-auto"
                style={{
                    maxWidth: '24rem',
                    padding: '1rem 1.25rem',
                    background: 'var(--accent-lime)',
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}
                onClick={onDismiss}
            >
                {/* Celebration icon */}
                <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'black',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                }}>
                    🎉
                </div>

                {/* Message */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        color: 'black',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                    }}>
                        {friendName} joined!
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'rgba(0,0,0,0.7)',
                        marginTop: '0.125rem'
                    }}>
                        They're in {friendCity} — say hi! 👋
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsVisible(false);
                        setTimeout(onDismiss, 300);
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'black',
                        opacity: 0.5
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

/**
 * Hook to track new friends since last check
 * Stores last known friend count in localStorage and detects new additions
 */
export function useNewFriendNotifications(friends, enabled = true) {
    const [newFriends, setNewFriends] = useState([]);
    const [previousFriendIds, setPreviousFriendIds] = useState(() => {
        const stored = localStorage.getItem('wiw_known_friend_ids');
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        if (!enabled || !friends?.length) return;

        const currentFriendIds = friends.map(f => f.id);

        // First load - just store the current friends
        if (previousFriendIds === null) {
            localStorage.setItem('wiw_known_friend_ids', JSON.stringify(currentFriendIds));
            setPreviousFriendIds(currentFriendIds);
            return;
        }

        // Find new friends (in current but not in previous)
        const newFriendIds = currentFriendIds.filter(id => !previousFriendIds.includes(id));

        if (newFriendIds.length > 0) {
            const newFriendsData = friends.filter(f => newFriendIds.includes(f.id));
            setNewFriends(prev => [...newFriendsData, ...prev].slice(0, 5)); // Keep max 5

            // Update stored friend IDs
            localStorage.setItem('wiw_known_friend_ids', JSON.stringify(currentFriendIds));
            setPreviousFriendIds(currentFriendIds);
        }
    }, [friends, previousFriendIds, enabled]);

    const dismissNotification = (friendId) => {
        setNewFriends(prev => prev.filter(f => f.id !== friendId));
    };

    const dismissAll = () => {
        setNewFriends([]);
    };

    return { newFriends, dismissNotification, dismissAll };
}
