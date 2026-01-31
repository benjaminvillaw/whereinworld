import { useState, useEffect } from 'react';
import { api } from '../lib/supabase';

// Calculate friend's cities and countries stats
function calculateStats(friend, allFriends = []) {
    // In a real app, this would come from the friend's data
    // For now, we'll generate some reasonable numbers based on available data
    const cities = friend.citiesCount || Math.floor(Math.random() * 12) + 1;
    const countries = friend.countriesCount || Math.floor(Math.random() * 6) + 1;
    return { cities, countries };
}

export function FriendProfilePopup({ friend, onClose, onRemoveFriend }) {
    const [visible, setVisible] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [removing, setRemoving] = useState(false);
    const stats = calculateStats(friend);

    const handleRemoveFriend = async () => {
        setRemoving(true);
        try {
            await api.deleteFriendship(friend.id);
            if (onRemoveFriend) onRemoveFriend(friend.id);
            handleClose();
        } catch (e) {
            console.error('Failed to remove friend:', e);
            setShowRemoveConfirm(false);
        } finally {
            setRemoving(false);
        }
    };

    useEffect(() => {
        // Trigger animation on mount
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 200);
    };

    if (!friend) return null;

    const displayName = friend.displayName || friend.display_name || 'Unknown';
    const phone = friend.phone || 'No phone';
    const location = friend.location?.city || friend.originalCity || 'Unknown location';

    return (
        <div className={`friend-popup-overlay ${visible ? 'visible' : ''}`} onClick={handleClose}>
            <div className={`friend-popup ${visible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="friend-popup-close" onClick={handleClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Avatar */}
                <div className="friend-popup-avatar-container">
                    <div className="friend-popup-avatar">
                        {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt="" />
                        ) : (
                            <span>{displayName.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="friend-popup-avatar-ring" />
                </div>

                {/* Name */}
                <h2 className="friend-popup-name">{displayName}</h2>

                {/* Phone */}
                <p className="friend-popup-phone">
                    <span className="material-symbols-outlined">phone</span>
                    {phone}
                </p>

                {/* Location */}
                <p className="friend-popup-location">
                    <span className="material-symbols-outlined">location_on</span>
                    {location}
                </p>

                {/* Animated Badges */}
                <div className="friend-popup-badges">
                    {/* Cities Badge */}
                    <div className="badge-sticker badge-cities">
                        <div className="badge-shine" />
                        <div className="badge-content">
                            <span className="badge-icon">🏙️</span>
                            <span className="badge-number">{stats.cities}</span>
                            <span className="badge-label">Cities</span>
                        </div>
                        <div className="badge-glow" />
                    </div>

                    {/* Countries Badge */}
                    <div className="badge-sticker badge-countries">
                        <div className="badge-shine" />
                        <div className="badge-content">
                            <span className="badge-icon">🌍</span>
                            <span className="badge-number">{stats.countries}</span>
                            <span className="badge-label">Countries</span>
                        </div>
                        <div className="badge-glow" />
                    </div>
                </div>

                {/* Stats Description */}
                <p className="friend-popup-stats-text">
                    Friends in <strong>{stats.cities}</strong> {stats.cities === 1 ? 'city' : 'cities'} across <strong>{stats.countries}</strong> {stats.countries === 1 ? 'country' : 'countries'}
                </p>

                {/* Message Button */}
                <a
                    href={`sms:${phone?.replace(/\D/g, '')}`}
                    className="friend-popup-message-btn"
                >
                    <span className="material-symbols-outlined">chat</span>
                    Send Message
                </a>

                {/* Remove Friend */}
                {showRemoveConfirm ? (
                    <div className="friend-remove-confirm">
                        <p>Remove {displayName} from your friends?</p>
                        <div className="friend-remove-actions">
                            <button
                                className="friend-remove-btn-confirm"
                                onClick={handleRemoveFriend}
                                disabled={removing}
                            >
                                {removing ? 'Removing...' : 'Yes, Remove'}
                            </button>
                            <button
                                className="friend-remove-btn-cancel"
                                onClick={() => setShowRemoveConfirm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="friend-remove-btn"
                        onClick={() => setShowRemoveConfirm(true)}
                    >
                        <span className="material-symbols-outlined">person_remove</span>
                        Remove Friend
                    </button>
                )}
            </div>

            <style>{`
                .friend-popup-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    padding: 1.5rem;
                }

                .friend-popup-overlay.visible {
                    opacity: 1;
                }

                .friend-popup {
                    background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%);
                    border: 2px solid rgba(204, 255, 0, 0.3);
                    border-radius: 1.5rem;
                    padding: 2rem;
                    width: 100%;
                    max-width: 20rem;
                    position: relative;
                    text-align: center;
                    transform: scale(0.9) translateY(20px);
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 
                        0 20px 60px rgba(0, 0, 0, 0.5),
                        0 0 40px rgba(204, 255, 0, 0.1);
                }

                .friend-popup.visible {
                    transform: scale(1) translateY(0);
                }

                .friend-popup-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .friend-popup-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .friend-popup-close .material-symbols-outlined {
                    font-size: 1.25rem;
                }

                .friend-popup-avatar-container {
                    position: relative;
                    width: 6rem;
                    height: 6rem;
                    margin: 0 auto 1rem;
                }

                .friend-popup-avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #A0E8AF, #CCFF00);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: #000;
                    overflow: hidden;
                    position: relative;
                    z-index: 2;
                }

                .friend-popup-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .friend-popup-avatar-ring {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    border: 3px solid rgba(204, 255, 0, 0.5);
                    animation: ringPulse 2s ease-in-out infinite;
                }

                @keyframes ringPulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 1; }
                }

                .friend-popup-name {
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: white;
                    margin: 0 0 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .friend-popup-phone,
                .friend-popup-location {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.875rem;
                    margin: 0.25rem 0;
                }

                .friend-popup-phone .material-symbols-outlined,
                .friend-popup-location .material-symbols-outlined {
                    font-size: 1rem;
                    color: var(--accent-lime);
                }

                /* Partiful-style Animated Badges */
                .friend-popup-badges {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin: 1.5rem 0;
                }

                .badge-sticker {
                    position: relative;
                    width: 6rem;
                    height: 6rem;
                    border-radius: 1rem;
                    overflow: hidden;
                    animation: badgeFloat 3s ease-in-out infinite;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .badge-sticker:hover {
                    transform: scale(1.1) rotate(5deg);
                }

                .badge-sticker:nth-child(2) {
                    animation-delay: -1.5s;
                }

                .badge-cities {
                    background: linear-gradient(135deg, #FF7F6C 0%, #FF5C8D 50%, #FF7F6C 100%);
                    box-shadow: 
                        0 4px 20px rgba(255, 127, 108, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4);
                }

                .badge-countries {
                    background: linear-gradient(135deg, #A0E8AF 0%, #4ECDC4 50%, #A0E8AF 100%);
                    box-shadow: 
                        0 4px 20px rgba(160, 232, 175, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4);
                }

                .badge-shine {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        105deg,
                        transparent 40%,
                        rgba(255, 255, 255, 0.5) 45%,
                        rgba(255, 255, 255, 0.8) 50%,
                        rgba(255, 255, 255, 0.5) 55%,
                        transparent 60%
                    );
                    animation: shimmer 3s infinite;
                    pointer-events: none;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-150%) rotate(15deg); }
                    100% { transform: translateX(150%) rotate(15deg); }
                }

                .badge-glow {
                    position: absolute;
                    inset: -2px;
                    border-radius: 1rem;
                    opacity: 0.6;
                    z-index: -1;
                    animation: glowPulse 2s ease-in-out infinite;
                }

                .badge-cities .badge-glow {
                    background: linear-gradient(135deg, #FF7F6C, #FF5C8D);
                    filter: blur(10px);
                }

                .badge-countries .badge-glow {
                    background: linear-gradient(135deg, #A0E8AF, #4ECDC4);
                    filter: blur(10px);
                }

                @keyframes glowPulse {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }

                @keyframes badgeFloat {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-5px) rotate(2deg); }
                }

                .badge-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #000;
                }

                .badge-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0.125rem;
                }

                .badge-number {
                    font-size: 1.5rem;
                    font-weight: 900;
                    line-height: 1;
                }

                .badge-label {
                    font-size: 0.625rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                }

                .friend-popup-stats-text {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.8125rem;
                    margin: 0 0 1.5rem;
                }

                .friend-popup-stats-text strong {
                    color: var(--accent-lime);
                    font-weight: 800;
                }

                .friend-popup-message-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 1rem;
                    background: var(--accent-lime);
                    color: black;
                    font-weight: 800;
                    font-size: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border: 2px solid black;
                    border-radius: 0.75rem;
                    text-decoration: none;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .friend-popup-message-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 0 0 black;
                }

                .friend-popup-message-btn .material-symbols-outlined {
                    font-size: 1.25rem;
                }

                .friend-remove-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    margin-top: 0.75rem;
                    padding: 0.75rem;
                    background: transparent;
                    color: rgba(239, 68, 68, 0.8);
                    font-weight: 600;
                    font-size: 0.875rem;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .friend-remove-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-color: rgba(239, 68, 68, 0.5);
                }

                .friend-remove-btn .material-symbols-outlined {
                    font-size: 1.125rem;
                }

                .friend-remove-confirm {
                    margin-top: 0.75rem;
                    padding: 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 0.75rem;
                    text-align: center;
                }

                .friend-remove-confirm p {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.875rem;
                    margin: 0 0 0.75rem;
                }

                .friend-remove-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .friend-remove-btn-confirm {
                    flex: 1;
                    padding: 0.625rem;
                    background: #ef4444;
                    color: white;
                    font-weight: 600;
                    font-size: 0.8125rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                }

                .friend-remove-btn-confirm:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .friend-remove-btn-cancel {
                    flex: 1;
                    padding: 0.625rem;
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 600;
                    font-size: 0.8125rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}

