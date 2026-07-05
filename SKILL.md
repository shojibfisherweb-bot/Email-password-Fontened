**Skill: Create Workspace SKILL.md for server-run & dependency workflow**

Scope: workspace

Summary:
- This skill captures the developer workflow observed in the conversation: installing Node packages, starting the backend, handling port conflicts (EADDRINUSE), and addressing audit vulnerabilities and environment notes (PowerShell/PSReadLine). It produces a reproducible checklist and troubleshooting steps to run the backend reliably.

Step-by-step process:
1. Install or update dependencies.
   - Run `npm install` for needed packages (e.g., `mongodb`, `mongoose`, `nodemailer`, `socket.io-client`).
   - Optionally run `npm audit` and assess fixes (`npm audit fix` or `npm audit fix --force` for breaking changes).

2. Start the backend server.
   - Use `nodemon server.js` (or the project's start script).

3. If server fails with `EADDRINUSE` (address already in use):
   Decision point: choose to free the port or change the server port.
   - Option A — Free the port (Windows):
     - Find the PID: `netstat -ano | findstr :3001`.
     - Terminate: `taskkill /PID <pid> /F`.
   - Option B — Change port:
     - Update the environment variable `PORT` (e.g., `.env` or start script) or change the port constant in `server.js`.
   - Option C — Restart the process holding the port in the correct way if it's your intended instance.

4. Re-run the server and confirm listening without error.

5. Address other environment warnings:
   - PowerShell PSReadLine note: if PS detects a screen reader, it disables PSReadLine. To re-enable run: `Import-Module PSReadLine` (if appropriate).

Decision points and branching logic:
- When `EADDRINUSE` occurs: free port vs change port vs reuse existing process.
- When `npm audit` reports vulnerabilities: decide between non-breaking fixes (`npm audit fix`) or force (`--force`) which may introduce breaking changes.
- When adding packages: prefer locking versions in `package.json` and committing `package-lock.json`.

Quality criteria / completion checks:
- `nodemon` (or `node`) starts without throwing `EADDRINUSE` or unhandled errors.
- Backend logs show `listening` on the expected port.
- No unresolved moderate/critical vulnerabilities remain, or they are documented (acceptance criteria: acceptable risk documented).
- `npm install` exits with no fatal errors.

Suggested commands (Windows):
- Install deps: `npm install` or `npm install <pkg1> <pkg2>`
- Audit: `npm audit` and `npm audit fix`
- Find port owner: `netstat -ano | findstr :3001`
- Kill process: `taskkill /PID <pid> /F`
- Re-enable PSReadLine: `Import-Module PSReadLine`

Completion checklist (to mark done when running this skill):
- Dependencies installed and `package-lock.json` updated.
- Server starts and binds to the intended port.
- Any port conflict resolved (process killed or port changed).
- Vulnerabilities triaged or fixed.

Example prompts to invoke this skill:
- "Run backend and fix EADDRINUSE on port 3001"
- "Create a checklist to install dependencies and start the server safely"
- "How do I free port 3001 on Windows and restart my Node server?"

Related customizations to add next:
- Add a small `scripts` section to `package.json` with `start`, `dev` (using `nodemon`), and `fix-audit` tasks.
- Add a `run-server.md` troubleshooting doc that links to the commands above.
- Create a VS Code task that runs `nodemon` and sets the `PORT` env var.

Notes / rationale:
- The skill focuses on concise, actionable steps so developers can quickly recover from common local dev failures shown in the conversation (package installs, port conflicts, PowerShell messages).
- Treat `npm audit fix --force` as a last-resort step; document any breaking upgrades.
