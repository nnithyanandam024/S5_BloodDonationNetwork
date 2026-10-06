# Adaptive Fulfillment Gap Control (AFGC): Mathematical Formulation

## 1. Governing Closed-Loop Equation

The central objective of the AFGC controller is to maintain exact fulfillment of an emergency blood requisition while minimizing unnecessary voluntary donor activations.

Let:
- $Q \in \mathbb{N}^+$: Requisitioned quantity of compatible blood units required by the hospital.
- $I_R \in \mathbb{N}_0$: Verified inventory units reserved from authorized regional blood banks.
- $D_C \in \mathbb{N}_0$: Number of voluntary candidate donors who have confirmed commitment.
- $G \in \mathbb{N}_0$: Unresolved requirement gap.

The closed-loop control law evaluates the gap at every discrete event $t$:

$$G(t) = \max\left(0, Q - I_R(t) - D_C(t)\right)$$

---

## 2. Dynamic Event Trajectories

The controller transitions through five asynchronous event classes:

### Event 1: Inventory Reservation ($E_{\text{inv\_res}}$)
When authorized blood bank stock is locked:
$$I_R(t^+) = I_R(t^-) + \Delta I$$
$$G(t^+) = \max(0, G(t^-) - \Delta I)$$
If $G(t^+) = 0$, all active voluntary donor dispatch invitations are immediately revoked.

### Event 2: Inventory Compromise or Release ($E_{\text{inv\_rel}}$)
If a reserved unit is recalled or found clinically unsuitable:
$$I_R(t^+) = I_R(t^-) - \Delta I_{\text{rel}}$$
$$G(t^+) = G(t^-) + \Delta I_{\text{rel}}$$
The expansion of $G$ activates an immediate subsequent candidate tier dispatch.

### Event 3: Candidate Acceptance ($E_{\text{donor\_acc}}$)
When an invited candidate confirms acceptance:
$$D_C(t^+) = D_C(t^-) + 1$$
$$G(t^+) = \max(0, G(t^-) - 1)$$
If $G(t^+) = 0$, unaccepted invitations transition to `CANCELLED_GAP_FULFILLED`.

### Event 4: Committed Donor Cancellation ($E_{\text{donor\_canc}}$)
If a committed donor cancels due to unforeseen transit impedance:
$$D_C(t^+) = D_C(t^-) - 1$$
$$G(t^+) = G(t^-) + 1$$
The gap re-opens and fallback candidates in the subsequent tier are notified.

### Event 5: Tier Timeout ($E_{\text{tier\_to}}$)
If the response timer expires for an active tier and $G(t) > 0$, the controller advances to Tier $k + 1$.

---

## 3. Stability and Over-Dispatch Guarantees

In conventional broadcast systems, $N$ donors are messaged simultaneously regardless of $Q$. When $Q=2$ and $N=50$, if 10 donors respond and travel to the hospital, an over-dispatch error of $+8$ units occurs, leading to hospital crowding and donor frustration.

Under AFGC:
- The dispatch tier size is bounded by $N_{\text{tier}} = \lceil \alpha \cdot G \rceil$, where $\alpha$ is the safety expansion factor ($\alpha = 2.5$).
- Because invitations auto-terminate dynamically when $G \to 0$, over-dispatch is mathematically bounded to $0$ in closed-loop simulations.
