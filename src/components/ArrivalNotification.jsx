import { useState, useEffect } from 'react';

export function ArrivalNotification({ friend, city, onSayHi, onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
    };

    const handleSayHi = () => {
        onSayHi?.(friend);
        handleDismiss();
    };

    const friendName = friend?.displayName?.split(' ')[0] || 'Friend';
    const avatarUrl = friend?.avatar_url;

    return (
        <div
            className="arrival-notification-overlay"
            style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease-out'
            }}
        >
            {/* Background blur with city image */}
            <div className="arrival-bg">
                <div
                    className="arrival-bg-image"
                    style={{
                        backgroundImage: `url(https://source.unsplash.com/800x600/?${encodeURIComponent(city || 'city')},skyline)`
                    }}
                />
                <div className="arrival-bg-blur" />
            </div>

            {/* Notification Card */}
            <div
                className="arrival-card"
                style={{
                    transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
                    transition: 'transform 0.3s ease-out'
                }}
            >
                {/* Avatar with online indicator */}
                <div className="arrival-avatar-container">
                    <div className="arrival-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={friendName} />
                        ) : (
                            <span className="arrival-avatar-initial">
                                {friendName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="arrival-online-indicator" />
                </div>

                {/* Content */}
                <div className="arrival-content">
                    <h1 className="arrival-title">Arrived</h1>
                </div>

                <div className="arrival-message">
                    <p>{friendName} just landed in {city}!</p>
                </div>

                {/* Buttons */}
                <div className="arrival-buttons">
                    <button className="arrival-btn-primary" onClick={handleSayHi}>
                        <span className="material-symbols-outlined">waving_hand</span>
                        <span>Say Hi</span>
                    </button>
                    <button className="arrival-btn-secondary" onClick={handleDismiss}>
                        Maybe Later
                    </button>
                </div>
            </div>

            <style>{`
                .arrival-notification-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }

                .arrival-bg {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    background: black;
                }

                .arrival-bg-image {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    opacity: 0.4;
                    filter: grayscale(100%) contrast(1.5);
                }

                .arrival-bg-blur {
                    position: absolute;
                    inset: 0;
                    backdrop-filter: blur(4px);
                    background: rgba(0, 0, 0, 0.2);
                }

                .arrival-card {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 310px;
                    background: #ee5b2b;
                    border-radius: 2.5rem;
                    border: 5px solid black;
                    box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
                    padding: 4rem 1.25rem 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .arrival-avatar-container {
                    position: absolute;
                    top: -3.5rem;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .arrival-avatar {
                    width: 7rem;
                    height: 7rem;
                    border-radius: 50%;
                    border: 5px solid black;
                    background: #ee5b2b;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .arrival-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .arrival-avatar-initial {
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: white;
                }

                .arrival-online-indicator {
                    position: absolute;
                    bottom: 0.5rem;
                    right: 0.25rem;
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    background: #34C759;
                    border: 5px solid black;
                }

                .arrival-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                    width: 100%;
                }

                .arrival-title {
                    font-size: 3.2rem;
                    font-weight: 900;
                    font-style: italic;
                    text-transform: uppercase;
                    letter-spacing: -0.05em;
                    line-height: 0.9;
                    color: white;
                    text-shadow: 4px 4px 0px rgba(0,0,0,1);
                    transform: rotate(-2deg);
                }

                .arrival-message {
                    margin-bottom: 2rem;
                    width: 100%;
                }

                .arrival-message p {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: black;
                    line-height: 1.2;
                }

                .arrival-buttons {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    gap: 0.75rem;
                }

                .arrival-btn-primary {
                    display: flex;
                    width: 100%;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    height: 4rem;
                    background: white;
                    color: black;
                    border-radius: 1.5rem;
                    border: 4px solid black;
                    box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
                    cursor: pointer;
                    transition: all 0.1s;
                }

                .arrival-btn-primary:active {
                    transform: translateY(2px);
                    box-shadow: none;
                }

                .arrival-btn-primary .material-symbols-outlined {
                    font-size: 1.875rem;
                    transition: transform 0.2s;
                }

                .arrival-btn-primary:hover .material-symbols-outlined {
                    transform: rotate(12deg);
                }

                .arrival-btn-primary span:last-child {
                    font-size: 1.25rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .arrival-btn-secondary {
                    display: flex;
                    width: 100%;
                    align-items: center;
                    justify-content: center;
                    height: 3rem;
                    background: #222;
                    color: white;
                    border-radius: 1.25rem;
                    border: 4px solid black;
                    cursor: pointer;
                    transition: transform 0.1s;
                }

                .arrival-btn-secondary:active {
                    transform: scale(0.95);
                }

                .arrival-btn-secondary span {
                    font-size: 0.875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
            `}</style>
        </div>
    );
}
