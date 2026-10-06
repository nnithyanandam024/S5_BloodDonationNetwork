# BloodLink -- Adaptive Emergency Blood Fulfillment Network (AFGC)

> **Patent Title**: Adaptive Emergency Blood Fulfillment System Using Requirement-Gap Control, Dual-Source Reservation and Privacy-Preserving Donor Dispatch  
> **Academic Context**: S5 Capstone Project / Healthcare Cyber-Physical Systems  
> **Core Engine**: Closed-Loop Requirement-Gap Controller: G = max(0, Q - I_R - D_C)

---

## 1. Executive Summary

Conventional emergency blood donation applications operate on an open-loop broadcast model: when a hospital requests blood, push notifications are broadcast indiscriminately to all registered donors within an arbitrary radius. This open-loop paradigm creates three critical failure modes in healthcare logistics:
1. **Donor Alert Fatigue and Redundant Mobilization**: Multiple voluntary donors drop their responsibilities and travel to facilities only to find the quota was already met by someone else.
2. **Excess Wireless Network Traffic**: Uncoordinated mass broadcasts saturate cellular push channels with uncoordinated alerts.
3. **Severe Geolocation Exposure**: Streaming and storing cleartext GPS traces on centralized application servers creates severe data liability and privacy exposure.

**BloodLink AFGC** addresses these challenges by introducing a **closed-loop feedback controller** that dynamically balances authorized blood-bank inventory reservations ($I_R$) and voluntary donor commitments ($D_C$) against requested clinical quantity ($Q$) via a continuous requirement-gap formula:

$$G(t) = \max\Big(0, Q - I_R(t) - D_C(t)\Big)$$

```
                                 +-----------------------+
                                 | Emergency Blood Req   |
                                 |  Quantity Q, Blood Grp|
                                 +-----------+-----------+
                                             |
                                             v
                           +-----------------------------------+
                           | Authorized Inventory Interrogation|
                           |  (Hospital & Blood Bank Reserves) |
                           +-----------------+-----------------+
                                             |
                                             v
                       +-------------------------------------------+
                       | Reserve Available Compatible Units: Ir(t) |
                       +---------------------+---------------------+
                                             |
                                             v
                       +-------------------------------------------+
                       | Compute Dynamic Fulfillment Gap:          |
                       | G(t) = max(0, Q - Ir(t) - Dc(t))          |
                       +---------------------+---------------------+
                                             |
                                      Is G(t) <= 0 ?
                                      /            \
                                  YES/              \ NO
                                    /                \
      +-------------------------------+    +----------------------------------+
      | Request Fulfilled Immediately |    | Determine Candidate Donor Pool   |
      | Voluntary Dispatch Suppressed |    | Issue Ephemeral Proximity Tokens |
      +-------------------------------+    +----------------+-----------------+
                                                            |
                                                            v
                                           +----------------------------------+
                                           | Tier k Sizing: Tk = min(alpha*G, |
                                           | Dispatched ONLY for Remaining G  |
                                           +----------------+-----------------+
                                                            |
                                                            v
                                           +----------------------------------+
                                           | Closed-Loop Event Recalculation: |
                                           | - Donor Accepts  -> +1 to Dc(t)  |
                                           | - Donor Declines -> Trigger next |
                                           | - Inventory Change -> +/- Ir(t)  |
                                           | - Donor Cancels  -> -1 to Dc(t)  |
                                           +----------------+-----------------+
                                                            |
                                                   Recalculate G(t)
                                                   /               \
                                              G(t)=0              G(t)>0
                                                /                   \
                 +-------------------------------+       +---------------------+
                 | Terminate Pending Invitations |       | Advance to Tier k+1 |
                 | Expire Ephemeral Credentials  |       +---------------------+
                 +-------------------------------+
```

---

## 2. Repository Directory Structure

