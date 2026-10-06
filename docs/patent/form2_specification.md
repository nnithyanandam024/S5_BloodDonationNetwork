# Form 2: Complete Patent Specification (The Patents Act, 1970)

## Title of the Invention
ADAPTIVE EMERGENCY BLOOD FULFILLMENT SYSTEM USING REQUIREMENT-GAP CONTROL, DUAL-SOURCE RESERVATION AND PRIVACY-PRESERVING DONOR DISPATCH

---

## 1. Field of the Invention
The present disclosure relates to emergency healthcare logistics and distributed network resource allocation. More specifically, it relates to a computer-implemented system and method for dynamic blood component fulfillment utilizing closed-loop requirement-gap calculation, synchronized inventory reservation, tiered candidate mobilization, and ephemeral cryptographic verification.

---

## 2. Background of the Invention and Prior Art Limitations
In critical medical situations such as major trauma, obstetric hemorrhages, and complex surgical operations, rapid transfusion of ABO/Rh-compatible blood components is essential to patient survival. Existing solutions fall into two disparate categories:
1. **Isolated Hospital Blood Bank Inventories**: Slower inter-hospital exchanges dependent on telephone calls and manual requisitions.
2. **Open-Loop Voluntary Donor Broadcast Networks**: Applications that broadcast an emergency push notification to all registered donors within a geographic perimeter.

### Drawbacks of Conventional Systems:
- **Over-Dispatch and Donor Fatigue**: Broadcasting to 100 donors when only 2 units are required causes 10 donors to mobilize. Once 2 donate, 8 are turned away, creating severe donor demotivation and traffic congestion at clinical intake.
- **Resource Desynchronization**: Broadcast systems operate blind to available blood bank shelf stock, draining voluntary community goodwill when compatible physical units are already available.
- **Geolocation Surveillance Vulnerability**: Continuous streaming of donor GPS coordinates creates severe data privacy and profiling risks under modern privacy statutes.

---

## 3. Summary of the Invention
The present invention solves these technical problems by providing an Adaptive Fulfillment Gap Control (AFGC) engine. The system continuously evaluates an instantaneous requirement gap:
$$G(t) = \max(0, Q - I_R(t) - D_C(t))$$
where $Q$ is the requisitioned quantity, $I_R$ is authorized reserved inventory, and $D_C$ is confirmed voluntary donor commitments.

Voluntary donor dispatch is strictly throttled to progressive candidate tiers sized as a function of the instantaneous gap $G(t)$. When an inventory unit is secured or a candidate accepts such that $G(t) = 0$, all remaining outstanding dispatch invitations across the network are dynamically revoked and terminated. Geolocation validation is conducted via cryptographically signed, coarse-grained ephemeral proximity credentials without logging continuous GPS trajectories.

---

## 4. Claims (1 to 10)

1. A computer-implemented emergency blood fulfillment system comprising:
   - an authorized inventory repository communicatively coupled to one or more blood bank databases;
   - an adaptive fulfillment gap control (AFGC) engine comprising one or more processors configured to calculate an instantaneous fulfillment gap $G = \max(0, Q - I_R - D_C)$, wherein $Q$ is a target requisition quantity, $I_R$ is a count of locked compatible inventory units, and $D_C$ is a count of confirmed voluntary donor commitments;
   - a tiered dispatch module configured to segment compatible candidate donors into progressive dispatch tiers sized proportionally to $G$; and
   - a cryptographic credential issuer configured to generate ephemeral, time-bounded proximity verification tokens for dispatched donors.

2. The system of claim 1, wherein the AFGC engine is configured to execute an automated invitation revocation procedure upon detection that $G = 0$, transmitting a termination directive to unconfirmed donor client devices.

3. The system of claim 1, wherein the tiered dispatch module determines a tier candidate size $N_{\text{tier}} = \lceil \alpha \cdot G \rceil$, where $\alpha$ is a safety expansion constant between $1.5$ and $3.0$.

4. The system of claim 1, wherein the cryptographic credential issuer generates an ephemeral token $\tau = \text{HMAC-SHA256}(K, \text{donorId} \parallel \text{requestId} \parallel B \parallel E)$, where $K$ is a system secret key, $B$ is a discrete distance band, and $E$ is an expiration timestamp.

5. The system of claim 1, wherein the candidate donors are prioritized according to a multi-factor score combining great-circle distance, clinical eligibility interval, and historical donation reliability.

6. A method for closed-loop emergency blood component fulfillment, comprising:
   - receiving an emergency requisition specifying blood group and target quantity $Q$;
   - interrogating an inventory repository to lock $I_R \le Q$ compatible blood units;
   - evaluating a remaining gap $G = \max(0, Q - I_R)$;
   - selectively mobilizing candidate donors only when $G > 0$ in progressive tiers sized as a function of $G$; and
   - terminating pending donor dispatch invitations immediately when confirmed commitments and reserved units satisfy $Q$.

7. The method of claim 6, further comprising re-opening the requirement gap $G$ and activating a fallback candidate dispatch tier in response to a donor commitment cancellation event.

8. The method of claim 6, further comprising advancing to a subsequent candidate dispatch tier upon expiration of a predetermined tier timeout window when $G > 0$.

9. The method of claim 6, wherein verification of donor arrival at a clinical intake facility is performed by evaluating the cryptographic validity and expiration timestamp of an ephemeral token without querying persistent donor trajectory logs.

10. A non-transitory computer-readable storage medium storing instructions that, when executed by one or more processors, cause the one or more processors to carry out the method of claims 6 to 9.
