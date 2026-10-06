# Privacy-Preserving Ephemeral Proximity Credentials

## 1. Threat Model & Privacy Challenge

Traditional location-based donor networks require donors to upload continuous GPS tracks or store home coordinates in cleartext databases. This introduces significant privacy and physical security hazards:
1. Surveillance risk: Continuous tracking reveals donors' workplace, residence, and daily routines.
2. Data breach exposure: A compromised database exposes precise addresses and blood types of citizens.

---

## 2. Ephemeral Proximity Token Architecture

BloodLink AFGC eliminates persistent GPS tracking by decoupling donor location discovery from backend transaction records through Ephemeral Proximity Tokens.

### 2.1 Cryptographic Token Construction
When a candidate is notified or commits to an emergency requisition, the server issues a time-bound HMAC-SHA256 proximity credential:

$$\tau = \text{HMAC-SHA256}(K_{\text{sys}}, \text{donorId} \parallel \text{requestId} \parallel B \parallel E)$$

Where:
- $K_{\text{sys}}$: System master cryptographic key.
- $\text{donorId}$: Obfuscated donor identifier.
- $\text{requestId}$: Emergency requisition identifier.
- $B \in \{\text{BAND\_1}, \text{BAND\_2}, \text{BAND\_3}\}$: Coarse distance band (e.g., $<5\text{km}$, $5\text{-}15\text{km}$, $>15\text{km}$).
- $E$: Token expiry timestamp (Epoch Unix milliseconds, typically $T_{\text{now}} + 3600\text{s}$).

### 2.2 Token Signature Format
The issued credential is exchanged in URL-safe base64 or hex format:
$$\text{credential} = \text{donorId} \cdot E \cdot B \cdot \text{signature}$$

---

## 3. Hospital Intake Verification

When the donor arrives at the emergency facility:
1. The donor presents the mobile application containing the active digital proximity badge.
2. The hospital intake terminal verifies:
   - Token validity: $\text{HMAC-SHA256}(K_{\text{sys}}, \cdot) == \text{signature}$
   - Temporal freshness: $T_{\text{now}} \le E$
   - Request association: $\text{requestId} == \text{activeRequestId}$
3. Complete verification executes locally in $< 5\text{ms}$ with zero runtime network roundtrips to third-party location providers.
4. No continuous GPS coordinate logs are stored in backend databases or server access logs.