```
S5_Project/
|
|-- README.md                              # Master architectural and patent specification
|
|-- docs/                                  # Engineering & Patent Documentation Hierarchy
|   |-- architecture/
|   |   |-- system_overview.md             # System topology, communication protocols, SSE
|   |   `-- state_machine.md               # Deterministic request lifecycle FSM & invariants
|   |-- algorithms/
|   |   |-- afgc_formulation.md            # Closed-loop mathematical gap formulation
|   |   |-- tiered_dispatch.md             # Candidate ranking formula & alpha-tier sizing
|   |   `-- ephemeral_credentials.md       # HMAC-SHA256 proximity tokens & zero-GPS model
|   |-- patent/
|   |   |-- form2_specification.md         # Formal Indian Patent Form 2 specification & claims
|   |   `-- cri_defense_3k.md              # Technical defense against Section 3(k) objections
|   `-- testing/
|       `-- benchmark_results.md           # Empirical comparative analysis & verification
|
|-- backend/                               # Node.js + Express + TypeScript API Server
|   |-- jest.config.js                     # Jest testing configuration
|   |-- package.json                       # Backend dependencies, build and test scripts
|   |-- tsconfig.json                      # Strict TypeScript compiler options
|   |
|   |-- src/
|   |   |-- server.ts                      # Express server entrypoint, middleware, routes
|   |   |
|   |   |-- config/                        # Configuration & Constants Layer
|   |   |   |-- constants.ts               # AFGC constants (alpha=2.5, scoring weights, TTLs)
|   |   |   |-- env.ts                     # Strongly-typed environment variables
|   |   |   |-- firebase.ts                # Firebase Cloud Messaging configuration
|   |   |   `-- index.ts                   # Config barrel export
|   |   |
|   |   |-- middleware/
|   |   |   `-- auth.ts                    # JWT authentication & role-based access control
|   |   |
|   |   |-- repositories/                  # Decoupled Repository Pattern Layer
|   |   |   |-- donorRepository.ts         # IDonorRepository (Storage/Firestore abstraction)
|   |   |   |-- inventoryRepository.ts     # IInventoryRepository (Stock query & reservation)
|   |   |   |-- requestRepository.ts       # IRequestRepository (Request persistence & SSE)
|   |   |   |-- userRepository.ts          # IUserRepository (Authentication & profiles)
|   |   |   `-- index.ts                   # Repositories barrel export
|   |   |
|   |   |-- routes/
|   |   |   |-- auth.ts                    # User registration, login, profile retrieval
|   |   |   |-- donors.ts                  # Donor availability, requests, accept/cancel
|   |   |   |-- experiments.ts             # Benchmark simulation API (POST /api/experiments)
|   |   |   |-- matching.ts                # Geospatial candidate ranking & preview
|   |   |   `-- requests.ts                # Emergency request lifecycle, SSE, live simulation
|   |   |
|   |   |-- services/
|   |   |   |-- afgcEngine.ts              # Core AFGC Closed-Loop Gap Controller
|   |   |   |-- benchmarkService.ts        # Policy comparison (Broadcast vs Nearest vs AFGC)
|   |   |   |-- compatibility.ts           # Clinical ABO/Rh red blood cell matrix
|   |   |   |-- eligibility.ts             # 90-day clinical donation interval validator
|   |   |   |-- haversine.ts               # Great-circle geospatial distance calculator
|   |   |   |-- inventoryService.ts        # Stock management & atomic reservation
|   |   |   |-- matching.ts                # Multi-factor candidate ranking algorithm
|   |   |   |-- proximityCredential.ts     # HMAC-SHA256 ephemeral proximity token generator
|   |   |   |-- stateMachine.ts            # State transition validator with terminal guards
|   |   |   |-- storage.ts                 # Seeded in-memory store (Donors, Hospitals, Banks)
|   |   |   `-- tieredDispatch.ts          # Tier sizing (alpha*G) & auto-termination
|   |   |
|   |   `-- types/
|   |       `-- index.ts                   # Domain TypeScript interfaces and types
|   |
|   `-- tests/                             # 11 Jest Test Suites (41 tests, 100% pass)
|       |-- afgcEngine.test.ts             # Closed-loop recalculation across all 5 events
|       |-- api.test.ts                    # End-to-end integration test (Auth -> Req -> Accept)
|       |-- benchmark.test.ts              # 75% traffic reduction & 0 over-dispatch verification
|       |-- compatibility.test.ts          # ABO/Rh compatibility rules verification
|       |-- eligibility.test.ts            # 90-day interval donor eligibility validation
|       |-- haversine.test.ts              # Great-circle distance precision tests
|       |-- inventoryService.test.ts       # 8-blood group stock seed & atomic reservation
|       |-- matching.test.ts               # Candidate scoring and ranking tests
|       |-- proximityCredential.test.ts    # Ephemeral HMAC token issuance and validation
|       |-- stateMachine.test.ts           # State machine transitions and invalid state guards
|       `-- tieredDispatch.test.ts         # Progressive tier sizing and auto-termination
|
`-- mobile/                                # Bare React Native CLI (TypeScript) Mobile App
    |-- android/                           # Native Android project configuration
    |-- package.json                       # Mobile dependencies and execution scripts
    |-- tsconfig.json                      # Strict TypeScript compiler options
    |
    `-- src/
        |-- config/                        # Mobile Environment & Network Config
        |   |-- environment.ts             # API base URL, request timeouts, debug flags
        |   `-- index.ts                   # Mobile config barrel export
        |
        |-- components/                    # Reusable Design System Component Library
        |   |-- BloodGroupSelector/        # 8-group interactive selector
        |   |-- Button/                    # Themed primary, outline, danger buttons
        |   |-- Card/                      # Elevated card surfaces
        |   |-- EmptyState/                # Clinical empty state placeholders
        |   |-- Header/                    # App navigation header with title and back action
        |   |-- Icon/                      # Custom SVG icons (droplet, shield, hospital, etc.)
        |   |-- Input/                     # Form text inputs with error state support
        |   |-- LoadingState/              # Themed activity indicator and message
        |   |-- Modal/                     # Interactive dialog overlays
        |   `-- StatusBadge/               # Lifecycle and urgency indicator badges
        |
        |-- navigation/                    # Navigation Stack Hierarchy
        |   |-- AppNavigator.tsx           # Root router (Auth vs Donor vs Hospital)
        |   |-- AuthNavigator.tsx          # Login and registration stack
        |   |-- CustomBottomTabBar.tsx     # Curved bottom navigation bar
        |   |-- DonorNavigator.tsx         # Donor tab stack (Home, Requests, History, Profile)
        |   `-- HospitalNavigator.tsx      # Hospital tab stack (Home, Create, Inventory, Profile)
        |
        |-- screens/
        |   |-- auth/
        |   |   |-- LoginScreen.tsx        # Hospital and donor authenticated sign-in
        |   |   `-- RegisterScreen.tsx     # Role-based onboarding with clinical attributes
        |   |-- donor/
        |   |   |-- DonationHistoryScreen.tsx # Verified past blood donations log
        |   |   |-- DonorHomeScreen.tsx       # Availability toggle, incoming emergencies
        |   |   |-- DonorProfileScreen.tsx    # Clinical stats, eligibility countdown
        |   |   `-- DonorRequestsScreen.tsx   # Ephemeral proximity cards & auto-kill notice
        |   `-- hospital/
        |       |-- CreateRequestScreen.tsx   # Request creation with AFGC dual-source toggle
        |       |-- HospitalHomeScreen.tsx    # Active emergencies dashboard & status filters
        |       |-- HospitalInventoryScreen.tsx # Real-time blood bank reserves monitor
        |       |-- HospitalProfileScreen.tsx # Facility license, location, and contact info
        |       |-- HospitalRequestsScreen.tsx# Institutional request history
        |       `-- RequestDetailsScreen.tsx  # AFGC Formula Gauge & 4 Live Simulation Buttons
        |
        |-- services/                      # Modular Mobile Services
        |   |-- api/                       # REST API client & endpoints
        |   |   |-- auth.ts                # Authentication service
        |   |   |-- client.ts              # Axios instance with JWT interceptor
        |   |   |-- donors.ts              # Donor profile and response methods
        |   |   |-- requests.ts            # Emergency requests, telemetry, simulations
        |   |   `-- index.ts               # API barrel export
        |   |-- notifications/             # Push Notification Service
        |   |   |-- fcm.ts                 # Device token registration & message listeners
        |   |   |-- notificationHandler.ts # AFGC invitation and GAP_FULFILLED_KILL parser
        |   |   `-- index.ts               # Notifications barrel export
        |   |-- location/                  # Geolocation Service
        |   |   |-- geolocation.ts         # Privacy coarse bucketing & Haversine distance
        |   |   `-- index.ts               # Location barrel export
        |   `-- index.ts                   # Root services barrel export
        |
        |-- store/
        |   `-- AuthContext.tsx            # Global auth state, user role, token persistence
        |
        |-- theme/                         # Design System Tokens
        |   |-- borderRadius.ts            # Corner radii standards
        |   |-- colors.ts                  # Clinical Crimson palette and status colors
        |   |-- spacing.ts                 # 8pt layout grid scale
        |   |-- typography.ts              # Typography scale and font weights
        |   `-- index.ts                   # Theme barrel export
        |
        `-- types/
            `-- index.ts                   # Frontend TypeScript types synchronized with backend
