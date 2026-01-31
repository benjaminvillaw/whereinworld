import { useState } from 'react';

export function LocationOnboarding({ onRequestLocation }) {
    const [isRequesting, setIsRequesting] = useState(false);

    const handleEnableLocation = async () => {
        setIsRequesting(true);
        await onRequestLocation();
        setIsRequesting(false);
    };

    return (
        <div className="onboarding-screen">
            {/* Animated Globe */}
            <div className="onboarding-globe">
                <div className="globe-ring globe-ring-1" />
                <div className="globe-ring globe-ring-2" />
                <div className="globe-ring globe-ring-3" />
                <div className="globe-icon">🌍</div>
                <div className="globe-pins">
                    <span className="globe-pin pin-1">📍</span>
                    <span className="globe-pin pin-2">📍</span>
                    <span className="globe-pin pin-3">📍</span>
                </div>
            </div>

            {/* Content */}
            <h1 className="onboarding-title">
                See where your friends are<br />
                <span className="highlight">around the world</span>
            </h1>

            <p className="onboarding-subtitle">
                Share your location to connect with friends in any city
            </p>

            {/* Benefits */}
            <div className="onboarding-benefits">
                <div className="benefit-item">
                    <span className="benefit-icon">👋</span>
                    <span className="benefit-text">Know when friends are nearby</span>
                </div>
                <div className="benefit-item">
                    <span className="benefit-icon">✈️</span>
                    <span className="benefit-text">Plan meetups across cities</span>
                </div>
                <div className="benefit-item">
                    <span className="benefit-icon">🔒</span>
                    <span className="benefit-text">Only visible to your friends</span>
                </div>
            </div>

            {/* CTA Button */}
            <button
                className="onboarding-cta"
                onClick={handleEnableLocation}
                disabled={isRequesting}
            >
                {isRequesting ? (
                    <>
                        <span className="spinner" />
                        Requesting...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">my_location</span>
                        Enable Location
                    </>
                )}
            </button>

            <p className="onboarding-privacy">
                Your location is only shared with friends you add.<br />
                You can turn this off anytime in settings.
            </p>

            <style>{`
                .onboarding-screen {
                    position: fixed;
                    inset: 0;
                    background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    z-index: 1000;
                    text-align: center;
                }

                .onboarding-globe {
                    position: relative;
                    width: 10rem;
                    height: 10rem;
                    margin-bottom: 2rem;
                }

                .globe-icon {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 5rem;
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .globe-ring {
                    position: absolute;
                    inset: -10px;
                    border: 2px solid rgba(204, 255, 0, 0.3);
                    border-radius: 50%;
                    animation: ringExpand 3s ease-in-out infinite;
                }

                .globe-ring-2 {
                    animation-delay: -1s;
                }

                .globe-ring-3 {
                    animation-delay: -2s;
                }

                @keyframes ringExpand {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }

                .globe-pins {
                    position: absolute;
                    inset: 0;
                }

                .globe-pin {
                    position: absolute;
                    font-size: 1.25rem;
                    animation: pinPop 2s ease-in-out infinite;
                }

                .pin-1 { top: 10%; left: 20%; animation-delay: 0s; }
                .pin-2 { top: 30%; right: 15%; animation-delay: 0.5s; }
                .pin-3 { bottom: 20%; left: 30%; animation-delay: 1s; }

                @keyframes pinPop {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }

                .onboarding-title {
                    font-size: 1.75rem;
                    font-weight: 900;
                    color: white;
                    margin: 0 0 0.75rem;
                    line-height: 1.2;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .onboarding-title .highlight {
                    color: var(--accent-lime);
                }

                .onboarding-subtitle {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0 0 2rem;
                    max-width: 20rem;
                }

                .onboarding-benefits {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                }

                .benefit-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.75rem 1.25rem;
                    border-radius: 2rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .benefit-icon {
                    font-size: 1.25rem;
                }

                .benefit-text {
                    font-size: 0.9375rem;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                }

                .onboarding-cta {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    width: 100%;
                    max-width: 20rem;
                    padding: 1.25rem 2rem;
                    background: var(--accent-lime);
                    color: black;
                    font-size: 1.125rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border: 3px solid black;
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .onboarding-cta:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 0 0 black;
                }

                .onboarding-cta:disabled {
                    opacity: 0.7;
                    cursor: wait;
                }

                .onboarding-cta .material-symbols-outlined {
                    font-size: 1.5rem;
                }

                .spinner {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 3px solid rgba(0, 0, 0, 0.2);
                    border-top-color: black;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .onboarding-privacy {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: 1.5rem;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
