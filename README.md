# BloodNet — Emergency Blood Donation Network

An emergency blood donation and matching platform connecting volunteer donors, hospitals, and blood banks. The mobile application is built with bare **React Native CLI (TypeScript)** paired with a **Node.js/Express REST backend** featuring geospatial matching (Haversine formula), blood compatibility logic, an emergency request state machine, and real-time hospital updates.

---

## Architecture Overview

```
S5_Project/
├── backend/          # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── middleware/   # JWT authentication and authorization
│   │   ├── routes/       # Auth, Donors, Requests, Matching API
│   │   ├── services/     # Compatibility, Haversine, State Machine, Storage
│   │   └── types/        # TypeScript interfaces and schemas
│   └── tests/            # Jest unit & E2E integration test suites
│
└── mobile/           # Bare React Native CLI (TypeScript) Mobile Application
    ├── src/
    │   ├── components/   # Reusable UI components (Button, Card, Input, Badges)
    │   ├── navigation/   # Auth, Donor, and Hospital role navigators
    │   ├── screens/      # Auth, Donor, and Hospital dashboards & tracking
    │   ├── services/     # Typed API clients & network services
    │   ├── store/        # Authentication & global application state
    │   └── theme/        # Healthcare design tokens, typography & spacing
    └── android/          # Android native project & Gradle wrapper
```

---

## Core Emergency Workflow

1. **Hospital creates emergency request**: Specifies blood group, component, units needed, urgency level, and search radius.
2. **Matching engine triggers**: Calculates ABO/Rh compatibility, great-circle distance via Haversine formula, and donor eligibility intervals.
3. **Emergency alerts dispatched**: Matched donors within range receive emergency notification banners and incoming request cards.
4. **Donor accepts request**: Request state machine transitions to `ACCEPTED`.
5. **Hospital dashboard updates in real time**: Live tracking displays donor contact info and arrival status.

---

## Getting Started

### Prerequisites
- Node.js >= 20.x
- JDK 17 (configured as `JAVA_HOME`)
- Android SDK / Android Studio (with platform-tools and USB debugging)

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:5000/api`.

Run test suites:
```bash
npm test
```

### 2. Mobile App Setup
```bash
cd mobile
npm install
npm start
```

In another terminal, launch on your device:
```bash
# Forward ports if testing via USB debugging:
adb reverse tcp:5000 tcp:5000
adb reverse tcp:8081 tcp:8081

npm run android
```

---

## Team & Contributors
- **Backend Architecture & APIs**: Nithyanandam N ([@nnithyanandam024](https://github.com/nnithyanandam024))
- **Mobile Frontend & UI**: Sabareesh ([@sabareesh3898](mailto:sabareesh3898@gmail.com))
