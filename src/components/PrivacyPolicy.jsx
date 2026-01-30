import { useState } from 'react';

export function PrivacyPolicy({ onBack }) {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <button className="btn-icon" onClick={onBack}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="legal-title">Privacy Policy</h2>
                <div style={{ width: '3rem' }}></div>
            </header>

            <main className="legal-content">
                <p className="legal-updated">Last updated: January 30, 2026</p>

                <section className="legal-section">
                    <h3>Overview</h3>
                    <p>
                        Where In World ("we," "us," or "our") is committed to protecting your privacy.
                        This Privacy Policy explains how we collect, use, and share information when you
                        use our mobile application.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Information We Collect</h3>
                    <h4>Location Data</h4>
                    <p>
                        We collect your city-level location only. We do NOT collect or store your exact
                        GPS coordinates, street address, or precise location. Your location is generalized
                        to the nearest major city for sharing with friends.
                    </p>

                    <h4>Account Information</h4>
                    <p>
                        When you create an account, we collect your phone number for authentication
                        and your display name. You may optionally provide a profile photo.
                    </p>

                    <h4>Usage Data</h4>
                    <p>
                        We collect anonymous usage data to improve the app, including feature usage
                        patterns and app performance metrics.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>How We Use Your Information</h3>
                    <ul>
                        <li>To show your city-level location to your approved friends</li>
                        <li>To show you where your friends are located</li>
                        <li>To send notifications about friend activity</li>
                        <li>To improve and maintain our services</li>
                        <li>To communicate important updates about the app</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h3>Information Sharing</h3>
                    <p>
                        Your city-level location is only shared with friends you have mutually connected
                        with through the app. We do not sell your personal information to third parties.
                    </p>
                    <p>
                        We may share anonymized, aggregated data for analytics purposes.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Ghost Mode</h3>
                    <p>
                        You can enable Ghost Mode at any time to hide your location from all friends.
                        While in Ghost Mode, your location is not visible to anyone and you will not
                        see your friends' locations.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Data Retention</h3>
                    <p>
                        We retain your account information and location history for as long as your
                        account is active. You can delete your account at any time from Settings,
                        which will permanently remove all your data.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Security</h3>
                    <p>
                        We use industry-standard security measures to protect your information,
                        including encrypted data transmission and secure storage.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Your Rights</h3>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate information</li>
                        <li>Delete your account and all associated data</li>
                        <li>Opt out of location sharing using Ghost Mode</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h3>Contact Us</h3>
                    <p>
                        If you have questions about this Privacy Policy, please contact us at
                        privacy@whereinworld.app
                    </p>
                </section>
            </main>

            <style>{`
                .legal-page {
                    min-height: 100vh;
                    width: 100%;
                    max-width: 28rem;
                    margin: 0 auto;
                    background: var(--background-dark);
                    color: white;
                }

                .legal-header {
                    position: sticky;
                    top: 0;
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem;
                    background: var(--background-dark);
                    border-bottom: 1px solid var(--surface-border);
                }

                .legal-title {
                    font-size: 1.25rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .legal-content {
                    padding: 1.5rem;
                    padding-bottom: 4rem;
                }

                .legal-updated {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-bottom: 2rem;
                }

                .legal-section {
                    margin-bottom: 2rem;
                }

                .legal-section h3 {
                    font-size: 1.1rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                    color: var(--accent-lime);
                    margin-bottom: 0.75rem;
                }

                .legal-section h4 {
                    font-size: 0.9rem;
                    font-weight: 700;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    color: white;
                }

                .legal-section p {
                    font-size: 0.875rem;
                    line-height: 1.6;
                    color: var(--text-secondary);
                    margin-bottom: 0.75rem;
                }

                .legal-section ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .legal-section li {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    padding-left: 1.5rem;
                    position: relative;
                    margin-bottom: 0.5rem;
                    line-height: 1.5;
                }

                .legal-section li::before {
                    content: "•";
                    color: var(--accent-lime);
                    position: absolute;
                    left: 0;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}
