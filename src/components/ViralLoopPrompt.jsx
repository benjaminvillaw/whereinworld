import { useState, useEffect } from 'react';

export function ViralLoopPrompt({ inviteLink, onClose }) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleClose = () => {
        setVisible(false);
        // Only dismiss for this session - will show again next visit
        sessionStorage.setItem('viralPromptDismissed', 'true');
        setTimeout(onClose, 200);
    };

    // Permanently dismiss after user takes action (share or copy)
    const handlePermanentDismiss = () => {
        localStorage.setItem('viralPromptShown', 'true');
        setVisible(false);
        setTimeout(onClose, 200);
    };

    const handleWhatsAppShare = () => {
        const message = `🌍 Where are all our friends around the world? Join me on Where in World to find out!\n\n${inviteLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        handlePermanentDismiss(); // Permanently dismiss after sharing
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            // Permanently dismiss after copying
            localStorage.setItem('viralPromptShown', 'true');
            setTimeout(() => {
                setCopied(false);
                handlePermanentDismiss();
            }, 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`viral-overlay ${visible ? 'visible' : ''}`} onClick={handleClose}>
            <div className={`viral-popup ${visible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="viral-close" onClick={handleClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Animated Icon */}
                <div className="viral-icon-container">
                    <div className="viral-globe">🌍</div>
                    <div className="viral-sparkles">
                        <span className="sparkle sparkle-1">✨</span>
                        <span className="sparkle sparkle-2">✨</span>
                        <span className="sparkle sparkle-3">✨</span>
                    </div>
                </div>

                {/* Header */}
                <h2 className="viral-title">
                    Find where ALL your<br />
                    friends are!
                </h2>

                <p className="viral-subtitle">
                    Share this link on WhatsApp to invite your group chats and see friends across the world 🚀
                </p>

                {/* WhatsApp CTA */}
                <button className="viral-whatsapp-btn" onClick={handleWhatsAppShare}>
                    <svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share on WhatsApp
                </button>

                {/* Or copy link */}
                <div className="viral-divider">
                    <span>or</span>
                </div>

                <button className="viral-copy-btn" onClick={handleCopyLink}>
                    <span className="material-symbols-outlined">
                        {copied ? 'check' : 'content_copy'}
                    </span>
                    {copied ? 'Link Copied!' : 'Copy Invite Link'}
                </button>

                {/* Skip option */}
                <button className="viral-skip" onClick={handleClose}>
                    Maybe Later
                </button>

                <style>{`
                    .viral-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.8);
                        backdrop-filter: blur(10px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 200;
                        opacity: 0;
                        transition: opacity 0.2s ease;
                        padding: 1.5rem;
                    }

                    .viral-overlay.visible {
                        opacity: 1;
                    }

                    .viral-popup {
                        background: linear-gradient(145deg, #1a1a2e 0%, #12121f 100%);
                        border: 2px solid rgba(204, 255, 0, 0.4);
                        border-radius: 1.5rem;
                        padding: 2rem 1.5rem;
                        width: 100%;
                        max-width: 22rem;
                        position: relative;
                        text-align: center;
                        transform: scale(0.9) translateY(20px);
                        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                        box-shadow: 
                            0 25px 80px rgba(0, 0, 0, 0.6),
                            0 0 60px rgba(204, 255, 0, 0.1);
                    }

                    .viral-popup.visible {
                        transform: scale(1) translateY(0);
                    }

                    .viral-close {
                        position: absolute;
                        top: 0.75rem;
                        right: 0.75rem;
                        width: 2rem;
                        height: 2rem;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.1);
                        border: none;
                        color: rgba(255, 255, 255, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .viral-close:hover {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                    }

                    .viral-close .material-symbols-outlined {
                        font-size: 1.125rem;
                    }

                    .viral-icon-container {
                        position: relative;
                        width: 5rem;
                        height: 5rem;
                        margin: 0 auto 1.25rem;
                    }

                    .viral-globe {
                        font-size: 4rem;
                        animation: viralBounce 2s ease-in-out infinite;
                    }

                    @keyframes viralBounce {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        25% { transform: translateY(-8px) rotate(-5deg); }
                        75% { transform: translateY(-4px) rotate(5deg); }
                    }

                    .viral-sparkles {
                        position: absolute;
                        inset: 0;
                    }

                    .sparkle {
                        position: absolute;
                        font-size: 1rem;
                        animation: viralSparkle 1.5s ease-in-out infinite;
                    }

                    .sparkle-1 { top: -5px; left: 0; animation-delay: 0s; }
                    .sparkle-2 { top: 10px; right: -10px; animation-delay: 0.3s; }
                    .sparkle-3 { bottom: 0; left: 5px; animation-delay: 0.6s; }

                    @keyframes viralSparkle {
                        0%, 100% { opacity: 0.3; transform: scale(0.8); }
                        50% { opacity: 1; transform: scale(1.2); }
                    }

                    .viral-title {
                        font-size: 1.5rem;
                        font-weight: 900;
                        color: white;
                        margin: 0 0 0.75rem;
                        line-height: 1.2;
                        text-transform: uppercase;
                        letter-spacing: 0.02em;
                    }

                    .viral-subtitle {
                        font-size: 0.9375rem;
                        color: rgba(255, 255, 255, 0.6);
                        margin: 0 0 1.5rem;
                        line-height: 1.5;
                    }

                    .viral-whatsapp-btn {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.75rem;
                        padding: 1rem;
                        background: #25D366;
                        color: white;
                        font-size: 1rem;
                        font-weight: 700;
                        border: none;
                        border-radius: 0.875rem;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }

                    .viral-whatsapp-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
                    }

                    .whatsapp-icon {
                        width: 1.5rem;
                        height: 1.5rem;
                    }

                    .viral-divider {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        margin: 1rem 0;
                        color: rgba(255, 255, 255, 0.3);
                        font-size: 0.75rem;
                        text-transform: uppercase;
                    }

                    .viral-divider::before,
                    .viral-divider::after {
                        content: '';
                        flex: 1;
                        height: 1px;
                        background: rgba(255, 255, 255, 0.15);
                    }

                    .viral-copy-btn {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        padding: 0.875rem;
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        font-size: 0.9375rem;
                        font-weight: 600;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 0.75rem;
                        cursor: pointer;
                        transition: background 0.2s;
                    }

                    .viral-copy-btn:hover {
                        background: rgba(255, 255, 255, 0.15);
                    }

                    .viral-copy-btn .material-symbols-outlined {
                        font-size: 1.25rem;
                    }

                    .viral-skip {
                        margin-top: 1rem;
                        padding: 0.5rem 1rem;
                        background: none;
                        border: none;
                        color: rgba(255, 255, 255, 0.4);
                        font-size: 0.8125rem;
                        cursor: pointer;
                        transition: color 0.2s;
                    }

                    .viral-skip:hover {
                        color: rgba(255, 255, 255, 0.6);
                    }
                `}</style>
            </div>
        </div>
    );
}
