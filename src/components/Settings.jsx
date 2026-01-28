import { useState } from 'react';

export function Settings({ onBack, ghostMode = false, onGhostModeChange }) {
    const [isGhostMode, setIsGhostMode] = useState(ghostMode);
    const [accuracy, setAccuracy] = useState('exact');
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [frequency, setFrequency] = useState(2);

    const handleGhostModeToggle = () => {
        const newValue = !isGhostMode;
        setIsGhostMode(newValue);
        onGhostModeChange?.(newValue);
    };

    const frequencyLabels = ['Realtime', '15m', 'Hourly'];

    return (
        <div className="settings-page">
            {/* Header */}
            <header className="settings-header">
                <button className="btn-icon" onClick={onBack}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="settings-title">Privacy</h2>
                <div style={{ width: '3rem' }}></div>
            </header>

            <main className="settings-content">
                {/* Ghost Mode Card */}
                <section className="ghost-mode-card">
                    {/* Animated Wave Background */}
                    <div className="ghost-mode-card-bg">
                        <svg
                            className="ghost-wave ghost-wave-1"
                            preserveAspectRatio="none"
                            viewBox="0 0 1440 320"
                        >
                            <path
                                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192V320H0Z"
                                fill="var(--primary)"
                                fillOpacity="0.3"
                            />
                        </svg>
                        <svg
                            className="ghost-wave ghost-wave-2"
                            preserveAspectRatio="none"
                            viewBox="0 0 1440 320"
                            style={{ transform: 'rotate(180deg)' }}
                        >
                            <path
                                d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160V320H0Z"
                                fill="black"
                                fillOpacity="0.2"
                            />
                        </svg>
                    </div>

                    <div className="ghost-mode-card-content">
                        <div className="flex flex-col items-center gap-2">
                            <div className="ghost-mode-icon">
                                <span className="material-symbols-outlined">visibility_off</span>
                            </div>
                            <h3 className="ghost-mode-title">Ghost<br />Mode</h3>
                            <p className="ghost-mode-subtitle">Become Invisible</p>
                        </div>

                        {/* Big Toggle */}
                        <div
                            className={`toggle-big ${isGhostMode ? 'active' : ''}`}
                            onClick={handleGhostModeToggle}
                        >
                            <span className="toggle-big-label on">ON</span>
                            <span className="toggle-big-label off">OFF</span>
                            <div className="toggle-big-knob">
                                <span className="material-symbols-outlined" style={{ color: 'black' }}>
                                    power_settings_new
                                </span>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="ghost-mode-info">
                            <span className="material-symbols-outlined" style={{ flexShrink: 0 }}>info</span>
                            <p>Going ghost hides you, but also blinds you. You won't see friends' locations while active.</p>
                        </div>
                    </div>
                </section>

                {/* Accuracy Section */}
                <section className="settings-card">
                    <div className="settings-card-glow"></div>
                    <div className="settings-card-header">
                        <span className="material-symbols-outlined settings-card-icon primary">my_location</span>
                        <h3 className="settings-card-title">Accuracy</h3>
                    </div>

                    <div className="radio-grid">
                        <label
                            className={`radio-card ${accuracy === 'exact' ? 'active' : ''}`}
                            onClick={() => setAccuracy('exact')}
                        >
                            <span className="material-symbols-outlined radio-card-icon">pin_drop</span>
                            <span className="radio-card-label">Exact</span>
                        </label>
                        <label
                            className={`radio-card ${accuracy === 'zone' ? 'active mint' : ''}`}
                            onClick={() => setAccuracy('zone')}
                        >
                            <span className="material-symbols-outlined radio-card-icon">location_city</span>
                            <span className="radio-card-label">City Zone</span>
                        </label>
                    </div>

                    <p className="text-xs mt-4" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                        "City Zone" radius is approx ~5km.
                    </p>
                </section>

                {/* Alerts Section */}
                <section className="settings-card" style={{ padding: '0.25rem' }}>
                    <div className="flex items-center justify-between p-5">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined settings-card-icon mint">
                                    notifications_active
                                </span>
                                <h3 className="settings-card-title">Alerts</h3>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)', paddingLeft: '2px' }}>
                                Notify on friend arrival
                            </span>
                        </div>

                        <div
                            className={`toggle ${alertsEnabled ? 'active' : ''}`}
                            onClick={() => setAlertsEnabled(!alertsEnabled)}
                        >
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                </section>

                {/* Frequency Section */}
                <section className="settings-card">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined settings-card-icon primary">
                                battery_charging_full
                            </span>
                            <h3 className="settings-card-title">Frequency</h3>
                        </div>
                        <span className="badge-primary" style={{ fontSize: '0.625rem' }}>
                            Battery Saver
                        </span>
                    </div>

                    <div className="frequency-slider">
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="1"
                            value={frequency}
                            onChange={(e) => setFrequency(parseInt(e.target.value))}
                            className="slider"
                        />
                        <div className="slider-labels">
                            {frequencyLabels.map((label, idx) => (
                                <span
                                    key={label}
                                    style={{
                                        color: frequency === idx + 1 ? 'var(--primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="settings-footer">
                <a href="#" className="settings-link">Privacy Policy</a>
            </footer>

            <style>{`
                .settings-page {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    width: 100%;
                    max-width: 28rem;
                    margin: 0 auto;
                    background: var(--background-dark);
                    overflow-x: hidden;
                }

                .settings-header {
                    position: relative;
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem;
                    padding-bottom: 0.5rem;
                }

                .settings-title {
                    font-size: 1.25rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    text-align: center;
                    flex: 1;
                }

                .settings-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    padding: 1rem;
                    padding-bottom: 3rem;
                }

                /* Ghost Wave Animations */
                .ghost-wave {
                    position: absolute;
                    width: 200%;
                    height: 100%;
                }

                .ghost-wave-1 {
                    bottom: 0;
                    left: 0;
                    animation: wave 8s infinite linear;
                }

                .ghost-wave-2 {
                    top: 0;
                    right: 0;
                    animation: wave 10s infinite linear reverse;
                }

                @keyframes wave {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                /* Frequency Slider */
                .frequency-slider {
                    padding: 0 0.5rem;
                }

                .slider {
                    width: 100%;
                    height: 6px;
                    background: var(--surface-border);
                    border-radius: 3px;
                    -webkit-appearance: none;
                    appearance: none;
                    cursor: pointer;
                }

                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--primary);
                    border: 4px solid black;
                    box-shadow: 0 0 0 2px var(--primary);
                    cursor: pointer;
                    margin-top: -11px;
                }

                .slider::-webkit-slider-runnable-track {
                    height: 6px;
                    background: var(--surface-border);
                    border-radius: 3px;
                }

                .slider-labels {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 1rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .settings-footer {
                    padding: 1.5rem;
                    text-align: center;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    background: black;
                    padding-bottom: 2.5rem;
                }

                .settings-link {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .settings-link:hover {
                    color: var(--primary);
                }
            `}</style>
        </div>
    );
}
