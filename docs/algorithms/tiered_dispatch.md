# Tiered Candidate Dispatch and Ranking

## 1. Multi-Factor Candidate Ranking Formulation

When an emergency requirement gap $G > 0$ requires voluntary donor mobilization, candidate donors within search radius $R_{\text{max}}$ are ranked using a multi-factor fitness function:

$$S(d) = w_D \cdot S_{\text{dist}}(d) + w_E \cdot S_{\text{elig}}(d) + w_R \cdot S_{\text{rel}}(d)$$

Where:
- $w_D = 0.50$ (Proximity weight)
- $w_E = 0.30$ (Clinical eligibility & recency weight)
- $w_R = 0.20$ (Historical response reliability weight)
- Constraint: $w_D + w_E + w_R = 1.00$

### 1.1 Proximity Score ($S_{\text{dist}}$)
Using the Haversine great-circle distance $d_{\text{km}}$:
$$S_{\text{dist}}(d) = \max\left(0, 1 - \frac{d_{\text{km}}}{R_{\text{max}}}\right)$$

### 1.2 Eligibility Recency Score ($S_{\text{elig}}$)
Based on days elapsed $\Delta t_{\text{days}}$ since last donation ($T_{\text{cooldown}} = 90$ days for whole blood):
$$S_{\text{elig}}(d) = \min\left(1, \frac{\Delta t_{\text{days}} - 90}{90}\right)$$

### 1.3 Reliability Score ($S_{\text{rel}}$)
Based on historical acceptance count and commitment compliance:
$$S_{\text{rel}}(d) = \min\left(1, 0.5 + 0.1 \cdot N_{\text{donations}}\right)$$

---

## 2. Progressive Tier Geometric Sizing

Rather than broadcasting to all ranked candidates simultaneously, candidates are segmented into progressive tiers:

$$N_{\text{tier}}(k) = \lceil \alpha \cdot G(t_k) \rceil$$

With expansion factor $\alpha = 2.5$:
- For $G = 1$: $N_{\text{tier}} = \lceil 2.5 \cdot 1 \rceil = 3$ donors notified in Tier 1.
- For $G = 2$: $N_{\text{tier}} = \lceil 2.5 \cdot 2 \rceil = 5$ donors notified in Tier 1.

Each tier is allocated a response deadline:
$$\tau_{\text{tier}} = 300\text{ seconds (5 minutes)}$$

If $G$ remains $> 0$ upon expiry of $\tau_{\text{tier}}$, Tier 2 is mobilized for the remaining gap with the next $N_{\text{tier}}$ highest-ranked candidates.

---

## 3. Dynamic Revocation (Kill Switch)

When a candidate accepts and causes $G \to 0$:
1. The server marks the accepting candidate as `ACCEPTED`.
2. All outstanding candidates in state `NOTIFIED` are transitioned to `CANCELLED_GAP_FULFILLED`.
3. An auto-termination push notification is transmitted, informing other donors that the emergency requirement has been fulfilled and preventing unnecessary transit.
