# BloodLink AFGC: Request State Machine

## 1. State Definition Matrix

The emergency fulfillment lifecycle progresses through a deterministic finite-state machine (FSM). Invalid transitions throw runtime validation exceptions to prevent invalid states.

| State | Description | Permitted Next States |
|---|---|---|
| `REQUESTED` | Initial request instantiated before dispatch calculation. | `NOTIFIED`, `FULFILLED`, `CANCELLED` |
| `NOTIFIED` | Donor dispatch invitations transmitted for active gap $G > 0$. | `ACCEPTED`, `PARTIALLY_FULFILLED`, `FULFILLED`, `EXPIRED`, `CANCELLED` |
| `ACCEPTED` | Legacy single-donor accepted state (or when initial donor accepts). | `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED` |
| `PARTIALLY_FULFILLED` | $0 < (I_R + D_C) < Q$. Further donor tiers active or pending. | `FULFILLED`, `CANCELLED`, `EXPIRED` |
| `FULFILLED` | Full requirement fulfilled ($G = 0$). Dispatch terminated. | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | Transfusion verified and clinical procedure finalized. | *(Terminal State)* |
| `CANCELLED` | Request cancelled by clinical administrator. | *(Terminal State)* |
| `EXPIRED` | Request reached operational deadline without complete fulfillment.| *(Terminal State)* |

---

## 2. Transition Diagram

```
                 +-------------+
                 |  REQUESTED  |
                 +-------------+
                   /          \
      G == 0      /            \  G > 0
    (Inventory)  /              \ (Tier 1 Dispatched)
                v                v
         +-----------+     +----------+
         | FULFILLED | <-- | NOTIFIED |
         +-----------+     +----------+
              ^                  |
              |                  v
              |          +--------------------+
              +--------- | PARTIALLY_FULFILLED|
          (G == 0 via    +--------------------+
         Donor Accepts)          |
                                 v
                         +---------------+
                         |   COMPLETED   |
                         +---------------+
```

---

## 3. Transition Invariants and Guards

1. **Strict Monotonicity**: Once a request reaches `COMPLETED`, `CANCELLED`, or `EXPIRED`, no further state transitions or donor commitments can be processed.
2. **Gap Termination Guard**: If $G = \max(0, Q - I_R - D_C) = 0$, the state MUST transition directly to `FULFILLED`, and `tieredDispatchService.terminateUnacceptedInvitations()` MUST execute atomically.
3. **Commitment Cancellation Recovery**: If a confirmed donor cancels while the request is in `FULFILLED` or `PARTIALLY_FULFILLED`, the gap re-opens ($G > 0$), transitioning the state back to `PARTIALLY_FULFILLED` (or `NOTIFIED` if zero commitments remain) and triggering fallback tier dispatch.
