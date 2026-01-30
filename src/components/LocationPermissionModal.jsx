import { useState } from 'react';

export function LocationPermissionModal({
    isOpen,
    onClose,
    onRequestLocation,
    permissionState,
    error,
    loading
}) {
    const [showingDeniedHelp, setShowingDeniedHelp] = useState(false);

    if (!isOpen) return null;

    const isDenied = permissionState === 'denied';
    const isUnavailable = error?.includes('unavailable');
    const isTimeout = error?.includes('timed out');

    // Different content based on state
    const getContent = () => {
        if (isDenied || showingDeniedHelp) {
            return {
                icon: 'block',
                title: 'Location Blocked',
                message: 'Your browser has blocked location access for this app.',
                subMessage: 'To enable location, you\'ll need to update your browser settings:',
                steps: [
                    'Click the lock/info icon in your browser\'s address bar',
                    'Find "Location" in the permissions list',
                    'Change it from "Block" to "Allow"',
                    'Refresh the page'
                ],
                showRetry: false,
                showOpenSettings: true
            };
        }

        if (isUnavailable) {
            return {
                icon: 'location_off',
                title: 'Location Unavailable',
                message: 'We couldn\'t determine your location. This might be because:',
                bullets: [
                    'Location services are turned off on your device',
                    'You\'re in an area with poor GPS/network coverage',
                    'Your browser doesn\'t support location services'
                ],
                showRetry: true
            };
        }

        if (isTimeout) {
            return {
                icon: 'schedule',
                title: 'Location Request Timed Out',
                message: 'It\'s taking too long to find your location. Please try again.',
                showRetry: true
            };
        }

        // Default: Initial request
        return {
            icon: 'my_location',
            title: 'Share Your Location',
            message: 'Where In World needs your location to show you on the map and connect you with friends nearby.',
            showRetry: false,
            showRequest: true
        };
    };

    const content = getContent();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content location-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="modal-close" onClick={onClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Icon */}
                <div className="location-modal-icon">
                    <span className="material-symbols-outlined">{content.icon}</span>
                </div>

                {/* Title */}
                <h2 className="location-modal-title">{content.title}</h2>

                {/* Message */}
                <p className="location-modal-message">{content.message}</p>

                {/* Sub-message */}
                {content.subMessage && (
                    <p className="location-modal-submessage">{content.subMessage}</p>
                )}

                {/* Steps (for denied state) */}
                {content.steps && (
                    <ol className="location-modal-steps">
                        {content.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>
                )}

                {/* Bullets (for unavailable state) */}
                {content.bullets && (
                    <ul className="location-modal-bullets">
                        {content.bullets.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                        ))}
                    </ul>
                )}

                {/* Privacy notice */}
                <div className="location-modal-privacy">
                    <span className="material-symbols-outlined">shield</span>
                    <p>
                        <strong>Your privacy matters.</strong> We only record your city-level location,
                        not your exact address. Your coordinates are also fuzzed for additional privacy.
                    </p>
                </div>

                {/* Actions */}
                <div className="location-modal-actions">
                    {content.showRequest && (
                        <button
                            className="btn-primary"
                            onClick={onRequestLocation}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined spinning">sync</span>
                                    Finding Location...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">my_location</span>
                                    Enable Location
                                </>
                            )}
                        </button>
                    )}

                    {content.showRetry && (
                        <button
                            className="btn-primary"
                            onClick={onRequestLocation}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined spinning">sync</span>
                                    Trying Again...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">refresh</span>
                                    Try Again
                                </>
                            )}
                        </button>
                    )}

                    {content.showOpenSettings && (
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                // Can't programmatically open browser settings, but we can guide user
                                alert('Please click the lock/site info icon in your browser\'s address bar to change location permissions.');
                            }}
                        >
                            <span className="material-symbols-outlined">settings</span>
                            How to Enable
                        </button>
                    )}

                    <button className="btn-ghost" onClick={onClose}>
                        {isDenied ? 'Continue Without Location' : 'Maybe Later'}
                    </button>
                </div>

                <style>{`
                    .location-modal {
                        max-width: 400px;
                        text-align: center;
                        padding: 2rem;
                    }

                    .location-modal-icon {
                        width: 5rem;
                        height: 5rem;
                        background: var(--accent-lime);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1.5rem;
                        border: 3px solid black;
                    }

                    .location-modal-icon .material-symbols-outlined {
                        font-size: 2.5rem;
                        color: black;
                    }

                    .location-modal-title {
                        font-size: 1.5rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        margin-bottom: 0.75rem;
                        color: white;
                    }

                    .location-modal-message {
                        font-size: 0.95rem;
                        color: rgba(255, 255, 255, 0.8);
                        line-height: 1.5;
                        margin-bottom: 1rem;
                    }

                    .location-modal-submessage {
                        font-size: 0.875rem;
                        color: rgba(255, 255, 255, 0.6);
                        margin-bottom: 0.75rem;
                    }

                    .location-modal-steps {
                        text-align: left;
                        padding-left: 1.5rem;
                        margin-bottom: 1.5rem;
                    }

                    .location-modal-steps li {
                        font-size: 0.875rem;
                        color: rgba(255, 255, 255, 0.7);
                        margin-bottom: 0.5rem;
                        line-height: 1.4;
                    }

                    .location-modal-bullets {
                        text-align: left;
                        padding-left: 1.25rem;
                        margin-bottom: 1.5rem;
                    }

                    .location-modal-bullets li {
                        font-size: 0.875rem;
                        color: rgba(255, 255, 255, 0.7);
                        margin-bottom: 0.375rem;
                    }

                    .location-modal-privacy {
                        display: flex;
                        align-items: flex-start;
                        gap: 0.75rem;
                        background: rgba(204, 255, 0, 0.1);
                        border: 1px solid rgba(204, 255, 0, 0.3);
                        border-radius: 8px;
                        padding: 1rem;
                        margin-bottom: 1.5rem;
                        text-align: left;
                    }

                    .location-modal-privacy .material-symbols-outlined {
                        color: var(--accent-lime);
                        font-size: 1.25rem;
                        flex-shrink: 0;
                    }

                    .location-modal-privacy p {
                        font-size: 0.8rem;
                        color: rgba(255, 255, 255, 0.8);
                        line-height: 1.5;
                        margin: 0;
                    }

                    .location-modal-privacy strong {
                        color: var(--accent-lime);
                    }

                    .location-modal-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .location-modal-actions .btn-primary {
                        width: 100%;
                        padding: 1rem;
                        background: var(--accent-lime);
                        color: black;
                        font-weight: 700;
                        font-size: 0.9rem;
                        text-transform: uppercase;
                        border: 3px solid black;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        cursor: pointer;
                        transition: transform 0.1s, box-shadow 0.1s;
                    }

                    .location-modal-actions .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 0 black;
                    }

                    .location-modal-actions .btn-primary:active {
                        transform: translateY(0);
                        box-shadow: none;
                    }

                    .location-modal-actions .btn-primary:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                        transform: none;
                        box-shadow: none;
                    }

                    .location-modal-actions .btn-secondary {
                        width: 100%;
                        padding: 0.875rem;
                        background: transparent;
                        color: var(--accent-lime);
                        font-weight: 700;
                        font-size: 0.85rem;
                        text-transform: uppercase;
                        border: 2px solid var(--accent-lime);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        cursor: pointer;
                    }

                    .location-modal-actions .btn-ghost {
                        background: transparent;
                        border: none;
                        color: rgba(255, 255, 255, 0.5);
                        font-size: 0.85rem;
                        padding: 0.5rem;
                        cursor: pointer;
                    }

                    .location-modal-actions .btn-ghost:hover {
                        color: rgba(255, 255, 255, 0.8);
                    }

                    .spinning {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
