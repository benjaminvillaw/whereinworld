import { useState, useEffect, useCallback, useRef } from 'react';
import { CityList } from './components/CityList';
import { CityDetail } from './components/CityDetail';
import { FriendsList } from './components/FriendsList';
import { Auth } from './components/Auth';
import { ContactSync } from './components/ContactSync';
import { InviteFriends } from './components/InviteFriends';
import { Settings } from './components/Settings';
import { MapView } from './components/MapView';
import { ArrivalNotification } from './components/ArrivalNotification';
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
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'map', 'chat', 'profile'
  const [selectedCity, setSelectedCity] = useState(null);
  const [showContactSync, setShowContactSync] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [arrivals, setArrivals] = useState([]); // Track friend arrivals for notifications
  const [refreshing, setRefreshing] = useState(false);

  // Track previous friend locations to detect changes
  const prevFriendLocations = useRef({});

  const { location, requestLocation, permission, loading: locationLoading } = useLocation();

  // Load friends data and detect arrivals
  const loadFriends = useCallback(async () => {
    try {
      const friendsData = await api.getFriends();

      // Detect friends who arrived in user's city
      const userCity = location?.city;
      if (userCity && Object.keys(prevFriendLocations.current).length > 0) {
        const newArrivals = [];
        friendsData.forEach(friend => {
          const currentCity = friend.location?.city;
          const previousCity = prevFriendLocations.current[friend.id];

          // Friend just arrived in user's city (was elsewhere before)
          if (currentCity === userCity && previousCity !== userCity && previousCity !== undefined) {
            newArrivals.push({
              friend: friend, // Store full friend object for notification
              friendName: friend.displayName || friend.display_name || 'A friend',
              city: currentCity,
              timestamp: Date.now()
            });
          }
        });

        if (newArrivals.length > 0) {
          setArrivals(prev => [...newArrivals, ...prev].slice(0, 5)); // Keep max 5
        }
      }

      // Update previous locations for next comparison
      const newPrevLocations = {};
      friendsData.forEach(f => {
        newPrevLocations[f.id] = f.location?.city;
      });
      prevFriendLocations.current = newPrevLocations;

      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  }, [location?.city]);

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
    if (user && permission === 'granted' && !ghostMode) {
      const loc = await requestLocation();
      if (loc) {
        await api.updateLocation(loc);
        updateStreak();
        loadFriends();
      }
    }
  }, [user, permission, requestLocation, loadFriends, ghostMode]);

  useVisibilityUpdate(handleVisibilityUpdate);

  // Initial location request after auth
  useEffect(() => {
    if (user && !location && !ghostMode) {
      requestLocation().then(async (loc) => {
        if (loc) {
          await api.updateLocation(loc);
          updateStreak();
        }
      });
    }
  }, [user, location, requestLocation, ghostMode]);

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
      { id: 'demo_1', phone: '+1555123001', displayName: 'Felix Chen', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: 'demo_2', phone: '+1555123002', displayName: 'Sarah Jenkins', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { id: 'demo_3', phone: '+1555123003', displayName: 'Marcus Wright', avatar_url: 'https://randomuser.me/api/portraits/men/75.jpg' },
      { id: 'demo_4', phone: '+1555123004', displayName: 'Elena Rossi', avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'demo_5', phone: '+1555123005', displayName: 'Alex Chen', avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg' },
      { id: 'demo_6', phone: '+1555123006', displayName: 'Jordan Smith', avatar_url: 'https://randomuser.me/api/portraits/women/28.jpg' },
      { id: 'demo_7', phone: '+1555123007', displayName: 'Taylor Brown', avatar_url: 'https://randomuser.me/api/portraits/men/45.jpg' },
      { id: 'demo_8', phone: '+1555123008', displayName: 'Priya Patel', avatar_url: 'https://randomuser.me/api/portraits/women/55.jpg' }
    ];

    const demoLocations = [
      { city: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.12, neighborhood: 'Soho' },
      { city: 'London', country: 'United Kingdom', lat: 51.50, lng: -0.11, neighborhood: 'Southbank' },
      { city: 'London', country: 'United Kingdom', lat: 51.52, lng: -0.08, neighborhood: 'Shoreditch' },
      { city: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.15, neighborhood: 'Mayfair' },
      { city: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.69, neighborhood: 'Shibuya' },
      { city: 'New York', country: 'United States', lat: 40.71, lng: -74.01, neighborhood: 'SoHo' },
      { city: 'Paris', country: 'France', lat: 48.86, lng: 2.35, neighborhood: 'Le Marais' },
      { city: 'San Francisco', country: 'United States', lat: 37.77, lng: -122.43, neighborhood: 'Mission' }
    ];

    // Create demo users and their locations
    for (let i = 0; i < demoFriends.length; i++) {
      const friend = demoFriends[i];
      const location = demoLocations[i];

      // Create user
      await localBackend.createUser(friend);

      // Add their location with varying freshness
      const minutesAgo = [2, 5, 120, 3, 720, 240, 1440, 30][i];
      await localBackend.updateLocation(friend.id, {
        ...location,
        updatedAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
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

  // Handle tab changes
  const handleTabChange = (tab) => {
    if (tab === 'profile') {
      setShowSettings(true);
    } else {
      setActiveTab(tab);
      setSelectedCity(null);
    }
  };

  // Demo function to test arrival notification (can be triggered from console)
  const triggerDemoArrival = () => {
    const demoFriend = friends[0] || {
      id: 'demo',
      displayName: 'Alex Chen',
      avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
    };
    setArrivals([{
      friend: demoFriend,
      friendName: demoFriend.displayName || 'Alex',
      city: location?.city || 'Boston',
      timestamp: Date.now()
    }]);
  };

  // Expose demo function to window for testing
  if (typeof window !== 'undefined') {
    window.triggerDemoArrival = triggerDemoArrival;
  }

  // Loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p className="font-bold uppercase tracking-wide">Loading...</p>
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
        <div className="modal glass-card animate-slide-up p-6">
          <ContactSync onSync={handleContactSync} />
          <button
            className="btn btn-secondary w-full mt-4"
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

  // Settings view
  if (showSettings) {
    return (
      <Settings
        user={user}
        onBack={() => setShowSettings(false)}
        ghostMode={ghostMode}
        onGhostModeChange={setGhostMode}
        onLogout={async () => {
          await api.signOut();
          setUser(null);
          setShowSettings(false);
        }}
        onUserUpdate={(updatedUser) => setUser(updatedUser)}
      />
    );
  }

  // City detail view
  if (selectedCity) {
    return (
      <CityDetail
        city={selectedCity}
        onBack={() => setSelectedCity(null)}
      />
    );
  }

  return (
    <div className="app">
      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal glass-card animate-slide-up p-6" onClick={e => e.stopPropagation()}>
            <InviteFriends
              onClose={() => setShowInvite(false)}
              onInviteSent={loadFriends}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {/* Engagement Banners with Friend Arrivals */}
        <EngagementBanners
          friends={friends}
          arrivals={arrivals}
          userLocation={location}
          lastLocationUpdate={location?.updatedAt}
          onUpdateLocation={handleUpdateLocation}
          onDismissArrival={(index) => setArrivals(prev => prev.filter((_, i) => i !== index))}
        />

        {activeTab === 'grid' && (
          <CityList
            friends={ghostMode ? [] : friends}
            userLocation={location}
            user={user}
            ghostMode={ghostMode}
            notificationsMuted={notificationsMuted}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadFriends();
              await requestLocation();
              setRefreshing(false);
            }}
            onSettings={() => setShowSettings(true)}
            onSelectCity={setSelectedCity}
            onSelectFriend={(friend) => console.log('Selected:', friend)}
            onInvite={() => setShowInvite(true)}
            onToggleGhostMode={() => setGhostMode(!ghostMode)}
            onToggleNotifications={() => setNotificationsMuted(!notificationsMuted)}
            onUpdateLocation={handleUpdateLocation}
            onMapView={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            friends={ghostMode ? [] : friends}
            userLocation={location}
            onSelectCity={setSelectedCity}
          />
        )}

        {activeTab === 'chat' && (
          <div className="map-placeholder">
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', opacity: 0.3 }}>chat_bubble</span>
            <p className="font-bold uppercase mt-4" style={{ color: 'var(--text-muted)' }}>Chat Coming Soon</p>
          </div>
        )}
      </main>

      {/* Arrival Notification Modal */}
      {arrivals.length > 0 && !notificationsMuted && arrivals[0].friend && (
        <ArrivalNotification
          friend={arrivals[0].friend}
          city={arrivals[0].city}
          onSayHi={(friend) => {
            console.log('Say hi to:', friend);
            // Could open chat or send a greeting
          }}
          onDismiss={() => setArrivals(prev => prev.slice(1))}
        />
      )}

      <style>{`
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--background-dark);
        }
        
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 1rem;
          background: var(--background-dark);
          color: var(--text-primary);
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
        
        .app-main {
          flex: 1;
          overflow: hidden;
        }
        
        .map-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: var(--text-muted);
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 1000;
        }
        
        .modal {
          width: 100%;
          max-width: 26rem;
          max-height: 80vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

export default App;
