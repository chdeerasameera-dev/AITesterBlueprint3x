# B.L.A.S.T Prototype
## MyJobAssistant — Job Tracker Web Application

**Version:** 2.0  
**Date:** 2026-06-14  
**Framework:** B.L.A.S.T (Boundary · Logic · Architecture · Scenario · Test)

---

## B — Boundary

### What the system IS responsible for

| Boundary | Description |
|----------|-------------|
| **Data Entry** | Accepting all 9 job application fields via the Add Job form |
| **Data Persistence** | Storing and retrieving records from browser localStorage |
| **Metric Calculation** | Computing all 8 dashboard metrics for the last 14 calendar days |
| **Success Rate Formula** | `(Successes / Total Interviews Attended) × 100`, rounded |
| **Colour Rule Enforcement** | 0–33% = Red; 34–66% = Orange; 67–100% = Green |
| **Seed Data Injection** | Loading 5 AI-generated records when localStorage is empty |
| **SPA Routing** | Navigating between Dashboard, Add Job, and Job List without full reload |
| **Tile Click Navigation** | Each metric tile opens an InsightsModal with filtered job data |
| **AI Insights (Groq)** | Generating personalised career coaching via Groq Llama 3.1 API |
| **Theme Toggle** | Switching between Light (Ocean Blue) and Dark (Deep Ocean Night) modes |
| **Vercel Deployment** | Hosting at `myjobassistant.vercel.app` |

### What the system is NOT responsible for

| Out of Boundary | Reason |
|-----------------|--------|
| User authentication | Phase 1 is single-user only |
| Backend database / API | localStorage only in Phase 1 |
| Email reminders for follow-ups | Future phase feature |
| Data sync across devices / browsers | Phase 2 cloud backend |
| Mobile native (iOS/Android) | Future native app phase |

### Edge Cases (Boundary Conditions)

| Scenario | Expected Behaviour |
|----------|--------------------|
| 0 jobs in storage (first load) | Seed data injected; all tiles show values from seed records |
| 0 interviews attended | Success Rate = 0%; speedometer at leftmost; displayed in Red |
| 100% success rate | Success Rate = 100%; speedometer at rightmost; displayed in Green |
| All jobs outside 14-day window | All tiles show 0; speedometer at 0 |
| Job Title exactly 255 characters | Accepted |
| Job Title 256 characters | Rejected with inline validation error |
| Job Description exactly 10,000 characters | Accepted |
| dateApplied = exactly 14 days ago (midnight) | Included in 14-day window |
| dateApplied = 15 days ago | Excluded from 14-day window |
| localStorage quota exceeded | Show error toast; do not corrupt existing data |
| Groq API key missing | InsightsModal shows key-missing notice with link to console.groq.com |
| Dark mode toggled | Preference persisted to localStorage; applied on next load |

---

## L — Logic

### Core Business Rules

#### Rule 1: 14-Day Data Window
```
windowStart = TODAY - 14 days (time = 00:00:00)
A record qualifies if: record.dateApplied >= windowStart
```

#### Rule 2: Metric Definitions
```
Profile Matched       = COUNT(records WHERE profileMatched = true)
Jobs Applied          = COUNT(all records in window)
Interviews Attended   = COUNT(records WHERE interviewDetails IS NOT EMPTY)
Jobs Rejected         = COUNT(records WHERE status = "Rejected")
Follow-ups Pending    = COUNT(records WHERE followUp = true AND status NOT IN ["Selected","Rejected"])
Successes             = COUNT(records WHERE status = "Selected")
Feedback              = COUNT(records WHERE questionsAsked IS NOT EMPTY)
```

#### Rule 3: Success Rate Formula (v2.0 — corrected)
```
successRate = ROUND(successes / interviewsAttended × 100)

IF interviewsAttended = 0 THEN successRate = 0
IF successRate <= 33     THEN colour = RED    (#E53E3E)
IF successRate <= 66     THEN colour = ORANGE (#DD6B20)
IF successRate > 66      THEN colour = GREEN  (#38A169)
```

#### Rule 4: Speedometer Mapping (v2.0 — corrected)
```
angle = 180 + (successRate / 100) × 180   degrees (SVG coordinate system)

0%   → 180° (needle points LEFT)
50%  → 270° (needle points UP — top of arc)
100% → 360° (needle points RIGHT)

Clamp successRate to [0, 100] before angle calculation.
```

