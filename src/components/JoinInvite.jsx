import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import { Auth } from './Auth';

export function JoinInvite() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);

    // Check for existing session
    useEffect(() => {
        api.getCurrentUser().then(setUser);
    }, []);

    // Look up invite code
    useEffect(() => {
        if (!code) {
            setError('No invite code provided');
            setLoading(false);
            return;
        }

        api.lookupInvite(code)
            .then(data => {
                setInvite(data.invite);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || 'Invalid invite code');
                setLoading(false);
            });
    }, [code]);

    const handleAuthenticated = async (authUser) => {
        setUser(authUser);
        // After auth, automatically accept the invite
        handleAcceptInvite(authUser);
    };

    const handleAcceptInvite = async (currentUser = user) => {
        if (!currentUser || !code) return;

        setAccepting(true);
        try {
            await api.acceptInvite(code);
            setAccepted(true);
            // Redirect to main app after short delay
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.message || 'Failed to accept invite');
        } finally {
            setAccepting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="join-page">
                <div className="join-content">
                    <div className="loading-spinner"></div>
                    <p>Loading invite...</p>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="join-page">
                <div className="join-content error">
                    <span className="error-icon">❌</span>
                    <h1>Invite Not Found</h1>
                    <p>{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                    >
                        Go to App
                    </button>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // Accepted state
    if (accepted) {
        return (
            <div className="join-page">
                <div className="join-content success">
                    <span className="success-icon">🎉</span>
                    <h1>You're Connected!</h1>
                    <p>You and {invite?.inviterName || 'your friend'} can now see each other's locations.</p>
                    <p className="redirect-text">Redirecting to app...</p>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // Not logged in - show auth with invite context
    if (!user) {
        return (
            <div className="join-page">
                <div className="invite-banner">
                    <p>
                        <strong>{invite?.inviterName || 'A friend'}</strong> invited you to see where each other are!
                    </p>
                </div>
                <Auth
                    onAuthenticated={handleAuthenticated}
                    inviteCode={code}
                />
                <style>{styles}</style>
            </div>
        );
    }

    // Logged in - show accept button
    return (
        <div className="join-page">
            <div className="join-content">
                <h1>📍 Join Invite</h1>
                <p className="invite-message">
                    <strong>{invite?.inviterName || 'A friend'}</strong> wants to connect with you on Where In World!
                </p>
                <p className="invite-description">
                    Once connected, you'll be able to see each other's cities.
                </p>
                <button
                    className="btn btn-primary accept-btn"
                    onClick={() => handleAcceptInvite()}
                    disabled={accepting}
                >
                    {accepting ? 'Accepting...' : '✓ Accept Invite'}
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/')}
                >
                    Go Back
                </button>
            </div>
            <style>{styles}</style>
        </div>
    );
}

const styles = `
    .join-page {
        min-height: 100vh;
        background: var(--background-dark);
        display: flex;
        flex-direction: column;
    }

    .invite-banner {
        background: linear-gradient(135deg, var(--primary), var(--accent));
        color: white;
        padding: 16px 24px;
        text-align: center;
        font-size: 15px;
    }

    .join-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
        text-align: center;
        gap: 16px;
    }

    .join-content h1 {
        font-size: 28px;
        font-weight: 800;
        margin: 0;
        color: var(--text-primary);
    }

    .join-content p {
        color: var(--text-secondary);
        margin: 0;
        max-width: 320px;
    }

    .invite-message {
        font-size: 18px;
        color: var(--text-primary) !important;
    }

    .invite-description {
        font-size: 14px;
    }

    .accept-btn {
        margin-top: 16px;
        padding: 16px 48px;
        font-size: 16px;
        font-weight: 700;
    }

    .error-icon, .success-icon {
        font-size: 64px;
        margin-bottom: 8px;
    }

    .join-content.error h1,
    .join-content.success h1 {
        margin-top: 8px;
    }

    .redirect-text {
        font-size: 13px;
        opacity: 0.6;
        margin-top: 16px !important;
    }

    .loading-spinner {
        width: 3rem;
        height: 3rem;
        border: 4px solid var(--surface-border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
