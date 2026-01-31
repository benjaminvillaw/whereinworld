import { useState, useEffect } from 'react';
import { api } from '../lib/supabase';

export function GroupInviteModal({ onClose, onSuccess }) {
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [group, setGroup] = useState(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await api.createGroupInvite({
                name: groupName.trim() || undefined,
                maxMembers: 50,
                expiresInDays: 7
            });
            setGroup(result.group);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(group.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: group.name ? `Join ${group.name} on Where In World` : 'Join my group on Where In World',
                    text: `Join my group and see where everyone is! ${group.memberCount} people have joined.`,
                    url: group.url
                });
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error('Share failed:', e);
                }
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content group-invite-modal" onClick={e => e.stopPropagation()}>
                <div className="invite-modal">
                    <div className="invite-header">
                        <h2>{group ? 'Share Group Link' : 'Create Group Link'}</h2>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>

                    {!group ? (
                        <>
                            <p className="invite-description">
                                Everyone who joins this link will be connected to each other — not just to you.
                            </p>

                            {/* Group Name Input */}
                            <div className="link-section">
                                <label className="input-label">Group Name (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Book Club, Work Team"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                    className="group-name-input"
                                />
                            </div>

                            {/* Info Box */}
                            <div className="info-box">
                                <span className="material-symbols-outlined info-icon">info</span>
                                <div>
                                    <p className="info-text">Link expires in <strong>7 days</strong></p>
                                    <p className="info-subtext">Maximum 50 members per group</p>
                                </div>
                            </div>

                            {error && (
                                <div className="error-message">{error}</div>
                            )}

                            {/* Create Button */}
                            <button
                                className="btn btn-primary create-btn"
                                onClick={handleCreate}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : (
                                    <>
                                        <span className="material-symbols-outlined">link</span>
                                        Create Group Link
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <div className="success-box">
                                <span className="material-symbols-outlined success-icon">check_circle</span>
                                <p className="success-title">{group.name || 'Group Link Created!'}</p>
                                <p className="success-subtitle">
                                    Expires in 7 days · {group.memberCount || 1} member(s)
                                </p>
                            </div>

                            {/* Link Display */}
                            <div className="link-display">
                                <span className="material-symbols-outlined link-icon">link</span>
                                <span className="link-text">{group.url}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCopy}
                                >
                                    <span className="material-symbols-outlined">
                                        {copied ? 'check' : 'content_copy'}
                                    </span>
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleShare}
                                >
                                    <span className="material-symbols-outlined">share</span>
                                    Share
                                </button>
                            </div>

                            {/* Done Button */}
                            <button
                                className="btn btn-tertiary done-btn"
                                onClick={() => {
                                    if (onSuccess) onSuccess(group);
                                    onClose();
                                }}
                            >
                                Done
                            </button>
                        </>
                    )}
                </div>

                <style>{`
                    .group-invite-modal {
                        width: 100%;
                        max-width: 400px;
                    }

                    .group-invite-modal .invite-modal {
                        padding: 24px;
                    }

                    .group-invite-modal .invite-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }

                    .group-invite-modal .invite-header h2 {
                        margin: 0;
                        font-size: 22px;
                        font-weight: 800;
                    }

                    .group-invite-modal .close-btn {
                        width: 32px;
                        height: 32px;
                        border: none;
                        background: var(--bg-tertiary);
                        border-radius: var(--radius-sm);
                        font-size: 16px;
                        cursor: pointer;
                        color: var(--text-secondary);
                        transition: all var(--transition-fast);
                    }

                    .group-invite-modal .close-btn:hover {
                        background: var(--bg-glass-hover);
                        color: var(--text-primary);
                    }

                    .group-invite-modal .invite-description {
                        color: var(--text-secondary);
                        margin-bottom: 24px;
                        font-size: 14px;
                    }

                    .group-invite-modal .link-section {
                        margin-bottom: 16px;
                    }

                    .group-invite-modal .input-label {
                        display: block;
                        font-size: 13px;
                        font-weight: 600;
                        color: var(--text-secondary);
                        margin-bottom: 8px;
                    }

                    .group-invite-modal .group-name-input {
                        width: 100%;
                        padding: 14px 16px;
                        border-radius: var(--radius-md);
                        border: 1px solid var(--border-subtle);
                        background: var(--bg-tertiary);
                        color: var(--text-primary);
                        font-size: 16px;
                        outline: none;
                        box-sizing: border-box;
                        transition: border-color var(--transition-fast);
                    }

                    .group-invite-modal .group-name-input:focus {
                        border-color: var(--primary);
                    }

                    .group-invite-modal .group-name-input::placeholder {
                        color: var(--text-muted);
                    }

                    .group-invite-modal .info-box {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        padding: 14px 16px;
                        background: rgba(59, 130, 246, 0.1);
                        border: 1px solid rgba(59, 130, 246, 0.2);
                        border-radius: var(--radius-md);
                        margin-bottom: 20px;
                    }

                    .group-invite-modal .info-icon {
                        color: #3b82f6;
                        font-size: 20px;
                        flex-shrink: 0;
                    }

                    .group-invite-modal .info-text {
                        margin: 0;
                        font-size: 14px;
                        color: var(--text-primary);
                    }

                    .group-invite-modal .info-subtext {
                        margin: 4px 0 0;
                        font-size: 12px;
                        color: var(--text-muted);
                    }

                    .group-invite-modal .create-btn {
                        width: 100%;
                        padding: 14px 20px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }

                    .group-invite-modal .error-message {
                        margin-bottom: 16px;
                        padding: 10px 14px;
                        background: rgba(239, 68, 68, 0.15);
                        color: var(--error);
                        border-radius: var(--radius-sm);
                        font-size: 13px;
                    }

                    .group-invite-modal .success-box {
                        text-align: center;
                        padding: 20px;
                        background: rgba(16, 185, 129, 0.1);
                        border: 1px solid rgba(16, 185, 129, 0.2);
                        border-radius: var(--radius-md);
                        margin-bottom: 20px;
                    }

                    .group-invite-modal .success-icon {
                        color: var(--success);
                        font-size: 40px;
                        margin-bottom: 8px;
                    }

                    .group-invite-modal .success-title {
                        margin: 0 0 4px;
                        font-size: 18px;
                        font-weight: 700;
                        color: var(--text-primary);
                    }

                    .group-invite-modal .success-subtitle {
                        margin: 0;
                        font-size: 13px;
                        color: var(--text-muted);
                    }

                    .group-invite-modal .link-display {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 14px 16px;
                        background: var(--bg-tertiary);
                        border-radius: var(--radius-md);
                        margin-bottom: 16px;
                    }

                    .group-invite-modal .link-icon {
                        color: var(--primary);
                        font-size: 20px;
                        flex-shrink: 0;
                    }

                    .group-invite-modal .link-text {
                        flex: 1;
                        font-size: 14px;
                        color: var(--text-primary);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .group-invite-modal .action-buttons {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 12px;
                    }

                    .group-invite-modal .action-buttons .btn {
                        flex: 1;
                        padding: 14px 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-weight: 600;
                    }

                    .group-invite-modal .done-btn {
                        width: 100%;
                        padding: 12px 20px;
                        background: var(--bg-tertiary);
                        color: var(--text-secondary);
                        border: none;
                        border-radius: var(--radius-md);
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all var(--transition-fast);
                    }

                    .group-invite-modal .done-btn:hover {
                        background: var(--bg-glass-hover);
                        color: var(--text-primary);
                    }
                `}</style>
            </div>
        </div>
    );
}