#### Rule 5: Form Validation
```
jobTitle:        REQUIRED | max 255 chars
companyName:     REQUIRED | max 100 chars
profileMatched:  REQUIRED | boolean (radio)
followUp:        REQUIRED | boolean (radio)
status:          REQUIRED | one of [Applied, Selected, Rejected, In Progress]
dateApplied:     REQUIRED | valid date | not in future
jobDescription:  OPTIONAL | max 10,000 chars
interviewDetails: OPTIONAL
questionsAsked:  OPTIONAL
```

#### Rule 6: Seed Data Trigger
```
ON application mount:
  IF localStorage["mja_jobs"] is empty OR does not exist:
    LOAD 5 seed records (dateApplied within last 14 days)
    SAVE to localStorage["mja_jobs"]
```

#### Rule 7: Theme Persistence
```
ON toggle click:
  IF current theme = "light" → set "dark"
  IF current theme = "dark"  → set "light"
  SAVE to localStorage["mja_theme"]
  APPLY data-theme attribute to <html> element
```

#### Rule 8: Tile Click → InsightsModal
```
ON tile click:
  FILTER recent jobs by tile type
  OPEN InsightsModal with filtered jobs + Groq AI panel
  InsightsModal → "View Full List" → navigate to /jobs?filter=<key>
  
  Success Rate tile click → scroll to speedometer section
```

#### Rule 9: URL Filter Routing
```
/jobs                  → all jobs
/jobs?filter=profileMatched  → profileMatched = true
/jobs?filter=interviewed     → interviewDetails NOT empty
/jobs?filter=rejected        → status = "Rejected"
/jobs?filter=followup        → followUp = true AND status not final
/jobs?filter=selected        → status = "Selected"
/jobs?filter=feedback        → questionsAsked NOT empty
```

---

## A — Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx                                 │
│          (Router + ThemeProvider + JobContext Provider)          │
└────────────────────┬────────────┬───────────────────────────────┘
                     │            │                │
            ┌────────▼──┐  ┌──────▼────┐  ┌───────▼──────┐
            │ Dashboard │  │  AddJob   │  │   Jobs       │
            │  .jsx     │  │  .jsx     │  │   .jsx       │
            └────────┬──┘  └──────┬────┘  └───────┬──────┘
                     │            │               │
            ┌────────▼──────┐ ┌───▼────────┐ ┌───▼───────────────┐
            │ MetricTile ×8 │ │  JobForm   │ │  JobList          │
            │ (clickable)   │ │  (9 fields)│ │  (URL filter)     │
            │ Speedometer   │ │            │ │  JobDetailModal   │
            │ InsightsModal │ │            │ └───────────────────┘
            └───────────────┘ └────────────┘
                     │
            ┌────────▼──────────────────────┐
            │      services/groqService.js  │
            │   (Llama 3.1 via Groq API)   │
            └───────────────────────────────┘
                     │
            ┌────────▼──────────────────────┐
            │         useJobs Hook          │
            │   (CRUD: add, delete, update) │
            └────────────────┬──────────────┘
                             │
            ┌────────────────▼──────────────┐
            │            localStorage       │
            │  "mja_jobs"  → JobRecord[]   │
            │  "mja_theme" → "light"/"dark"│
            └───────────────────────────────┘
