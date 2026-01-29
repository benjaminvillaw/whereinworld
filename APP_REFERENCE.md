# WhereInWorld — App Reference

> **Purpose**: This is a living document that tracks everything the app currently does. It should be updated after each significant change so we always know what we're working with.

---

## 🎯 Core Purpose

**WhereInWorld** is a low-fidelity, high-trust location sharing app. It allows friends to see each other's current **city** without revealing precise GPS coordinates—prioritizing privacy while enabling connection.

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend | **React 19** + **Vite 7** | Component-based UI with fast dev builds |
| Backend/DB | **Supabase** | Postgres database, Auth, and Realtime |
| Hosting | **Vercel** | Serverless functions for `/api` + frontend |
| Maps | **Leaflet** + **react-leaflet** | Optional interactive world map view |
| SMS | **Twilio** | OTP authentication & invite SMS delivery |

---

## 🔐 Authentication

- **SMS OTP Flow**: Users sign in with phone number → receive 6-digit code via Twilio → verify to access.
- **Multi-Strategy Backend**:
  1. Vercel Serverless (`/api/auth/*`) — production
  2. Direct Supabase Client — if backend unavailable
  3. LocalStorage Demo Mode — offline fallback
- **Session Tokens**: Stored in `localStorage.whereinworld_session_token`
- **Test Bypass**: Phone `+15550001234` with code `123456` (only when `ALLOW_TEST_BYPASS=true`)

---

## 📍 Location Features

| Feature | Description |
| :--- | :--- |
| **City-Level Sharing** | Shows `city, country` — not exact lat/lng |
| **Nearby Detection** | Friends within **50km** get a "Nearby" badge |
| **Freshness Decay** | Locations >72hrs old appear faded/stale |
| **Auto-Update on Return** | Location refreshes when app tab becomes visible |
| **Ghost Mode** | Disables automatic location updates for privacy |

---

## 👥 Friends & Social

| Feature | Description |
| :--- | :--- |
| **Contact Sync** | Matches synced contacts against app user base |
| **Friendships Table** | Explicit mutual connections via invites |
| **SMS Invites** | Send invite via Twilio text with unique code |
| **Shareable Links** | Copy `/join/[code]` link to share anywhere |
| **Auto-Connect** | Invitee is automatically added as friend on signup |

---

## 🏙 Primary Views (UI)

### 1. CityList View (`view === 'cities'`)
- Your current city displayed first
- Cities grouped by friend density
- Friends sorted by location freshness
- Vertical cards with grayscale imagery + color accents

### 2. FriendsList View (`view === 'list'`)
- All friends listed alphabetically
- Shows city, "Nearby" badges, and freshness indicators

### 3. WorldMap View (`view === 'map'`)
- Interactive Leaflet map with friend markers
- Optional—can be toggled via bottom nav

### 4. Settings View (`view === 'settings'`)
- Profile management (display name)
- Ghost Mode toggle
- Privacy preferences (accuracy, alert frequency)
- Sign out

---

## 📦 Key Components

| Component | File | Purpose |
| :--- | :--- | :--- |
| Auth | `Auth.jsx` | Phone login + OTP verification |
| CityList | `CityList.jsx` | Primary city-grouped friends view |
| CityDetail | `CityDetail.jsx` | Expanded view of a single city's friends |
| FriendsList | `FriendsList.jsx` | Alphabetical friends list |
| WorldMap | `WorldMap.jsx` | Leaflet map with markers |
| InviteFriends | `InviteFriends.jsx` | Modal for SMS/link invites |
| ContactSync | `ContactSync.jsx` | Contact import modal |
| Settings | `Settings.jsx` | User preferences & profile |
| BottomNav | `BottomNav.jsx` | Mobile navigation bar |
| EngagementBanners | `EngagementBanners.jsx` | Nearby alerts & prompts |

---

## 🗄 Database Schema

| Table | Purpose |
| :--- | :--- |
| `users` | User accounts (phone, display_name, is_ghost, accuracy) |
| `locations` | Current city-level location per user |
| `contacts` | Synced phone contacts |
| `friendships` | Explicit friend connections |
| `invites` | SMS/link invite tracking |
| `otp_codes` | Temporary verification codes |
| `sessions` | Persistent auth tokens |

---

## 🌐 API Endpoints

### Auth (`/api/auth/[action].js`)
| Action | Method | Purpose |
| :--- | :--- | :--- |
| `send-otp` | POST | Generate & send OTP via Twilio |
| `verify-otp` | POST | Validate OTP, create session |
| `session` | GET | Validate auth token |
| `update-name` | POST | Update display name |
| `health` | GET | Check service status |

### Invite (`/api/invite/[action].js`)
| Action | Method | Purpose |
| :--- | :--- | :--- |
| `create` | POST | Generate invite code |
| `send-sms` | POST | Send invite via Twilio |
| `lookup` | GET | Validate invite code |
| `accept` | POST | Accept invite, create friendship |
| `my-invites` | GET | List user's sent invites |

---

## 🔒 Security Features

- **Rate Limiting**: 3 OTP sends/hr, 5 verifies/10min, 5 invite SMS/hr
- **Input Validation**: Phone (10-15 digits), names (1-50 chars, XSS stripped)
- **CORS Whitelist**: Configurable allowed origins
- **Error Sanitization**: Generic client errors, detailed server logs
- **Test Mode Gating**: Bypasses only when `ALLOW_TEST_BYPASS=true`

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → Opens at http://localhost:5173

# Deploy to Vercel
vercel --prod
```

---

## 📝 Changelog

> **Keep this section updated after each significant change!**

| Date | Change | Affected Areas |
| :--- | :--- | :--- |
| 2026-01-29 | Created initial APP_REFERENCE.md | Documentation |

---

*Last updated: 2026-01-29*
