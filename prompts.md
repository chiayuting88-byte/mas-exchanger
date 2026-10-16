# MAS Exchanger – Development Prompts Log

This document chronicles the sequential prompts and instructions submitted during the development and deployment of the **MAS Exchanger** application.

---

### Prompt 1
```text
continue building using the attached codebase
```
**Context & Scope:**
- Initialized the empty starter template into a full-featured, institutional-grade Singapore Dollar (SGD) & Global Forex platform (`MAS Exchanger`).
- Integrated live exchange rate calculations, Singapore physical money changer comparisons (The Arcade Raffles Place, People's Park Complex, Mustafa Centre), multi-currency basket converter, travel banknote denomination calculator, interactive SVG trend charts, and Gemini AI FX timing advisor.

---

### Prompt 2
```text
git push https://<GITHUB_PAT_39_CHARS>@https://github.com/chiayuting88-byte/mas-exchanger.git
```
**Context & Resolution:**
- Attempted initial git push to remote repository `https://github.com/chiayuting88-byte/mas-exchanger.git`.
- Identified that the provided token was 39 characters instead of the required 40 characters for GitHub classic Personal Access Tokens (`401 Bad credentials`).
- Configured local git repository, built in-app GitHub sync modal with real-time character count and validation diagnostics.

---

### Prompt 3
```text
git push
```
**Context & Resolution:**
- Attempted default remote push; clarified the need for an authenticated 40-character token in non-interactive container environments.
- Added `/api/git-push` backend endpoint to support in-app 1-click synchronization.

---

### Prompt 4
```text
git push https://<GITHUB_PAT_40_CHARS>@https://github.com/chiayuting88-byte/mas-exchanger.git
```
**Context & Resolution:**
- Successfully authenticated with the corrected 40-character GitHub Personal Access Token.
- Pushed full application codebase to branch `main` at `https://github.com/chiayuting88-byte/mas-exchanger`.

---

### Prompt 5
```text
1. add a serveless API connection that pulls live data from eservices.mas.gov using the following endpoint:

GET https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily?end_of_day=2026-10-14
# KeyId: <MAS_KEY_ID>

2. store this in /api folder in the project root level, NOT the src folder
3. include /health.ts and /psi.ts within the same subfolder
4. do not hardcode any API keys, i will manually include
```
**Context & Resolution:**
- Created root-level `/api/` directory (outside `/src/`).
- Implemented `/api/mas-exchange-rates.ts` (and `/api/exchange-rates.ts` alias) connecting to MAS gateway with secure `process.env.MAS_KEY_ID` or header extraction.
- Implemented `/api/health.ts` for service health checks.
- Implemented `/api/psi.ts` fetching Singapore 24-hr regional PSI and PM2.5 air quality metrics from NEA / data.gov.sg.
- Added environment variable documentation to `.env.example`.
- Committed and pushed changes to `origin/main`.

---

### Prompt 6
```text
collate all prompts into a prompts.md file
```
**Context & Resolution:**
- Created `prompts.md` collating all session prompts, implementation details, and architecture milestones.
