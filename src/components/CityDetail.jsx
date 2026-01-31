// City images - curated high quality images for popular cities, with dynamic fallback
import { useState } from 'react';
import { FriendProfilePopup } from './FriendProfilePopup';

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

// Avatar background colors
const AVATAR_COLORS = ['#A0E8AF', '#FF7F6C', '#C4A7E7', '#FFEB3B', '#FF90B3', '#CCFF00'];

function getCityImage(cityName) {
    const key = cityName?.toLowerCase() || 'default';

    // Check if we have a curated image for this city
    if (CITY_IMAGES[key]) {
        return CITY_IMAGES[key];
    }

    // Use Unsplash Source API as dynamic fallback for any city
    const encodedCity = encodeURIComponent(cityName + ' city skyline');
    return `https://source.unsplash.com/800x600/?${encodedCity}`;
}

// Format relative time
function timeAgo(dateString) {
    if (!dateString) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
}

// Check if recently active (within 10 minutes)
function isActive(dateString) {
    if (!dateString) return false;
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    return seconds < 600; // 10 minutes
}

export function CityDetail({ city, onBack }) {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    if (!city) return null;

    const { city: cityName, country, friends = [] } = city;

    // Create SMS deep link for a single phone
    const getSmsLink = (phone, message = '') => {
        const cleanPhone = phone?.replace(/\D/g, '') || '';
        const encodedMsg = encodeURIComponent(message);
        return `sms:${cleanPhone}${message ? `&body=${encodedMsg}` : ''}`;
    };

    // Create group SMS link (works on iOS)
    const getGroupSmsLink = () => {
        const phones = friends
            .map(f => (f.phone || '').replace(/\D/g, ''))
            .filter(p => p.length >= 10)
            .join(',');
        const message = `Hey! Who's around in ${cityName}? 📍`;
        return `sms:${phones}&body=${encodeURIComponent(message)}`;
    };
    return (
        <div className="city-detail">
            {/* Hero Image */}
            <div className="city-hero">
                <img
                    src={getCityImage(cityName)}
                    alt={cityName}
                    className="city-hero-image"
                />

                {/* Wavy mask at bottom */}
                <div className="city-hero-mask" style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '8rem',
                    background: 'var(--accent-lavender)',
                    clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 85% 25%, 70% 0%, 55% 45%, 40% 10%, 25% 60%, 10% 20%, 0% 70%)'
                }}></div>

                {/* Header */}
                <header className="city-hero-header">
                    <button
                        className="city-hero-btn"
                        onClick={onBack}
                    >
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>

                    <div className="city-hero-title">
                        <h1>{cityName}</h1>
                        <span style={{
                            background: 'var(--accent-lime)',
                            color: 'black',
                            padding: '0.375rem 1rem',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            border: '2px solid black',
                            boxShadow: '2px 2px 0 0 rgba(0,0,0,0.5)'
                        }}>
                            {friends.length} Friend{friends.length !== 1 ? 's' : ''} To Meet
                        </span>
                    </div>

                    <button className="city-hero-btn">
                        <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                </header>
            </div>

            {/* Friends List */}
            <main className="city-friends-list">
                <div className="flex items-center justify-between mb-6" style={{ position: 'relative' }}>
                    <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.4)' }}>
                        Friends Nearby {filter !== 'all' && `(${filter})`}
                    </h3>
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        style={{
                            background: filter !== 'all' ? 'var(--accent-lime)' : 'transparent',
                            border: filter !== 'all' ? '2px solid black' : 'none',
                            borderRadius: '0.5rem',
                            padding: '0.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ color: filter !== 'all' ? 'black' : 'rgba(0,0,0,0.3)' }}>
                            filter_list
                        </span>
                    </button>

                    {/* Filter Dropdown Menu */}
                    {showFilterMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '2rem',
                            right: 0,
                            background: 'white',
                            border: '2px solid black',
                            borderRadius: '0.5rem',
                            boxShadow: '4px 4px 0 0 rgba(0,0,0,1)',
                            zIndex: 100,
                            minWidth: '10rem',
                            overflow: 'hidden'
                        }}>
                            {[
                                { value: 'all', label: 'All Friends', icon: 'group' },
                                { value: 'active', label: 'Active Now', icon: 'circle', iconColor: '#22c55e' },
                                { value: 'inactive', label: 'Inactive', icon: 'circle', iconColor: '#9ca3af' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => { setFilter(option.value); setShowFilterMenu(false); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: filter === option.value ? 'var(--accent-lime)' : 'white',
                                        border: 'none',
                                        borderBottom: '1px solid rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: filter === option.value ? 700 : 500,
                                        textAlign: 'left'
                                    }}
                                >
                                    <span className="material-symbols-outlined filled" style={{
                                        fontSize: '1rem',
                                        color: option.iconColor || 'black'
                                    }}>
                                        {option.icon}
                                    </span>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {friends
                        .filter((friend) => {
                            const active = isActive(friend.updatedAt || friend.location?.updatedAt);
                            if (filter === 'active') return active;
                            if (filter === 'inactive') return !active;
                            return true; // 'all'
                        })
                        .map((friend, index) => {
                            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                            const active = isActive(friend.updatedAt || friend.location?.updatedAt);
                            const locationName = friend.location?.neighborhood || friend.originalCity || cityName;

                            return (
                                <div
                                    key={friend.id}
                                    className="friend-item animate-stagger"
                                    style={{ opacity: active ? 1 : 0.8, cursor: 'pointer' }}
                                    onClick={() => setSelectedFriend(friend)}
                                >
                                    <div className={`friend-item-avatar ${active ? 'avatar-status' : 'avatar-status offline'}`}>
                                        <div className="avatar avatar-lg" style={{ background: friend.avatar_url ? 'transparent' : avatarColor }}>
                                            {friend.avatar_url ? (
                                                <img src={friend.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                            ) : (
                                                friend.displayName?.charAt(0)?.toUpperCase() ||
                                                friend.display_name?.charAt(0)?.toUpperCase() || '?'
                                            )}
                                        </div>
                                    </div>

                                    <div className="friend-item-info">
                                        <p className="friend-item-name">
                                            {friend.displayName || friend.display_name || 'Unknown'}
                                        </p>
                                        <p className="friend-item-location">
                                            📍 {locationName} • {timeAgo(friend.updatedAt || friend.location?.updatedAt)}
                                        </p>
                                    </div>

                                    <a
                                        href={getSmsLink(friend.phone)}
                                        className="friend-item-action"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <span className="material-symbols-outlined" style={{
                                            fontSize: '1.25rem',
                                            color: 'var(--primary)'
                                        }}>
                                            chat
                                        </span>
                                    </a>
                                </div>
                            );
                        })}
                </div>
            </main>

            {/* Message Group CTA */}
            <div className="city-cta">
                <a
                    href={getGroupSmsLink()}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        height: '4rem',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-xl)'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>chat_bubble</span>
                    Message Group
                </a>
            </div>

            {/* Decorative Blurs */}
            <div className="city-blur city-blur-1"></div>
            <div className="city-blur city-blur-2"></div>

            <style>{`
                .city-detail {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    width: 100%;
                    max-width: 28rem;
                    margin: 0 auto;
                    background: var(--accent-lavender);
                    overflow-x: hidden;
                }

                .city-hero {
                    position: relative;
                    height: 24rem;
                    width: 100%;
                    overflow: hidden;
                }

                .city-hero-image {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .city-hero-header {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 3rem 1.5rem 1.5rem;
                }

                .city-hero-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.75rem;
                    height: 2.75rem;
                    border-radius: var(--radius-full);
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .city-hero-title {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .city-hero-title h1 {
                    font-size: 1.875rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    color: white;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .city-friends-list {
                    flex: 1;
                    padding: 0 1.5rem;
                    margin-top: -2rem;
                    position: relative;
                    z-index: 10;
                    padding-bottom: 8rem;
                }

                .city-cta {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 28rem;
                    padding: 1.5rem;
                    background: linear-gradient(to top, var(--accent-lavender) 50%, transparent);
                    z-index: 30;
                }

                .city-blur {
                    position: fixed;
                    width: 10rem;
                    height: 10rem;
                    border-radius: var(--radius-full);
                    filter: blur(3rem);
                    pointer-events: none;
                }

                .city-blur-1 {
                    top: 50%;
                    right: 0;
                    transform: translateX(4rem);
                    background: var(--accent-mint);
                    opacity: 0.3;
                }

                .city-blur-2 {
                    bottom: 25%;
                    left: 0;
                    transform: translateX(-4rem);
                    background: var(--primary);
                    opacity: 0.2;
                }
            `}</style>

            {/* Friend Profile Popup */}
            {selectedFriend && (
                <FriendProfilePopup
                    friend={selectedFriend}
                    onClose={() => setSelectedFriend(null)}
                    networkStats={{ cities: 1, countries: 1 }}
                />
            )}
        </div>
    );
}
