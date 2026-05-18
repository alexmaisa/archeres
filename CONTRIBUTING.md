# Contribution Guidelines (CONTRIBUTING.md)

Thank you for contributing to **Archeres**! To keep our repository clean, legible, and consistent, this project enforces strict Git commit message conventions (Conventional Commits) written in **English**.

---

## 📌 Git Commit Message Standard

Every commit message **must** follow this format:

```
<type>: <short lowercase description of the change>
```

### 1. Allowed Commit Types

* **`feat`**
  * Used when adding a new user-facing feature to the frontend or backend.
  * *Example:* `feat: add slovin sample size calculator component`
* **`fix`**
  * Used when resolving a logical bug, math calculation error, or application crash.
  * *Example:* `fix: resolve divide by zero error in Lemeshow calculator`
* **`docs`**
  * Used when editing guides, markdown wikis, instructions, README, or code comments.
  * *Example:* `docs: update setup steps in local development guide`
* **`style`**
  * Used for visual visual-only alterations (CSS updates, color palettes, responsive alignment, whitespace formatting) without modifying logic.
  * *Example:* `style: implement glassmorphic card borders on project workspace`
* **`refactor`**
  * Used when optimizing code structures, cleaner loops, or better database queries without changing standard behavior.
  * *Example:* `refactor: optimize JWT session payload token generation`
* **`test`**
  * Used when adding, modifying, or fixing mathematical unit tests.
  * *Example:* `test: implement precision check for Cochran formula`
* **`chore`**
  * Used for project administration, setting up developer tools, updating package dependencies, compiling Makefiles, or Docker configs.
  * *Example:* `chore: configure local dev makefile target concurrently`

### 2. Strict Guidelines

1. **Commit Atomically:** Perform small, focused, single-purpose commits. Do not bundle backend changes and frontend styling updates in the same commit.
2. **Commit in English:** The entire Git log history must be written in English.
3. **Use Lowercase Descriptions:** Keep the descriptive text after the colon short, lowercase, and direct.
4. **No Ending Punctuation:** Do not end the commit message with a period (`.`).
