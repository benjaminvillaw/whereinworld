import { useMemo } from 'react';

export function BottomNav({
    activeTab = 'cities',
    onTabChange,
    onLocationPress
}) {
    const tabs = [
        { id: 'cities', label: 'Cities', icon: 'apartment' },
        { id: 'map', label: 'Map', icon: 'map' },
        { id: 'friends', label: 'Friends', icon: 'group' },
        { id: 'you', label: 'You', icon: 'person' },
    ];

    return (
        <div className="bottom-nav-wrapper">
            {/* Main Navigation Bar */}
            <nav className="bottom-nav-bar">
                {/* Left side tabs */}
                <div className="nav-tabs-left">
                    {tabs.slice(0, 2).map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange?.(tab.id)}
                        >
                            <span className="material-symbols-outlined nav-icon">
                                {tab.icon}
                            </span>
                            <span className="nav-label">{tab.label.toUpperCase()}</span>
                        </button>
                    ))}
                </div>

                {/* Center Location Button */}
                <button className="center-location-btn" onClick={onLocationPress}>
                    <div className="center-btn-inner">
                        <span className="material-symbols-outlined filled">my_location</span>
                    </div>
                </button>

                {/* Right side tabs */}
                <div className="nav-tabs-right">
                    {tabs.slice(2).map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange?.(tab.id)}
                        >
                            <span className="material-symbols-outlined nav-icon">
                                {tab.icon}
                            </span>
                            <span className="nav-label">{tab.label.toUpperCase()}</span>
                        </button>
                    ))}
                </div>
            </nav>

            <style>{`
                .bottom-nav-wrapper {
                    position: fixed;
                    bottom: 1.25rem;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    width: 92%;
                    max-width: 400px;
                }

                .bottom-nav-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    height: 4rem;
                    background: #1a1a1a;
                    border-radius: 2rem;
                    padding: 0 0.5rem;
                    position: relative;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .nav-tabs-left,
                .nav-tabs-right {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    flex: 1;
                }

                .nav-tabs-left {
                    justify-content: flex-start;
                    padding-left: 0.25rem;
                }

                .nav-tabs-right {
                    justify-content: flex-end;
                    padding-right: 0.25rem;
                }

                .nav-tab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.125rem;
                    padding: 0.5rem 0.75rem;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 3.5rem;
                }

                .nav-icon {
                    font-size: 1.5rem;
                    color: rgba(255, 255, 255, 0.5);
                    transition: color 0.2s ease;
                }

                .nav-tab.active .nav-icon {
                    color: var(--accent-lime, #CCFF00);
                }

                .nav-label {
                    font-size: 0.5rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: rgba(255, 255, 255, 0.5);
                    transition: color 0.2s ease;
                }

                .nav-tab.active .nav-label {
                    color: var(--accent-lime, #CCFF00);
                }

                .nav-tab:hover .nav-icon,
                .nav-tab:hover .nav-label {
                    color: rgba(255, 255, 255, 0.8);
                }

                .center-location-btn {
                    position: absolute;
                    left: 50%;
                    top: -1rem;
                    transform: translateX(-50%);
                    width: 4rem;
                    height: 4rem;
                    background: linear-gradient(135deg, #FF7F6C 0%, #FF6B5B 100%);
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(255, 107, 91, 0.4);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .center-location-btn:hover {
                    transform: translateX(-50%) scale(1.05);
                    box-shadow: 0 6px 24px rgba(255, 107, 91, 0.5);
                }

                .center-location-btn:active {
                    transform: translateX(-50%) scale(0.95);
                }

                .center-btn-inner {
                    width: 2.5rem;
                    height: 2.5rem;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .center-btn-inner .material-symbols-outlined {
                    font-size: 1.5rem;
                    color: white;
                }
            `}</style>
        </div>
    );
}
