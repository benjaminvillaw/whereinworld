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
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    width: '100%',
                    maxWidth: '380px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                        {group ? 'Share Group Link' : 'Create Group Link'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <span className="material-icons" style={{ color: 'white', fontSize: '20px' }}>close</span>
                    </button>
                </div>

                {!group ? (
                    <>
                        {/* Group Name Input */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                                Group Name (optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Book Club, Work Team"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Info */}
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', margin: 0 }}>
                                <span style={{ fontWeight: '600', color: '#3b82f6' }}>How it works:</span> Everyone who joins this link will be connected to each other — not just to you.
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>
                                Link expires in 7 days · Max 50 members
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                            </div>
                        )}

                        {/* Create Button */}
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {loading ? (
                                <>Creating...</>
                            ) : (
                                <>
                                    <span className="material-icons" style={{ fontSize: '20px' }}>link</span>
                                    Create Group Link
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        {/* Success State */}
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <span className="material-icons" style={{ color: '#10b981', fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block' }}>check_circle</span>
                            <p style={{ color: 'white', fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem' }}>
                                {group.name || 'Group Link Created!'}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', margin: 0 }}>
                                Expires in 7 days · {group.memberCount || 1} member(s)
                            </p>
                        </div>

                        {/* Link Display */}
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <span className="material-icons" style={{ color: '#3b82f6', fontSize: '20px' }}>link</span>
                            <span style={{
                                color: 'white',
                                fontSize: '0.875rem',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {group.url}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleCopy}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px' }}>
                                    {copied ? 'check' : 'content_copy'}
                                </span>
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={handleShare}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px' }}>share</span>
                                Share
                            </button>
                        </div>

                        {/* Done Button */}
                        <button
                            onClick={() => {
                                if (onSuccess) onSuccess(group);
                                onClose();
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                marginTop: '1rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Done
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
