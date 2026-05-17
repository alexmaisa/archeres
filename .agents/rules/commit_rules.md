# AI Agent Commit Guidelines (commit_rules.md)

This file sets forth strict execution parameters for **Antigravity** and other pair-programming AI Agents regarding code staging and repository commits for project **Arche**.

---

## 📌 Rules of Engagement for Git Commits

As an AI Agent, you **must** strictly adhere to the following rules:

### 1. English Codebase & Commit Messages
* All code additions, GORM models, developer tools, comments, test scripts, and system logs must be in **English**.
* All Git commit messages **must** be written in **English** following Conventional Commit specifications.

### 2. Strictly Atomic Commits
* **Definition:** A commit is atomic if it contains exactly one single-purpose change (e.g., implementing one backend handler, adding one test suite, setting up one configuration file).
* **AI Requirement:** You must commit incrementally. Do **NOT** write files for the entire backend, frontend, and tests, and then bundle them in a single massive commit. 
* **Execution Flow:**
  1. Write the code for a specific unit (e.g., refactoring registration handler).
  2. Compile and run automated checks (e.g., `go test` or `pnpm build`) to verify correctness.
  3. Propose a single focused commit in standard lower-case English format (e.g., `refactor: support dynamic admin assignment on first signup`).
  4. Only proceed to the next task *after* the previous task has been successfully committed to the repository.

### 3. Conventional Commit Prefix Map
You must strictly prepend the following exact prefixes matching the task's context:

* `feat`: Adding user-facing interactive frontend elements or backend endpoints.
* `fix`: Resolving bugs, typos, and math anomalies.
* `docs`: Documentation, README, code comments, or agent guidelines.
* `style`: Styling, layout, theme tokens, and animations.
* `refactor`: Structural optimization without affecting runtime logic.
* `test`: Adding or refining unit tests.
* `chore`: Configuring build setups, dependencies, Dockerfiles, and Makefiles.