```

---

## 3. Core Technical Formulations

### 3.1 Closed-Loop Requirement-Gap Equation
The AFGC engine maintains continuous balance across inventory and voluntary donor commitments:

$$G(t) = \max\Big(0, Q - I_R(t) - D_C(t)\Big)$$

Where:
- $Q$: Requisitioned quantity of compatible blood units required by the hospital;
- $I_R(t)$: Authorized blood bank units currently locked/reserved;
- $D_C(t)$: Confirmed voluntary donor commitments currently active;
- $G(t)$: Remaining fulfillment deficit requiring mobile donor dispatch.

#### Event-Driven Closed-Loop Recalculation Matrix
| Trigger Event | Mathematical Update | Controller Action |
| :--- | :--- | :--- |
| `INVENTORY_RESERVED` | $I_R \gets I_R + \Delta i$ | $G \gets \max(0, G - \Delta i)$. If $G = 0$, abort active donor dispatch. |
| `DONOR_ACCEPTED` | $D_C \gets D_C + 1$ | $G \gets G - 1$. If $G = 0$, revoke remaining invites in current tier. |
| `DONOR_CANCELLED` | $D_C \gets D_C - 1$ | $G \gets G + 1$. System immediately triggers fallback candidate tier. |
| `INVENTORY_RELEASED` | $I_R \gets I_R - \Delta i$ | $G \gets G + \Delta i$. Recalculates gap and re-activates candidate pool. |
| `TIER_TIMEOUT` | No state change | If $G > 0$, expand search radius and dispatch Tier $k+1$. |

---

### 3.2 Ephemeral Proximity Credential (EPC)
To protect donor privacy and prevent continuous coordinate tracking on centralized servers, proximity is validated through short-lived cryptographic tokens:

$$\tau = \text{HMAC-SHA256}\Big(K_{\text{sys}}, \text{donorId} \parallel \text{requestId} \parallel B \parallel E\Big)$$

- **Coarse Distance Quantization**: Continuous GPS coordinates are quantized into discrete distance bands ($<5\text{km}$, $5\text{-}15\text{km}$, $>15\text{km}$).
- **Zero Persistent GPS Storage**: Raw coordinates are never written to database tables or request logs.
- **Instant Revocation**: When $G(t) = 0$, all issued tokens for the request are revoked immediately.

---

### 3.3 Response-Aware Tiered Dispatch Controller
Instead of broadcasting notifications to 50 donors simultaneously, candidates are partitioned into sequentially scheduled tiers sized dynamically by $G(t)$:

$$N_{\text{tier}}(k) = \min\Big(\lceil \alpha \cdot G(t) \rceil, N_{\text{available}}\Big)$$

- **Expansion Coefficient**: $\alpha = 2.5$ (e.g., for a 2-unit gap, notify 5 candidates).
- **Auto-Termination on $G=0$**: The instant $G = 0$, all remaining invited candidates with status `NOTIFIED` are transitioned to `CANCELLED_GAP_FULFILLED`, terminating notifications and preventing unnecessary travel.
- **Dispatch Efficiency Metric**:
  $$\eta = \frac{D_C}{N_{\text{dispatched}}}$$

---

## 4. Empirical Benchmark Validation

A comparative evaluation was performed across three candidate dispatch policies under identical emergency parameters ($Q = 4$ units of B+ RBC, Candidate Pool $N = 20$, Donor Response Probability $P = 0.40$, Authorized Inventory Stock = 2 units):

| Evaluation Metric | Policy 1: Legacy Broadcast | Policy 2: Static Nearest-N (N=10) | Policy 3: BloodLink AFGC | Technical Advantage |
| :--- | :--- | :--- | :--- | :--- |
| **Initial Inventory Reserved (I_R)** | 0 units | 0 units | **2 units** | Immediate 50% fulfillment prior to dispatch |
| **Active Requirement Gap (G)** | 4 units | 4 units | **2 units** | 50% reduction in volunteer requirement |
| **Total Mobile Notifications Sent** | 20 alerts | 10 alerts | **5 alerts** | **75.0% reduction in network traffic** |
| **Confirmed Donor Acceptances (D_C)** | 7 donors | 4 donors | **2 donors** | Exact quota fulfilled |
| **Redundant / Over-Dispatched Donors** | **3 excess donors** | 0 excess donors | **0 excess donors** | 100% elimination of redundant mobilization |
| **Dispatch Efficiency (eta = D_C / N_sent)** | 0.2000 (20.0%) | 0.4000 (40.0%) | **0.4000 (40.0%)** | 2.0x efficiency increase over broadcast |
| **Persistent GPS Coordinate Retention** | Continuous / Plaintext | Continuous / Plaintext | **Zero (0) Coordinates** | 100% reduction in location exposure |
| **Location Credential Expiry** | None (Permanent) | None (Permanent) | **Automatic on G=0** | Cryptographic session revocation |
| **Mean Time to Quota Resolution** | 320 seconds | 280 seconds | **145 seconds** | **54.7% faster fulfillment** |

---

## 5. REST API Reference

### 5.1 Health & Authentication
- `GET /api/health` -- Service health check and current timestamp.
- `POST /api/auth/register` -- Register a new Donor or Hospital profile.
- `POST /api/auth/login` -- Sign in with email and password, receive JWT bearer token.
- `GET /api/auth/me` -- Retrieve profile of authenticated user.

### 5.2 Emergency Requests & AFGC Engine
- `POST /api/requests` -- Hospital creates emergency request. Interrogates inventory, reserves compatible units, calculates initial gap $G$, and triggers Tier 1 dispatch only if $G > 0$.
- `GET /api/requests/hospital` -- List all requests created by the authenticated hospital.
- `GET /api/requests/:id` -- Get complete request details, candidate statuses, and commitments.
- `GET /api/requests/:id/afgc-telemetry` -- Real-time telemetry payload ($Q, I_R, D_C, G, \text{currentTier}, \eta$).
- `POST /api/requests/:id/inventory/reserve` -- Dynamically reserve compatible units from bank inventory ($I_R \gets I_R + \Delta i$).
- `POST /api/requests/:id/inventory/release` -- Dynamically release reserved units back to inventory ($I_R \gets I_R - \Delta i$).
- `GET /api/requests/inventory/all` -- Fetch all blood bank inventory stocks across all 8 blood groups.
- `PUT /api/requests/:id/status` -- State machine transition (`ACCEPTED` -> `EN_ROUTE` -> `COMPLETED`).
- `GET /api/requests/:id/live` -- Server-Sent Events (SSE) live stream of request state updates.

### 5.3 Live Interactive Simulation Controls (Hospital Testing & Evaluation)
- `POST /api/requests/:id/simulate/donor-accept` -- Simulates next notified candidate donor accepting ($D_C \gets D_C + 1$).
- `POST /api/requests/:id/simulate/donor-cancel` -- Simulates a confirmed donor cancelling ($D_C \gets D_C - 1$).

### 5.4 Donors
- `GET /api/donors/profile` -- Get authenticated donor profile.
- `PUT /api/donors/availability` -- Toggle donor active availability.
- `GET /api/donors/eligibility` -- Evaluates clinical 90-day donation interval.
- `GET /api/donors/incoming-requests` -- List active emergency invitations in the donor's tier.
- `POST /api/donors/respond` -- Accept or decline an emergency request (triggers AFGC gap recalculation).
- `POST /api/donors/cancel` -- Cancel a previously confirmed commitment (re-opens requirement gap).

### 5.5 Experiments & Benchmarking
- `POST /api/experiments/benchmark` -- Executes policy comparison simulation across custom $Q$, pool size, and response rate.
- `GET /api/experiments/latest` -- Retrieves benchmark report comparing Broadcast, Nearest-N, and AFGC.

---

## 6. Getting Started & Installation

### Prerequisites
- **Node.js** >= 20.x
- **JDK 17** (configured as `JAVA_HOME`)
- **Android SDK / Android Studio** (platform-tools and adb configured)

### 1. Backend API Setup
```bash
cd backend
npm install
npm run build
npm run dev
```
The backend server runs on `http://localhost:5000/api`.