```

### Project Structure
```
myjobassistant/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx          # Nav + theme toggle
│   │   │   └── Navbar.css
│   │   ├── dashboard/
│   │   │   ├── MetricTile.jsx      # Clickable tile card
│   │   │   ├── MetricTile.css
│   │   │   ├── Speedometer.jsx     # SVG gauge (corrected needle)
│   │   │   └── Speedometer.css
│   │   ├── jobs/
│   │   │   ├── JobForm.jsx         # 9-field form with validation
│   │   │   ├── JobForm.css
│   │   │   ├── JobList.jsx         # Sortable + URL filter
│   │   │   ├── JobList.css
│   │   │   ├── JobDetailModal.jsx  # Slide-in drawer
│   │   │   └── JobDetailModal.css
│   │   └── ui/
│   │       ├── Toast.jsx / .css
│   │       ├── Badge.jsx
│   │       ├── ConfirmDialog.jsx / .css
│   │       ├── InsightsModal.jsx   # AI insights popup (NEW)
│   │       └── InsightsModal.css
│   ├── pages/
│   │   ├── Dashboard.jsx           # 8 tiles + speedometer
│   │   ├── Dashboard.css
│   │   ├── AddJob.jsx
│   │   ├── AddJob.css
│   │   ├── Jobs.jsx                # URL-param filtering
│   │   └── Jobs.css
│   ├── context/
│   │   ├── JobContext.jsx          # CRUD + localStorage sync
│   │   └── ThemeContext.jsx        # Light/dark toggle (NEW)
│   ├── hooks/
│   │   └── useJobs.js
│   ├── services/
│   │   └── groqService.js          # Groq Llama 3.1 API (NEW)
│   ├── utils/
│   │   ├── storage.js
│   │   ├── metrics.js              # Success rate formula
│   │   └── seedData.js
│   ├── theme/
│   │   └── ocean.css               # Light + dark CSS tokens
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── vercel.json
├── .env                            # VITE_GROQ_API_KEY (NOT committed)
├── .gitignore                      # Excludes .env
└── package.json
```

### Data Flow (Tile Click → AI Insights)
```
User clicks tile → Dashboard filters recent jobs by tile type
→ InsightsModal opens with filtered jobs
→ User clicks "Generate AI Insights"
→ groqService.buildPrompt(tileType, jobs, metrics)
→ callGroq(systemPrompt, userPrompt) → Groq API (Llama 3.1)
→ AI response streamed back → displayed in modal
→ "View Full List" → navigate('/jobs?filter=xxx')
→ Jobs page reads URL param → JobList filters accordingly
```

---

## S — Scenario

### Scenario 1: First Time User (No Data)
```
GIVEN   The user opens the app for the first time
WHEN    The Dashboard loads
THEN    5 seed records are injected from seedData.js
AND     All dashboard tiles reflect the seed data values
AND     The speedometer renders based on seed success rate
AND     Ocean theme is applied; theme toggle shows in Navbar
```

### Scenario 2: Add a New Job Application
```
GIVEN   The user navigates to Add Job
WHEN    They fill all required fields and click "Add Job"
THEN    The record is saved to localStorage
AND     A success toast appears: "Job application added successfully"
AND     The user is redirected to Dashboard
AND     The affected tiles update immediately
```

### Scenario 3: Tile Click → InsightsModal
```
GIVEN   The Dashboard is loaded with 5 seed records
WHEN    The user clicks the "Profile Matched" tile
THEN    InsightsModal opens showing only profileMatched=true jobs
AND     A "Generate AI Insights" button is visible
AND     Clicking it calls Groq API with contextual prompt
AND     AI coaching text appears in the right panel
AND     "View Full List" button navigates to /jobs?filter=profileMatched
```

### Scenario 4: Success Rate Colour — Range Logic
```
GIVEN   1 out of 3 interviews were successful
WHEN    The Dashboard loads
THEN    successRate = ROUND(1/3 × 100) = 33
AND     The speedometer needle is at the 33% position (near left)
AND     The score label "33%" is displayed in Red (#E53E3E)
```

### Scenario 5: Dark Mode Toggle
```
GIVEN   The user is on any page in Light mode
WHEN    They click the theme toggle in the Navbar
THEN    The page transitions to Dark mode (deep navy-black background)
AND     Ocean teal accents remain vibrant
AND     All tiles, modals, forms display correctly
AND     Preference is saved to localStorage["mja_theme"]
AND     On page refresh, Dark mode is preserved
```

### Scenario 6: Speedometer at 0% (No Interviews)
```
GIVEN   There are no interviews attended in the last 14 days
WHEN    The Dashboard loads
THEN    successRate = 0
AND     The speedometer needle points to the LEFT (0% position)
AND     The score label "0%" is displayed in Red (#E53E3E)
```

### Scenario 7: URL Filter — Rejected Jobs
```
GIVEN   The user clicks the "Jobs Rejected" tile
WHEN    InsightsModal opens and they click "View Full List"
THEN    Browser navigates to /jobs?filter=rejected
AND     Job List shows only Rejected status records
AND     A filter badge "Filtered by: Jobs Rejected" appears
AND     Search still works within the filtered set
```

### Scenario 8: Delete a Job Record
```
GIVEN   The user is on the Job List page
WHEN    They click Delete on a record
THEN    A confirmation dialog appears
AND     On confirm, the record is removed from localStorage
AND     The Job List re-renders without that record
AND     Dashboard tile counts decrement accordingly
```

---

## T — Test

### Test Suite Overview

#### Unit Tests (utils/metrics.js)

| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-01 | No jobs → all zeros | `[]` | All metrics = 0; successRate = 0 |
| UT-02 | 1 selected + 1 interviewed | interviewDetails filled, status=Selected | successRate = 100; colour = Green |
| UT-03 | 0 selected + 1 interviewed | interviewDetails filled, status=Rejected | successRate = 0; colour = Red |
| UT-04 | Jobs outside window excluded | dateApplied = 30 days ago | jobsApplied = 0 |
| UT-05 | Exactly on windowStart day | dateApplied = 14 days ago | Included in metrics |
| UT-06 | 1 day before windowStart | dateApplied = 15 days ago | Excluded from metrics |
| UT-07 | successRate rounding | 1 success / 3 interviews | successRate = 33 (not 33.33) |
| UT-08 | interviewsAttended = 0 | No interviewDetails filled | successRate = 0 (no division by zero) |
| UT-09 | Colour — Red range | successRate = 20 | colour = #E53E3E |
| UT-10 | Colour — Orange range | successRate = 50 | colour = #DD6B20 |
| UT-11 | Colour — Green range | successRate = 80 | colour = #38A169 |

#### Integration Tests

| Test ID | Test Case | Steps | Expected |
|---------|-----------|-------|----------|
| IT-01 | Happy path add job | Fill all fields → Submit | Record in localStorage; toast shown |
| IT-02 | Validation: missing title | Leave title blank → Submit | Inline error; no record saved |
| IT-03 | Seed data on first load | Clear localStorage → reload | 5 seed records present |
| IT-04 | Delete job | Click delete → Confirm | Record removed; tile decrements |
| IT-05 | Tile click → InsightsModal | Click "Profile Matched" tile | Modal opens; filtered jobs shown |
| IT-06 | InsightsModal → View Full List | Click tile → View Full List | /jobs?filter=profileMatched loaded |
| IT-07 | URL filter applied | Navigate to /jobs?filter=rejected | Only Rejected records shown |
| IT-08 | Dark mode toggle | Click toggle in Navbar | dark class applied; localStorage saved |
| IT-09 | Dark mode persistence | Set dark → refresh page | Dark mode preserved |
| IT-10 | Groq AI — no key | Click "Generate AI Insights" (no key) | API key missing notice shown |
| IT-11 | Speedometer 0% | No interviews | Needle at LEFT; label Red |
| IT-12 | Speedometer 50% | 1 of 2 succeeded | Needle at TOP; label Orange |
| IT-13 | Speedometer 100% | All interviews succeeded | Needle at RIGHT; label Green |

#### E2E Test Scenarios (Manual / Playwright)

| Test ID | Scenario | Steps | Pass Criteria |
|---------|----------|-------|---------------|
| E2E-01 | Full happy path | Load → Add Job → Dashboard | Tile increments; toast visible |
| E2E-02 | Navigation | Click all nav links | All 3 pages load without 404 |
| E2E-03 | Refresh persistence | Add job → Refresh page | Job still visible in list |
| E2E-04 | Ocean theme visual | Open Dashboard (Light) | Blues/teals present; no broken styles |
| E2E-05 | Dark mode visual | Toggle to Dark | Black/teal palette; legible text |
| E2E-06 | Tile → InsightsModal | Click each tile | Modal opens with correct filter |
| E2E-07 | AI Insights | Enter Groq key → generate | AI text rendered within 5 seconds |
| E2E-08 | Mobile responsiveness | 375px viewport | No horizontal scroll; tiles stack |
| E2E-09 | Vercel deployment | Open myjobassistant.vercel.app | App loads; all pages accessible |

#### Performance Acceptance Criteria

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5 seconds |
| Time to Interactive | < 2.0 seconds |
| Lighthouse Performance Score | ≥ 85 |
| Lighthouse Accessibility Score | ≥ 90 |
| Bundle size (gzipped) | < 200 KB |

---

## B.L.A.S.T Summary Card

| Element | Key Decision |
|---------|-------------|
| **Boundary** | 14-day rolling window; no auth; localStorage + Groq AI in Phase 1 |
| **Logic** | `successRate = ROUND(successes/attended×100)`; 0-33=Red, 34-66=Orange, 67-100=Green |
| **Architecture** | React SPA + Context (Job+Theme) + localStorage + Groq API; 3 pages; InsightsModal |
| **Scenario** | 8 key user scenarios covering happy path, dark mode, AI insights, edge cases |
| **Test** | 11 unit tests + 13 integration tests + 9 E2E scenarios + performance targets |
