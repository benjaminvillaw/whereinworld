import { useState } from 'react';

export function BottomNav({ activeTab = 'grid', onTabChange }) {
    const tabs = [
        { id: 'grid', icon: 'grid_view', label: 'Cities' },
        { id: 'map', icon: 'map', label: 'Map' },
        { id: 'chat', icon: 'chat_bubble', label: 'Chat' },
        { id: 'profile', icon: 'person', label: 'Profile' },
    ];

    return (
        <div className="bottom-nav">
            <div className="bottom-nav-inner">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange?.(tab.id)}
                        aria-label={tab.label}
                    >
                        <span className={`material-symbols-outlined ${activeTab === tab.id ? 'filled' : ''}`}>
                            {tab.icon}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
