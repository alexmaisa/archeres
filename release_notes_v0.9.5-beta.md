# Archeres Release v0.9.5-beta 🚀

We are proud to present release **v0.9.5-beta**, a major milestone update that brings Archeres to a more mature level of security, legal compliance, and system resilience.

This update focuses on protecting the platform from robotic spam through a self-hosted mechanism, enforcing non-commercial license compliance, and enhancing the premium UI/UX quality for a cleaner, professional look.

---

## 🔑 Key Features & Changes Summary

### 1. 🛡️ Encrypted SVG Math Captcha Engine (Self-Hosted Anti-Spam)
To protect the platform from account registration spam attacks without compromising user privacy (free from third-party tracking cookies), we have built a custom Captcha engine:
*   **Vector Distortion Computation**: Math captcha images are dynamically generated in the backend (Go) in SVG format with noise lines, scatter points, and random character rotations to thwart OCR bot readers.
*   **Cryptographic Signatures (JWT)**: Correct captcha answers are securely signed in the backend using short-lived JWT tokens (expiring in 5 minutes) via a shared secret key.
*   **Glassmorphism Dark UI Widget**: Features an interactive captcha Refresh button and numeric input that automatically triggers the number keyboard on mobile devices (`inputMode="numeric"`).
*   **Connection Resilience (Retry Mechanism)**: Added an automatic retry mechanism on the frontend to overcome server compilation latency (hot-reload/boot latency) during concurrent startup.

### 2. ⚖️ Legal License Compliance (PolyForm Noncommercial 1.0.0)
We have updated the entire legal foundation and ownership attribution of the project:
*   **Copyright Attribution**: The copyright of the Archeres project is held entirely by **Benny Maisa**.
*   **Official Repository Link**: Dynamically links the license owner's name in the footer to the official Gitea/Forgejo repository: `https://repo.alexmaisa.my.id/alexmaisa`.
*   **License Enforcement**: Establishes the **PolyForm Noncommercial License 1.0.0** within the main `LICENSE` file, `README.md`, and all application footers. The use of this project is 100% free for academic, personal, and non-commercial research, and strictly prohibits commercial monetization without written permission.

### 3. 🎨 Premium Visual & UI Aesthetics Refinement
*   **Footer Links Cleanup**: Removed the aesthetically disruptive default text underline from the footer links across 5 main pages (Home, About, Admin, Dashboard, and Workspace Client) to provide a minimalist and highly modern touch.

---

## 📦 Files Changed

*   `LICENSE`: Complete text of the PolyForm Noncommercial 1.0.0 license.
*   `README.md`: Updated `v0.9.5-beta` version badge, captcha security documentation, and non-commercial legal explanations.
*   `backend/utils/captcha.go` & `captcha_test.go`: Computation code for SVG generation and JWT signature unit testing.
*   `backend/handlers/auth.go` & `main.go`: Integration of registration validation and registration of the `/api/auth/captcha` API route.
*   `web/package.json`: Project version update to `0.9.5-beta`.
*   `web/src/app/auth/register/page.tsx`: Captcha state integration, resilient response handling, and security verification interface.
*   Frontend Footers (5 Pages): Updated Benny Maisa's external interactive links and removed underline decoration.

---

## 🛠️ Manual Release Tagging Guide (For Benny Maisa)

Use the following git commands to create a release tag locally and push it to the Forgejo repository:

```bash
# 1. Ensure you are on the main branch and pull the latest updates
git checkout main
git pull origin main

# 2. Create a new annotated tag for v0.9.5-beta
git tag -a v0.9.5-beta -m "Archeres Release v0.9.5-beta: Encrypted Math Captcha and License Compliance"

# 3. Push the tag to the Forgejo server
git push origin v0.9.5-beta
```

Once pushed, the **Forgejo Actions** workflow will automatically detect this release tag, perform automatic multi-arch compilation, and upload the latest Docker images (`archeres-web:latest` & `archeres-backend:latest`) to your private registry at `repo.alexmaisa.my.id`.
