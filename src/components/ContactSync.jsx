import { useState, useEffect } from 'react';
import { api } from '../lib/supabase';

export function ContactSync({ onSync }) {
    const [syncing, setSyncing] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [error, setError] = useState('');
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        // Check if Contact Picker API is supported
        setSupported('contacts' in navigator && 'ContactsManager' in window);

        // Load cached contacts
        api.getContacts().then(cached => {
            if (cached.length > 0) {
                setContacts(cached);
            }
        });
    }, []);

    const handleSync = async () => {
        if (!supported) {
            // Fallback: show manual entry modal
            setError('Contact sync is not supported in this browser. Try Chrome on Android.');
            return;
        }

        setSyncing(true);
        setError('');

        try {
            const props = ['name', 'tel'];
            const opts = { multiple: true };

            const selectedContacts = await navigator.contacts.select(props, opts);

            // Normalize contacts
            const normalized = selectedContacts
                .filter(c => c.tel && c.tel.length > 0)
                .map(c => ({
                    name: c.name?.[0] || 'Unknown',
                    phone: c.tel[0]
                }));

            // Save to backend
            await api.syncContacts(normalized);
            setContacts(normalized);
            onSync?.(normalized);

        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'Failed to sync contacts');
            }
        } finally {
            setSyncing(false);
        }
    };

    const addDemoContacts = async () => {
        // Add some demo contacts for testing
        const demoContacts = [
            { name: 'Alex Chen', phone: '+1555123001' },
            { name: 'Jordan Smith', phone: '+1555123002' },
            { name: 'Taylor Brown', phone: '+1555123003' },
            { name: 'Sam Wilson', phone: '+1555123004' },
            { name: 'Morgan Lee', phone: '+1555123005' }
        ];

        await api.syncContacts(demoContacts);
        setContacts(demoContacts);
        onSync?.(demoContacts);
    };

    return (
        <div className="contact-sync">
            <div className="sync-header">
                <h3>Your Contacts</h3>
                <span className="contact-count">{contacts.length} synced</span>
            </div>

            {contacts.length === 0 ? (
                <div className="sync-empty">
                    <div className="sync-icon">📱</div>
                    <p>Sync your contacts to find friends on Where In World</p>

                    <button
                        className="btn btn-primary"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? 'Syncing...' : 'Sync Contacts'}
                    </button>

                    {!supported && (
                        <button
                            className="btn btn-secondary mt-4"
                            onClick={addDemoContacts}
                        >
                            Add Demo Contacts
                        </button>
                    )}
                </div>
            ) : (
                <div className="synced-list">
                    <div className="synced-preview">
                        {contacts.slice(0, 5).map((contact, i) => (
                            <div key={i} className="synced-contact">
                                <div className="contact-avatar">
                                    {contact.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="contact-info">
                                    <div className="contact-name">{contact.name}</div>
                                    <div className="contact-phone">{contact.phone}</div>
                                </div>
                            </div>
                        ))}
                        {contacts.length > 5 && (
                            <div className="more-contacts">
                                +{contacts.length - 5} more contacts
                            </div>
                        )}
                    </div>

                    <button
                        className="btn btn-secondary full-width"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? 'Syncing...' : 'Update Contacts'}
                    </button>
                </div>
            )}

            {error && (
                <div className="sync-error">
                    {error}
                </div>
            )}

            <style>{`
        .contact-sync {
          padding: 20px;
        }
        
        .sync-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .sync-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .contact-count {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .sync-empty {
          text-align: center;
          padding: 40px 20px;
        }
        
        .sync-icon {
          font-size: 56px;
          margin-bottom: 16px;
        }
        
        .sync-empty p {
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        
        .synced-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .synced-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .synced-contact {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .contact-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          font-size: 14px;
        }
        
        .contact-info {
          flex: 1;
        }
        
        .contact-name {
          font-weight: 500;
          font-size: 14px;
        }
        
        .contact-phone {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .more-contacts {
          text-align: center;
          color: var(--text-secondary);
          font-size: 13px;
          padding: 10px;
        }
        
        .full-width {
          width: 100%;
        }
        
        .sync-error {
          margin-top: 16px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: var(--radius-md);
          color: var(--danger);
          font-size: 13px;
        }
      `}</style>
        </div>
    );
}