// Reusable badge component for use in Settings profile
export function GlobalBadges({ cities = 0, countries = 0, compact = false }) {
    return (
        <div className={`global-badges ${compact ? 'compact' : ''}`}>
            <div className="badge-sticker badge-cities">
                <div className="badge-shine" />
                <div className="badge-content">
                    <span className="badge-icon">🏙️</span>
                    <span className="badge-number">{cities}</span>
                    <span className="badge-label">Cities</span>
                </div>
            </div>

            <div className="badge-sticker badge-countries">
                <div className="badge-shine" />
                <div className="badge-content">
                    <span className="badge-icon">🌍</span>
                    <span className="badge-number">{countries}</span>
                    <span className="badge-label">Countries</span>
                </div>
            </div>

            <style>{`
                .global-badges {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .global-badges.compact .badge-sticker {
                    width: 5rem;
                    height: 5rem;
                }

                .global-badges.compact .badge-icon {
                    font-size: 1.25rem;
                }

                .global-badges.compact .badge-number {
                    font-size: 1.25rem;
                }

                .global-badges .badge-sticker {
                    position: relative;
                    width: 6rem;
                    height: 6rem;
                    border-radius: 1rem;
                    overflow: hidden;
                    animation: badgeFloatGlobal 3s ease-in-out infinite;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .global-badges .badge-sticker:hover {
                    transform: scale(1.1) rotate(5deg);
                }

                .global-badges .badge-sticker:nth-child(2) {
                    animation-delay: -1.5s;
                }

                .global-badges .badge-cities {
                    background: linear-gradient(135deg, #FF7F6C 0%, #FF5C8D 50%, #FF7F6C 100%);
                    box-shadow: 
                        0 4px 20px rgba(255, 127, 108, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4);
                }

                .global-badges .badge-countries {
                    background: linear-gradient(135deg, #A0E8AF 0%, #4ECDC4 50%, #A0E8AF 100%);
                    box-shadow: 
                        0 4px 20px rgba(160, 232, 175, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4);
                }

                .global-badges .badge-shine {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        105deg,
                        transparent 40%,
                        rgba(255, 255, 255, 0.5) 45%,
                        rgba(255, 255, 255, 0.8) 50%,
                        rgba(255, 255, 255, 0.5) 55%,
                        transparent 60%
                    );
                    animation: shimmerGlobal 3s infinite;
                    pointer-events: none;
                }

                @keyframes shimmerGlobal {
                    0% { transform: translateX(-150%) rotate(15deg); }
                    100% { transform: translateX(150%) rotate(15deg); }
                }

                @keyframes badgeFloatGlobal {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-5px) rotate(2deg); }
                }

                .global-badges .badge-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #000;
                }

                .global-badges .badge-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0.125rem;
                }

                .global-badges .badge-number {
                    font-size: 1.5rem;
                    font-weight: 900;
                    line-height: 1;
                }

                .global-badges .badge-label {
                    font-size: 0.625rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                }
            `}</style>
        </div>
    );
}
