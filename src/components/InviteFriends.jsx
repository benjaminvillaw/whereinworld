import { useState, useEffect } from 'react';
import { api } from '../lib/supabase';

export function InviteFriends({ onClose, onInviteSent }) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [smsSent, setSmsSent] = useState(false);
    const [error, setError] = useState('');

    // Load or create invite link on mount
    useEffect(() => {
        api.createInvite().then(result => {
            if (result?.invite?.url) {
                setInviteLink(result.invite.url);
            }
        }).catch(console.error);
    }, []);

    const handleSendSms = async (e) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setLoading(true);
        setError('');
        setSmsSent(false);

        try {
            await api.sendInviteSms(phone);
            setSmsSent(true);
            setPhone('');
            onInviteSent?.();
        } catch (err) {
            setError(err.message || 'Failed to send invite');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!inviteLink) {
            // Generate link if not already loaded
            try {
                const result = await api.createInvite();
                if (result?.invite?.url) {
                    setInviteLink(result.invite.url);
                    await navigator.clipboard.writeText(result.invite.url);
                    setCopied(true);
                }
            } catch (err) {
                setError(err.message || 'Failed to generate invite link');
                return;
            }
        } else {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
        }
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="invite-modal">
            <div className="invite-header">
                <h2>Invite Friends</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <p className="invite-description">
                Invite friends to see where each other are in the world!
            </p>

            {/* SMS Invite */}
            <form onSubmit={handleSendSms} className="invite-form">
                <label className="input-label">Send via text message</label>
                <div className="phone-input-group">
                    <span className="phone-prefix">+1</span>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Phone number"
                        className="phone-input"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary send-btn"
                        disabled={loading || phone.length < 10}
                    >
                        {loading ? '...' : 'Send'}
                    </button>
                </div>
                {smsSent && (
                    <div className="success-message">
                        ✓ Invite sent!
                    </div>
                )}
            </form>

            <div className="divider">
                <span>or</span>
            </div>

            {/* Link Share */}
            <div className="link-section">
                <label className="input-label">Share invite link</label>
                <button
                    className="btn btn-secondary copy-link-btn"
                    onClick={handleCopyLink}
                >
                    {copied ? '✓ Copied!' : '📋 Copy Invite Link'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <style>{`
                .invite-modal {
                    padding: 24px;
                }
                
                .invite-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .invite-header h2 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 800;
                }
                
                .close-btn {
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
                
                .close-btn:hover {
                    background: var(--bg-glass-hover);
                    color: var(--text-primary);
                }
                
                .invite-description {
                    color: var(--text-secondary);
                    margin-bottom: 24px;
                    font-size: 14px;
                }
                
                .invite-form {
                    margin-bottom: 20px;
                }
                
                .input-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                
                .phone-input-group {
                    display: flex;
                    gap: 0;
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    border: 1px solid var(--border-subtle);
                }
                
                .phone-prefix {
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    background: var(--bg-secondary);
                    color: var(--text-muted);
                    font-size: 14px;
                    border-right: 1px solid var(--border-subtle);
                }
                
                .phone-input {
                    flex: 1;
                    padding: 14px 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 16px;
                    outline: none;
                }
                
                .phone-input::placeholder {
                    color: var(--text-muted);
                }
                
                .send-btn {
                    padding: 14px 20px;
                    border-radius: 0;
                    font-weight: 600;
                }
                
                .divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin: 24px 0;
                    color: var(--text-muted);
                    font-size: 13px;
                }
                
                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: var(--border-subtle);
                }
                
                .link-section {
                    margin-bottom: 16px;
                }
                
                .copy-link-btn {
                    width: 100%;
                    padding: 14px 20px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .success-message {
                    margin-top: 8px;
                    padding: 10px 14px;
                    background: rgba(16, 185, 129, 0.15);
                    color: var(--success);
                    border-radius: var(--radius-sm);
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .error-message {
                    margin-top: 12px;
                    padding: 10px 14px;
                    background: rgba(239, 68, 68, 0.15);
                    color: var(--error);
                    border-radius: var(--radius-sm);
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
}
