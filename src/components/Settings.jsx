import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/supabase';
import { GlobalBadges } from './FriendProfilePopup';

export function Settings({ user, onBack, ghostMode = false, onGhostModeChange, onLogout, onUserUpdate, onShowPrivacyPolicy, onShowTerms, onInvite, friends = [], userLocation = null }) {
    const [isGhostMode, setIsGhostMode] = useState(ghostMode);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'privacy'
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.display_name || '');
    const [sentInvites, setSentInvites] = useState([]);
    const [groupInvites, setGroupInvites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadSentInvites();
        loadGroupInvites();
    }, []);

    const loadSentInvites = async () => {
        try {
            const invites = await api.getMyInvites?.();
            setSentInvites(invites || []);
        } catch (e) {
            console.error('Failed to load invites:', e);
        }
    };

    const loadGroupInvites = async () => {
        try {
            const groups = await api.getMyGroupInvites?.();
            setGroupInvites(groups || []);
        } catch (e) {
            console.error('Failed to load group invites:', e);
        }
    };

    const handleToggleGroupActive = async (groupId, currentActive) => {
        try {
            await api.updateGroupInvite(groupId, { isActive: !currentActive });
            loadGroupInvites(); // Refresh list
        } catch (e) {
            console.error('Failed to toggle group:', e);
        }
    };

    const handleGhostModeToggle = () => {
        const newValue = !isGhostMode;
        setIsGhostMode(newValue);
        onGhostModeChange?.(newValue);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const updatedUser = await api.uploadAvatar(user.id, file);
            onUserUpdate?.(updatedUser);
        } catch (err) {
            console.error('Failed to upload avatar:', err);
        }
        setLoading(false);
    };

    const handleNameSave = async () => {
        if (!newName.trim() || newName === user?.display_name) {
            setEditingName(false);
            return;
        }
        setLoading(true);
        try {
            const updatedUser = await api.updateUserName(user.id, newName.trim());
            onUserUpdate?.(updatedUser);
            setEditingName(false);
        } catch (err) {
            console.error('Failed to update name:', err);
        }
        setLoading(false);
    };

    const handleDeleteAccount = async () => {
        try {
            await api.deleteAccount?.();
            onLogout?.();
        } catch (err) {
            console.error('Failed to delete account:', err);
        }
    };

    return (
        <div className="settings-page">
            {/* Header */}
            <header className="settings-header">
                <button className="btn-icon" onClick={onBack}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="settings-title">Settings</h2>
                <div style={{ width: '3rem' }}></div>
            </header>

            {/* Tabs */}
            <div className="settings-tabs">
                <button
                    className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button
                    className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('privacy')}
                >
                    About
                </button>
            </div>

            <main className="settings-content">
                {activeTab === 'profile' && (
                    <>
                        {/* Profile Card */}
                        <section className="settings-card">
                            <div className="profile-section">
                                {/* Avatar */}
                                <div
                                    className="profile-avatar-container"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt="" className="profile-avatar" />
                                    ) : (
                                        <div className="profile-avatar-placeholder">
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                    )}
                                    <div className="profile-avatar-edit">
                                        <span className="material-symbols-outlined">edit</span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {/* Name */}
                                <div className="profile-info">
                                    {editingName ? (
                                        <div className="profile-name-edit">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="profile-name-input"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                                            />
                                            <button className="btn-sm" onClick={handleNameSave} disabled={loading}>
                                                <span className="material-symbols-outlined">check</span>
                                            </button>
                                            <button className="btn-sm" onClick={() => setEditingName(false)}>
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="profile-name-row" onClick={() => setEditingName(true)}>
                                            <h3 className="profile-name">{user?.display_name || 'No Name'}</h3>
                                            <span className="material-symbols-outlined" style={{ fontSize: '1rem', opacity: 0.5 }}>edit</span>
                                        </div>
                                    )}
                                    <p className="profile-phone">{user?.phone || 'No phone'}</p>
                                </div>
                            </div>

                            {/* Global Stats Badges */}
                            <div className="profile-badges-section">
                                <p className="profile-badges-label">Your Global Reach</p>
                                <GlobalBadges
                                    cities={(() => {
                                        const cities = new Set();
                                        // Include user's location if available
                                        if (userLocation?.city) cities.add(userLocation.city.toLowerCase());
                                        // Include friends' locations
                                        friends.forEach(f => f.location?.city && cities.add(f.location.city.toLowerCase()));
                                        return cities.size;
                                    })()}
                                    countries={(() => {
                                        const countries = new Set();
                                        // Include user's location if available
                                        if (userLocation?.country) countries.add(userLocation.country.toLowerCase());
                                        // Include friends' locations
                                        friends.forEach(f => f.location?.country && countries.add(f.location.country.toLowerCase()));
                                        return countries.size;
                                    })()}
                                    compact={true}
                                />
                                <p className="profile-badges-text">
                                    {userLocation?.isApproximate ? 'Estimated in' : 'You + friends in'} <strong>{(() => {
                                        const cities = new Set();
                                        if (userLocation?.city) cities.add(userLocation.city.toLowerCase());
                                        friends.forEach(f => f.location?.city && cities.add(f.location.city.toLowerCase()));
                                        return cities.size;
                                    })()}</strong> cities across <strong>{(() => {
                                        const countries = new Set();
                                        if (userLocation?.country) countries.add(userLocation.country.toLowerCase());
                                        friends.forEach(f => f.location?.country && countries.add(f.location.country.toLowerCase()));
                                        return countries.size;
                                    })()}</strong> countries
                                </p>
                            </div>
                        </section>

                        {/* Sent Invites */}
                        <section className="settings-card">
                            <div className="settings-card-header">
                                <span className="material-symbols-outlined settings-card-icon mint">send</span>
                                <h3 className="settings-card-title">Sent Invites</h3>
                                <button className="add-friend-btn" onClick={onInvite} title="Add Friend">
                                    <span className="material-symbols-outlined">person_add</span>
                                </button>
                            </div>

                            {sentInvites.length === 0 ? (
                                <p className="invites-empty">No invites sent yet</p>
                            ) : (
                                <div className="invites-list">
                                    {sentInvites.map((invite, idx) => (
                                        <div key={idx} className="invite-item">
                                            <div className="invite-info">
                                                <span className="invite-phone">{invite.phone_sent_to || 'Link invite'}</span>
                                                <span className={`invite-status ${invite.accepted_at ? 'accepted' : 'pending'}`}>
                                                    {invite.accepted_at ? 'Accepted' : 'Pending'}
                                                </span>
                                            </div>
                                            <span className="invite-date">
                                                {new Date(invite.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Group Invites Section */}
                        <section className="settings-card">
                            <div className="settings-card-header">
                                <span className="material-symbols-outlined settings-card-icon" style={{ color: '#8b5cf6' }}>groups</span>
                                <h3 className="settings-card-title">Group Links</h3>
                            </div>

                            {groupInvites.length === 0 ? (
                                <p className="invites-empty">No group links created yet</p>
                            ) : (
                                <div className="invites-list">
                                    {groupInvites.map((group) => (
                                        <div key={group.id} className="invite-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="invite-info">
                                                    <span className="invite-phone" style={{ fontWeight: 600 }}>{group.name || `Group ${group.code}`}</span>
                                                    <span className={`invite-status ${group.is_active ? 'pending' : 'accepted'}`}>
                                                        {group.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleGroupActive(group.id, group.is_active)}
                                                    style={{
                                                        background: group.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                        color: group.is_active ? '#ef4444' : '#10b981',
                                                        border: 'none',
                                                        padding: '0.375rem 0.75rem',
                                                        borderRadius: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {group.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>{group.member_count || 1} member{group.member_count !== 1 ? 's' : ''}</span>
                                                <span>Expires {new Date(group.expires_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Logout & Delete */}
                        <section className="settings-actions">
                            <button className="btn-logout" onClick={onLogout}>
                                <span className="material-symbols-outlined">logout</span>
                                Log Out
                            </button>

                            {showDeleteConfirm ? (
                                <div className="delete-confirm">
                                    <p>Are you sure? This cannot be undone.</p>
                                    <div className="delete-actions">
                                        <button className="btn-delete-confirm" onClick={handleDeleteAccount}>
                                            Delete Forever
                                        </button>
                                        <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
                                    <span className="material-symbols-outlined">delete</span>
                                    Delete Account
                                </button>
                            )}
                        </section>
                    </>
                )}

                {activeTab === 'privacy' && (
                    <>
                        {/* About Section */}
                        <section className="settings-card">
                            <div className="settings-card-header">
                                <span className="material-symbols-outlined settings-card-icon mint">info</span>
                                <h3 className="settings-card-title">About</h3>
                            </div>

                            <div className="legal-links">
                                <button
                                    onClick={onShowPrivacyPolicy}
                                    className="legal-link"
                                >
                                    <span className="material-symbols-outlined">shield</span>
                                    <div className="legal-link-content">
                                        <span className="legal-link-title">Privacy Policy</span>
                                        <span className="legal-link-subtitle">How we handle your data</span>
                                    </div>
                                    <span className="material-symbols-outlined legal-link-arrow">arrow_forward</span>
                                </button>

                                <button
                                    onClick={onShowTerms}
                                    className="legal-link"
                                >
                                    <span className="material-symbols-outlined">description</span>
                                    <div className="legal-link-content">
                                        <span className="legal-link-title">Terms & Conditions</span>
                                        <span className="legal-link-subtitle">Rules for using the app</span>
                                    </div>
                                    <span className="material-symbols-outlined legal-link-arrow">arrow_forward</span>
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </main>

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

                .settings-tabs {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0 1rem;
                    margin-bottom: 1rem;
                }

                .settings-tab {
                    flex: 1;
                    padding: 0.75rem;
                    background: var(--surface-dark);
                    border: 2px solid transparent;
                    border-radius: 0.5rem;
                    color: var(--text-secondary);
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .settings-tab.active {
                    background: var(--accent-lime);
                    color: black;
                    border-color: black;
                }

                .settings-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    padding: 1rem;
                    padding-bottom: 3rem;
                }

                /* Profile Section */
                .profile-section {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 1rem;
                }

                .profile-avatar-container {
                    position: relative;
                    width: 5rem;
                    height: 5rem;
                    border-radius: 50%;
                    cursor: pointer;
                    overflow: hidden;
                }

                .profile-avatar {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .profile-avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: var(--surface-dark);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--accent-lime);
                }

                .profile-avatar-placeholder .material-symbols-outlined {
                    font-size: 2.5rem;
                }

                .profile-avatar-edit {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 1.75rem;
                    height: 1.75rem;
                    background: var(--accent-lime);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid black;
                }

                .profile-avatar-edit .material-symbols-outlined {
                    font-size: 0.9rem;
                    color: black;
                }

                .profile-info {
                    flex: 1;
                }

                .profile-name-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .profile-name {
                    font-size: 1.25rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .profile-phone {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }

                .profile-name-edit {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .profile-name-input {
                    flex: 1;
                    background: var(--surface-dark);
                    border: 2px solid var(--accent-lime);
                    border-radius: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    font-size: 1rem;
                    color: white;
                    font-weight: 700;
                }

                .btn-sm {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 0.5rem;
                    background: var(--surface-dark);
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--accent-lime);
                }

                /* Invites */
                .invites-empty {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    text-align: center;
                    padding: 1rem;
                }

                .invites-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding: 0.5rem;
                }

                .invite-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: var(--surface-dark);
                    border-radius: 0.5rem;
                }

                .invite-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .invite-phone {
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .invite-status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .invite-status.accepted {
                    color: var(--accent-lime);
                }

                .invite-status.pending {
                    color: var(--text-secondary);
                }

                .invite-date {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                /* Actions */
                .settings-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding: 1rem;
                }

                .btn-logout {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: var(--surface-dark);
                    border: 2px solid var(--surface-border);
                    border-radius: 0.75rem;
                    color: white;
                    font-weight: 700;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-logout:hover {
                    border-color: var(--accent-lime);
                }

                .btn-delete {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: transparent;
                    border: 2px solid rgba(239, 68, 68, 0.3);
                    border-radius: 0.75rem;
                    color: #ef4444;
                    font-weight: 700;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-delete:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: #ef4444;
                }

                .delete-confirm {
                    padding: 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 2px solid #ef4444;
                    border-radius: 0.75rem;
                    text-align: center;
                }

                .delete-confirm p {
                    font-size: 0.875rem;
                    color: #ef4444;
                    margin-bottom: 1rem;
                }

                .delete-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-delete-confirm {
                    flex: 1;
                    padding: 0.75rem;
                    background: #ef4444;
                    border: none;
                    border-radius: 0.5rem;
                    color: white;
                    font-weight: 700;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    cursor: pointer;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 0.75rem;
                    background: var(--surface-dark);
                    border: none;
                    border-radius: 0.5rem;
                    color: var(--text-secondary);
                    font-weight: 700;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    cursor: pointer;
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

                @keyframes wave {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                /* Legal Links */
                .legal-links {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding: 1rem;
                }

                .legal-link {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--surface-dark);
                    border-radius: 0.75rem;
                    text-decoration: none;
                    color: white;
                    transition: all 0.2s;
                    border: 2px solid transparent;
                }

                .legal-link:hover {
                    border-color: var(--accent-lime);
                }

                .legal-link > .material-symbols-outlined:first-child {
                    font-size: 1.5rem;
                    color: var(--accent-lime);
                }

                .legal-link-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .legal-link-title {
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .legal-link-subtitle {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .legal-link-arrow {
                    color: var(--text-secondary);
                    font-size: 1.25rem;
                }
            `}</style>
        </div>
    );
}
