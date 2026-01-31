import { useState, useEffect } from 'react';

// Detect browser for specific instructions
function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Edg')) return 'edge';
    return 'other';
}

const BROWSER_INSTRUCTIONS = {
    chrome: {
        name: 'Chrome',
        steps: [
            'Click the lock icon 🔒 in the address bar',
            'Find "Location" and set it to "Allow"',
            'Refresh the page'
        ]
    },
    safari: {
        name: 'Safari',
        steps: [
            'Go to Safari → Settings → Websites → Location',
            'Find this website and select "Allow"',
            'Refresh the page'
        ]
    },
    firefox: {
        name: 'Firefox',
        steps: [
            'Click the lock icon 🔒 in the address bar',
            'Click "Connection secure" → "More information"',
            'Go to Permissions → Location → Allow'
        ]
    },
    edge: {
        name: 'Edge',
        steps: [
            'Click the lock icon 🔒 in the address bar',
            'Find "Location" and set it to "Allow"',
            'Refresh the page'
        ]
    },
    other: {
        name: 'your browser',
        steps: [
            'Look for a lock or settings icon in the address bar',
            'Find location permissions and enable them',
            'Refresh the page'
        ]
    }
};

export function LocationDeniedBanner({ onRetry }) {
    const [showInstructions, setShowInstructions] = useState(false);
    const browser = getBrowser();
    const instructions = BROWSER_INSTRUCTIONS[browser];

    return (
        <div className="location-denied-banner">
            <div className="denied-content">
                <div className="denied-icon">
                    <span className="material-symbols-outlined">location_off</span>
                </div>

                <div className="denied-text">
                    <h3 className="denied-title">Location Access Blocked</h3>
                    <p className="denied-description">
                        Enable location to see where your friends are
                    </p>
                </div>
            </div>

            <div className="denied-actions">
                <button
                    className="denied-btn-primary"
                    onClick={onRetry}
                >
                    <span className="material-symbols-outlined">refresh</span>
                    Try Again
                </button>

                <button
                    className="denied-btn-secondary"
                    onClick={() => setShowInstructions(!showInstructions)}
                >
                    <span className="material-symbols-outlined">
                        {showInstructions ? 'expand_less' : 'help'}
                    </span>
                    {showInstructions ? 'Hide' : 'How to enable'}
                </button>
            </div>

            {showInstructions && (
                <div className="denied-instructions">
                    <p className="instructions-header">
                        To enable in {instructions.name}:
                    </p>
                    <ol className="instructions-list">
                        {instructions.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                        ))}
                    </ol>
                </div>
            )}

            <style>{`
                .location-denied-banner {
                    background: linear-gradient(135deg, #2a1a1a 0%, #1a1a2e 100%);
                    border: 2px solid rgba(255, 100, 100, 0.3);
                    border-radius: 1rem;
                    padding: 1.25rem;
                    margin: 1rem;
                }

                .denied-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .denied-icon {
                    width: 3rem;
                    height: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 100, 100, 0.2);
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .denied-icon .material-symbols-outlined {
                    font-size: 1.5rem;
                    color: #ff6b6b;
                }

                .denied-title {
                    font-size: 1rem;
                    font-weight: 800;
                    color: white;
                    margin: 0 0 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .denied-description {
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0;
                }

                .denied-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .denied-btn-primary {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1rem;
                    background: var(--accent-lime);
                    color: black;
                    font-size: 0.875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    border: 2px solid black;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .denied-btn-primary:hover {
                    transform: translateY(-2px);
                }

                .denied-btn-primary .material-symbols-outlined {
                    font-size: 1.25rem;
                }

                .denied-btn-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.875rem;
                    font-weight: 600;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 0.75rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .denied-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .denied-btn-secondary .material-symbols-outlined {
                    font-size: 1.25rem;
                }

                .denied-instructions {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .instructions-header {
                    font-size: 0.8125rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0 0 0.75rem;
                }

                .instructions-list {
                    margin: 0;
                    padding-left: 1.25rem;
                    font-size: 0.8125rem;
                    color: rgba(255, 255, 255, 0.6);
                    line-height: 1.8;
                }

                .instructions-list li {
                    margin-bottom: 0.25rem;
                }
            `}</style>
        </div>
    );
}
