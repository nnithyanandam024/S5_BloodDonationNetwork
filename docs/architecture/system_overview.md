# BloodLink AFGC: System Architecture Overview

## 1. System Abstract
BloodLink is an Adaptive Emergency Blood Fulfillment Network that replaces conventional, open-loop donor broadcast systems with a closed-loop requirement-gap control engine (AFGC). By coordinating verified hospital inventory with tiered voluntary donor dispatch and ephemeral proximity credentials, the system prevents donor fatigue, mitigates hospital crowding, and preserves donor geolocation privacy.

---

## 2. Component Topology

```
+-------------------------------------------------------------------------+
|                           Mobile Application                            |
|                 (Bare React Native 0.87 / TypeScript)                   |
|                                                                         |
|   +-----------------------+                    +--------------------+   |
|   |  Hospital Screens     |                    |   Donor Screens    |   |
|   |  - CreateRequest      |                    |   - IncomingReqs   |   |
|   |  - RequestDetails     |                    |   - EphemeralBadge |   |
|   |  - InventoryMonitor   |                    |   - DonorProfile   |   |
|   +-----------------------+                    +--------------------+   |
|               |                                           |             |
|   +-----------------------------------------------------------------+   |
|   |              Client Services & State Synchronization            |   |
|   |   - ApiClient (Axios + Auth Tokens)                             |   |
|   |   - GeolocationService (Privacy Coarse Bucketing)               |   |
|   |   - FCMService (Push Dispatch & Auto-Termination Handling)      |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
                                    | REST / SSE
                                    v
+-------------------------------------------------------------------------+
|                            Backend Service                              |
|                       (Node.js / Express / TypeScript)                  |
|                                                                         |
|  [ Middleware Layer ]                                                   |
|    - requireAuth (JWT Token Verification)                               |
|    - requireRole (Role-Based Access Control: HOSPITAL / DONOR)          |
|                                                                         |
|  [ Routes Layer ]                                                       |
|    - /api/auth          : Registration, Login, Profile Retrieval         |
|    - /api/requests      : Emergency Request Lifecycle & Live Simulation |
|    - /api/donors        : Availability, Incoming Requests, Accept/Cancel|
|    - /api/matching      : Geospatial Candidate Ranking & Search         |
|    - /api/experiments   : Empirical AFGC vs Broadcast Benchmarks        |
|                                                                         |
|  [ Core AFGC Engine & Services ]                                        |
|    - AFGCEngine         : Closed-Loop Gap Recalculation                 |
|    - TieredDispatch     : Progressive Tier Scaling & Auto-Termination   |
|    - ProximityCredential: Ephemeral HMAC-SHA256 Token Issuance          |
|    - InventoryService   : ABO/Rh Dual-Source Reservation                |
|    - StateMachine       : Deterministic Request Lifecycle Validator     |
|                                                                         |
|  [ Repository Layer (Decoupled Data Abstraction) ]                     |
|    - IRequestRepository   (InMemoryRequestRepository / FirestoreReady)  |
|    - IDonorRepository     (InMemoryDonorRepository / FirestoreReady)    |
|    - IUserRepository      (InMemoryUserRepository / FirestoreReady)     |
|    - IInventoryRepository (InMemoryInventoryRepository / FirestoreReady)|
+-------------------------------------------------------------------------+
```

---

## 3. Communication Patterns

### 3.1 Synchronous REST API
Used for user authentication, request initiation, inventory reservation updates, and donor response submissions. All payloads are strongly typed using TypeScript interfaces shared conceptually across backend and mobile.

### 3.2 Real-Time Server-Sent Events (SSE)
Endpoints such as `GET /api/requests/:id/live` establish a persistent unidirectional SSE connection. Whenever an event modifies the fulfillment state (inventory reservation, donor acceptance, donor cancellation, or tier timeout), an event is dispatched immediately to all connected hospital dashboards.

### 3.3 Ephemeral Proximity Verification
Rather than streaming continuous donor GPS coordinates to the server, the server generates a cryptographically signed ephemeral token:
$$\tau = \text{HMAC-SHA256}(K, \text{donorId} \parallel \text{requestId} \parallel B \parallel E)$$
The mobile client presents this token at hospital intake or upon arrival for sub-second offline verification without disclosing donor residential address or historical transit traces.
