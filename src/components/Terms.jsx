import { useState } from 'react';

export function Terms({ onBack }) {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <button className="btn-icon" onClick={onBack}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="legal-title">Terms & Conditions</h2>
                <div style={{ width: '3rem' }}></div>
            </header>

            <main className="legal-content">
                <p className="legal-updated">Last updated: January 30, 2026</p>

                <section className="legal-section">
                    <h3>Agreement to Terms</h3>
                    <p>
                        By accessing or using Where In World ("the App"), you agree to be bound by these
                        Terms and Conditions. If you do not agree with any part of these terms, you may
                        not use the App.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Description of Service</h3>
                    <p>
                        Where In World is a social location-sharing application that allows users to
                        share their city-level location with approved friends. The App displays only
                        city-level locations, not precise GPS coordinates.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>User Accounts</h3>
                    <p>
                        To use the App, you must create an account using a valid phone number. You are
                        responsible for maintaining the confidentiality of your account and for all
                        activities that occur under your account.
                    </p>
                    <p>
                        You agree to provide accurate information and to update your information as
                        necessary to keep it accurate.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Acceptable Use</h3>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Use the App for any unlawful purpose</li>
                        <li>Harass, stalk, or harm other users</li>
                        <li>Impersonate another person or entity</li>
                        <li>Share false or misleading location information</li>
                        <li>Attempt to gain unauthorized access to the App or its systems</li>
                        <li>Use automated systems to access the App without permission</li>
                        <li>Interfere with the proper functioning of the App</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h3>Location Sharing</h3>
                    <p>
                        By using the App, you consent to share your city-level location with friends
                        you have connected with. You can control your location visibility using Ghost
                        Mode at any time.
                    </p>
                    <p>
                        You understand that friends may see when you enter or leave cities, and this
                        information may be used for notifications.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Friend Connections</h3>
                    <p>
                        Friend connections require mutual consent. By accepting a friend invitation,
                        you agree to share your location with that user and to receive their location
                        updates.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Intellectual Property</h3>
                    <p>
                        The App and its original content, features, and functionality are owned by
                        Where In World and are protected by copyright, trademark, and other intellectual
                        property laws.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Disclaimer of Warranties</h3>
                    <p>
                        The App is provided "as is" without warranties of any kind, either express or
                        implied. We do not guarantee that the App will be error-free, secure, or
                        continuously available.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Limitation of Liability</h3>
                    <p>
                        To the maximum extent permitted by law, Where In World shall not be liable for
                        any indirect, incidental, special, consequential, or punitive damages arising
                        from your use of the App.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Account Termination</h3>
                    <p>
                        We reserve the right to terminate or suspend your account at any time for
                        violations of these Terms. You may delete your account at any time from the
                        Settings menu.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Changes to Terms</h3>
                    <p>
                        We may update these Terms from time to time. Continued use of the App after
                        changes constitutes acceptance of the new Terms.
                    </p>
                </section>

                <section className="legal-section">
                    <h3>Contact</h3>
                    <p>
                        For questions about these Terms, please contact us at
                        legal@whereinworld.app
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
