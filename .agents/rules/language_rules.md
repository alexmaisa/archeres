# AI Agent Language Guidelines (language_rules.md)

This file sets forth strict execution parameters for **Antigravity** and other pair-programming AI Agents regarding code language standards and dynamic multi-language translation layers for project **Arche**.

---

## 📌 Codebase & Interface Language Protocol

As an AI Agent, you **must** strictly enforce the following language separation rules:

### 1. English Codebase Core (100% English)
The core codebase must be written **strictly in English**. This applies to:
* All directory and file names.
* Variable, function, type, struct, class, and method names.
* SQL schemas, GORM tags, database migrations, and fields.
* Seed records, default user profiles, and test parameters.
* **Developer Logs:** Standard backend system log outputs (`log.Printf`, etc.).
* **API Error Responses:** JSON error keys and descriptive default states returned by backend handlers.
* **Inline Comments:** All code docstrings and explanatory notes.

### 2. Multi-language Web Interface (react-i18next)
To accommodate Indonesian and international researchers, the UI/UX must be fully dynamic:
* **No Hardcoded Strings:** You must **NEVER** write hardcoded Indonesian or English text strings directly inside Next.js page files, navigation headers, sidebar controls, or wizard components.
* **Centralized i18n Map:** All copy (labels, buttons, headings, tooltips, validation errors, slider labels) must be defined in the bilingual `frontend/src/app/i18n.js` resource dictionary.
* **Hook Ingestion:** Frontend components must import the `useTranslation()` hook from `react-i18next` and fetch copy via the `t('key.subKey')` function (e.g., `<button>{t('common.save')}</button>`).
* **Dynamic Language Swap:** Ensure that switching standard i18n locales via `i18n.changeLanguage()` works instantly across all layouts and workspace panels without forcing page refreshes.