Run test suites (11 suites, 41 tests):
```bash
npm test
```

### 2. Mobile App Setup
```bash
cd mobile
npm install
npm start
```

In a separate terminal, launch on your Android emulator or USB device:
```bash
# Reverse ports for emulator communication:
adb reverse tcp:5000 tcp:5000
adb reverse tcp:8081 tcp:8081

npm run android
```

---

## 7. Live Demonstration Walkthrough (Project Evaluation Guide)

During project evaluation or patent presentation, execute the live closed-loop demonstration:
1. **Log in as Hospital**: Use `hospital@citycare.org` / `Password123!`.
2. **Navigate to Blood Bank Reserves**: Observe live stocks across all 8 blood groups with available vs. reserved counts.
3. **Create AFGC Emergency Request**:
   - Blood Group: `B+`
   - Component: `Red Blood Cells (RBC)`
   - Units Required: `4`
   - Enable `AFGC Dual-Source Coordination`.
4. **Inspect the Master AFGC Telemetry Dashboard**:
   - The top gauge shows: $G = Q - I_R - D_C \implies 2 = 4 - 2 - 0$.
   - 2 compatible units were reserved from inventory ($I_R = 2$).
   - Tier 1 was sized only for the 2-unit deficit (5 candidates invited).
5. **Trigger Live Simulation Actions**:
   - Tap `[+1 Donor Accept (DC)]`: $D_C$ increments to 1, Gap drops to $G = 1$, status transitions to `PARTIALLY_FULFILLED`.
   - Tap `[+1 Donor Accept (DC)]` again: $D_C$ increments to 2, Gap drops to $G = 0$, status transitions to `FULFILLED`.
   - Observe the **Auto-Termination Effect**: All remaining invited candidates immediately transition to `CANCELLED_GAP_FULFILLED` (purple badges), and ephemeral tokens are revoked.
   - Tap `[-1 Donor Cancel]`: Watch $D_C$ decrement, Gap re-open to $G = 1$, and candidate dispatch automatically re-activate.
   - Tap `[+1 Bank Reserve (IR)]`: Watch inventory close the gap directly to $G = 0$ without donors.

---

## 8. Documentation Index

Detailed architectural and legal documents are maintained in the `docs/` directory:
- [System Architecture Overview](docs/architecture/system_overview.md)
- [Request State Machine Specification](docs/architecture/state_machine.md)
- [AFGC Mathematical Formulation](docs/algorithms/afgc_formulation.md)
- [Tiered Dispatch & Candidate Ranking](docs/algorithms/tiered_dispatch.md)
- [Privacy-Preserving Ephemeral Credentials](docs/algorithms/ephemeral_credentials.md)
- [Form 2 Complete Patent Specification](docs/patent/form2_specification.md)
- [CRI Guidelines Section 3(k) Defense](docs/patent/cri_defense_3k.md)
- [Empirical Benchmark Results](docs/testing/benchmark_results.md)

---

## 9. Contributors & Credits
- **System Architecture, AFGC Engine & Patent Design**: Nithyanandam N ([@nnithyanandam024](https://github.com/nnithyanandam024))
- **Mobile Frontend & UI Engineering**: Sabareesh ([@sabareesh3898](mailto:sabareesh3898@gmail.com))
