# Security & User Privacy Agent Guidelines (security_privacy.md)

This file sets forth strict execution parameters for **Antigravity** and other pair-programming AI Agents regarding security, user data privacy, and **Privacy by Design** principles for project **Arche**.

---

## 📌 1. Absolute Administrative Privacy (Privacy-First Admin)

* **No Bulk Data Retrieval (Anti-Scraping protective barrier):**
  * Administrative API routes that return a full listing of registered users (`/api/admin/users`) or projects (`/api/admin/projects`) **must remain permanently deactivated** and return a `403 Forbidden` status code.
  * You must never build or render bulk tables that expose multiple users' personal details simultaneously in the admin dashboard interface.
* **Secure On-Demand Lookup:**
  * Administrator audits of user accounts must strictly use exact email address matching. Partial search logic (such as SQL `LIKE '%email%'`) is strictly forbidden to prevent brute-force email guessing attacks.
* **Transactional Cascading Delete:**
  * Deleting a user account must clean and remove all associated research methodology drafts transactionally in the database to guarantee compliance with the user's right to be forgotten.
* **Self-Destruct Prevention:**
  * Administrative deletion or role update actions must enforce a backend check to ensure that the current administrator cannot delete or demote their own account.

---

## 📌 2. Zero-Identity Telemetry Session Logs

* **No relational session data:**
  * Time-series logins or registration charts must never correlate with user IDs, names, email addresses, or physical IP addresses.
* **Anonymous Session Telemetry Schema:**
  * Login activity telemetry must utilize the `LoginTelemetry` model which **only stores the ID and the timestamp (`CreatedAt`)**.
  * Handlers must only insert a blank row indicating that a login event occurred at that timestamp. This guarantees zero identity footprint since inception.

---

## 📌 3. Secure Account & Credential Management

* **Password Strength Verification:**
  * User registration must enforce password strength checks on both the frontend (visual dynamic colored indicators) and the backend (validation checks).
  * Password input forms must include secure masking/unmasking (Toggle Eye Icon) to prevent shoulder-surfing while remaining user-friendly.
* **HttpOnly Session Cookies:**
  * JWT session tokens must be stored strictly inside HttpOnly cookies with `SameSite: Lax` attribute to safeguard against Cross-Site Scripting (XSS) session hijack.

---

## 📌 4. Environment-Only Configurations (Secret Isolation)

* **No Plain Secret Database Storage:**
  * Infrastructure credentials (such as SMTP username, SMTP password, SMTP port, SMTP host, and JWT secrets) **must never be stored in database tables** or configured via the frontend UI.
  * Secrets must be defined exclusively via environment variables (`.env` or Docker Compose variables) to minimize the leakage surface.

---

## 📌 5. Privacy-Compliant Localization

* **Dynamic Browser Locale Sniffing:**
  * Automatically matching user local preferences (Indonesian vs English) must utilize browser-level locale preferences (`navigator.language`) instead of logging geolocations, physical IP addresses, or GPS coordinates.
