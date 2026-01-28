import { useState, useEffect, useCallback } from 'react';
import { WorldMap } from './components/WorldMap';
import { FriendsList } from './components/FriendsList';
import { Auth } from './components/Auth';
import { ContactSync } from './components/ContactSync';
import { EngagementBanners } from './components/EngagementBanners';
import { updateStreak } from './lib/streak';
import { useLocation } from './hooks/useLocation';
import { useVisibilityUpdate } from './hooks/useVisibilityUpdate';
import { api, isDemoMode, localBackend } from './lib/supabase';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('map'); // 'map', 'list', 'settings'
  const [showContactSync, setShowContactSync] = useState(false);

  const { location, requestLocation, permission, loading: locationLoading } = useLocation();

  // Load friends data
  const loadFriends = useCallback(async () => {
    try {
      const friendsData = await api.getFriends();
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        loadFriends();
      }
      setLoading(false);
    };
    checkUser();
  }, [loadFriends]);

  // Update location when app becomes visible
  const handleVisibilityUpdate = useCallback(async () => {
    if (user && permission === 'granted') {
      const loc = await requestLocation();
      if (loc) {
        await api.updateLocation(loc);
        updateStreak();
        loadFriends(); // Refresh friends too
      }
    }
  }, [user, permission, requestLocation, loadFriends]);

  useVisibilityUpdate(handleVisibilityUpdate);

  // Initial location request after auth
  useEffect(() => {
    if (user && !location) {
      requestLocation().then(async (loc) => {
        if (loc) {
          await api.updateLocation(loc);
          updateStreak();
        }
      });
    }
  }, [user, location, requestLocation]);

  // Handle authentication
  const handleAuthenticated = async (authUser) => {
    setUser(authUser);

    // Request location after login
    const loc = await requestLocation();
    if (loc) {
      await api.updateLocation(loc);
      updateStreak();
    }

    // Show contact sync prompt for new users
    const contacts = await api.getContacts();
    if (contacts.length === 0) {
      setShowContactSync(true);
    }

    loadFriends();
  };

  // Handle contact sync
  const handleContactSync = async () => {
    setShowContactSync(false);

    // In demo mode, create some demo friends for testing
    if (isDemoMode()) {
      await createDemoFriends();
    }

    loadFriends();
  };

  // Create demo friends for testing
  const createDemoFriends = async () => {
    const currentUser = await api.getCurrentUser();
    if (!currentUser) return;

    const demoFriends = [
      { id: 'demo_1', phone: '+1555123001', displayName: 'Alex Chen' },
      { id: 'demo_2', phone: '+1555123002', displayName: 'Jordan Smith' },
      { id: 'demo_3', phone: '+1555123003', displayName: 'Taylor Brown' },
      { id: 'demo_4', phone: '+1555123004', displayName: 'Sam Wilson' },
      { id: 'demo_5', phone: '+1555123005', displayName: 'Morgan Lee' }
    ];

    const demoLocations = [
      { city: 'San Francisco', country: 'United States', lat: 37.77, lng: -122.43 },
      { city: 'New York', country: 'United States', lat: 40.71, lng: -74.01 },
      { city: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.12 },
      { city: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.69 },
      { city: 'Paris', country: 'France', lat: 48.86, lng: 2.35 }
    ];

    // Create demo users and their locations
    for (let i = 0; i < demoFriends.length; i++) {
      const friend = demoFriends[i];
      const location = demoLocations[i];

      // Create user
      await localBackend.createUser(friend);

      // Add their location with varying freshness
      const hoursAgo = [2, 12, 36, 60, 4][i];
      await localBackend.updateLocation(friend.id, {
        ...location,
        updatedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
      });
    }

    // Add these as contacts for the current user so getFriends can find them
    const contacts = demoFriends.map(f => ({ name: f.displayName, phone: f.phone }));
    await localBackend.setContacts(currentUser.id, contacts);
    localStorage.setItem('whereinworld_contacts', JSON.stringify(contacts));
  };

  // Manual location update
  const handleUpdateLocation = async () => {
    const loc = await requestLocation();
    if (loc) {
      await api.updateLocation(loc);
      updateStreak();
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await api.signOut();
    setUser(null);
    setFriends([]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  // Contact sync modal
  if (showContactSync) {
    return (
      <div className="modal-overlay">
        <div className="modal glass-card slide-up">
          <ContactSync onSync={handleContactSync} />
          <button
            className="btn btn-ghost"
            onClick={() => {
              setShowContactSync(false);
              if (isDemoMode()) createDemoFriends().then(loadFriends);
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header glass-card">
        <div className="header-left">
          <span className="logo-mini">🌍</span>
          <span className="logo-text-mini">Where In World</span>
        </div>

        <div className="header-location">
          {location ? (
            <span className="current-location">
              📍 {location.city}, {location.country}
            </span>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={requestLocation}
              disabled={locationLoading}
            >
              {locationLoading ? 'Getting location...' : 'Enable Location'}
            </button>
          )}
        </div>

        <div className="header-right">
          <button
            className="icon-btn"
            onClick={() => setShowContactSync(true)}
            title="Sync Contacts"
          >
            👥
          </button>
          <button
            className="icon-btn"
            onClick={handleSignOut}
            title="Sign Out"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Engagement Banners */}
      <EngagementBanners
        friends={friends}
        userLocation={location}
        lastLocationUpdate={location?.updatedAt}
        onUpdateLocation={handleUpdateLocation}
      />

      {/* Main Content */}
      <main className="app-main">
        <div className="content-grid">
          {/* Map Panel */}
          <div className="map-panel glass-card">
            <WorldMap
              friends={friends}
              userLocation={location}
              onSelectFriend={(friend) => console.log('Selected:', friend)}
            />
          </div>

          {/* Friends Panel */}
          <div className="friends-panel">
            <FriendsList
              friends={friends}
              userLocation={location}
              onSelectFriend={(friend) => console.log('Selected:', friend)}
            />
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="mobile-nav glass-card">
        <button
          className={`nav-btn ${view === 'map' ? 'active' : ''}`}
          onClick={() => setView('map')}
        >
          <span>🗺️</span>
          <span>Map</span>
        </button>
        <button
          className={`nav-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          <span>👥</span>
          <span>Friends</span>
        </button>
        <button
          className="nav-btn update-btn"
          onClick={handleUpdateLocation}
          disabled={locationLoading}
        >
          <span>📍</span>
          <span>Update</span>
        </button>
      </nav>

      <style>{`
        .app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-primary);
        }
        
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 16px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--bg-tertiary);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Header */
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          margin: 12px;
          border-radius: var(--radius-lg);
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .logo-mini {
          font-size: 28px;
        }
        
        .logo-text-mini {
          font-size: 18px;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .current-location {
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .header-right {
          display: flex;
          gap: 8px;
        }
        
        .icon-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          font-size: 18px;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        
        .icon-btn:hover {
          background: var(--bg-glass-hover);
        }
        
        /* Main Content */
        .app-main {
          flex: 1;
          padding: 0 12px 12px;
          overflow: hidden;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 12px;
          height: 100%;
        }
        
        .map-panel {
          overflow: hidden;
          padding: 0;
        }
        
        .friends-panel {
          overflow: hidden;
        }
        
        /* Mobile Navigation */
        .mobile-nav {
          display: none;
          padding: 8px 20px 20px;
          margin: 0 12px 12px;
          border-radius: var(--radius-lg);
        }
        
        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
          padding: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 11px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .nav-btn span:first-child {
          font-size: 22px;
        }
        
        .nav-btn.active {
          color: var(--accent-primary);
        }
        
        .nav-btn.update-btn {
          background: var(--accent-gradient);
          color: white;
          border-radius: var(--radius-md);
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }
        
        .modal {
          width: 100%;
          max-width: 420px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        /* Responsive */
        @media (max-width: 900px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .friends-panel {
            display: none;
          }
          
          .mobile-nav {
            display: flex;
          }
          
          .app-main {
            padding-bottom: 100px;
          }
        }
        
        @media (max-width: 600px) {
          .header-location {
            display: none;
          }
          
          .logo-text-mini {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
