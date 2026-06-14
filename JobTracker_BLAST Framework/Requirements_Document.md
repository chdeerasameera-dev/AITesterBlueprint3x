# Requirements Document
## MyJobAssistant — Job Tracker Web Application

**Version:** 2.0  
**Date:** 2026-06-14  
**Phase:** 1 (Single-User, LocalStorage, Groq AI)  
**Status:** ✅ Implemented

---

## 1. Functional Requirements

### FR-01: Data Window
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01.1 | All metrics are calculated over a rolling **30-day** window from today | MUST | ✅ |
| FR-01.2 | A record qualifies if `dateApplied >= (today − 30 days at 00:00:00)` | MUST | ✅ |
| FR-01.3 | The window badge on the dashboard displays "📅 Last 30 Days" | MUST | ✅ |

### FR-02: Job Application Fields (9 Fields)
| ID | Field | Type | Required | Constraints | Status |
|----|-------|------|----------|-------------|--------|
| FR-02.1 | Company Name | Text | ✅ | max 100 chars | ✅ |
| FR-02.2 | Job Title | Text | ✅ | max 255 chars | ✅ |
| FR-02.3 | Job Description | Textarea | ❌ | max 10,000 chars | ✅ |
| FR-02.4 | Profile Matched | Radio (Yes/No) | ✅ | Boolean | ✅ |
| FR-02.5 | Interview Details | Textarea | ❌ | Free text | ✅ |
| FR-02.6 | Follow-Up Required | Radio (Yes/No) | ✅ | Boolean | ✅ |
| FR-02.7 | Status | Dropdown | ✅ | Applied / Selected / Rejected / In Progress | ✅ |
| FR-02.8 | Questions Asked | Textarea | ❌ | Free text | ✅ |
| FR-02.9 | Date Applied | Date Picker | ✅ | Valid date, not future | ✅ |

### FR-03: Dashboard Metrics (8 Tiles)
| ID | Tile | Calculation | Colour | Clickable | Status |
|----|------|-------------|--------|-----------|--------|
| FR-03.1 | Profile Matched | COUNT(profileMatched=true) | Ocean blue | ✅ → InsightsModal | ✅ |
| FR-03.2 | Jobs Applied | COUNT(all in window) | Seafoam teal | ✅ → InsightsModal | ✅ |
| FR-03.3 | Interviews Attended | COUNT(interviewDetails ≠ empty) | Info blue | ✅ → InsightsModal | ✅ |
| FR-03.4 | Jobs Rejected | COUNT(status=Rejected) | Danger red | ✅ → InsightsModal | ✅ |
| FR-03.5 | Follow-ups Pending | COUNT(followUp=true AND status not final) | Warning amber | ✅ → InsightsModal | ✅ |
| FR-03.6 | Successes | COUNT(status=Selected) | Success green | ✅ → InsightsModal | ✅ |
| FR-03.7 | Success Rate | (Successes / Interviews) × 100, rounded | Always Green (#38A169) | ✅ → scroll to speedometer | ✅ |
| FR-03.8 | Feedback | COUNT(questionsAsked ≠ empty) | Purple | ✅ → InsightsModal | ✅ |

### FR-04: Success Rate Colour Rules
| ID | Condition | Colour | Hex |
|----|-----------|--------|-----|
| FR-04.1 | successRate = 0–33% | Red (Low — Needs Improvement) | #E53E3E |
| FR-04.2 | successRate = 34–66% | Orange (Mid — Moderate) | #DD6B20 |
| FR-04.3 | successRate = 67–100% | Green (High — Excellent) | #38A169 |
| FR-04.4 | interviewsAttended = 0 | Default to 0% → Red | #E53E3E |

### FR-05: Speedometer Gauge
| ID | Requirement | Status |
|----|-------------|--------|
| FR-05.1 | SVG semicircle arc: Left (0%) → Top (50%) → Right (100%) | ✅ |
| FR-05.2 | Needle formula: `angle = 180 + (rate / 100) × 180` degrees | ✅ |
| FR-05.3 | Arc gradient: Red (0%) → Orange (50%) → Green (100%) | ✅ |
| FR-05.4 | Needle colour matches range colour (Red/Orange/Green) | ✅ |
| FR-05.5 | Needle animates on mount using ease-out cubic (1000ms) | ✅ |
| FR-05.6 | Score label below hub shows `{rate}%` in range colour | ✅ |
| FR-05.7 | Title = "Interview Success Rate" (NOT "Failure Rate") | ✅ |
| FR-05.8 | Formula NOT displayed on the card | ✅ |
| FR-05.9 | Stats row: Interviews / Selected / Success Rate | ✅ |
| FR-05.10 | Range legend with SVG colour circles (Red/Orange/Green) | ✅ |

### FR-06: Tile Click → InsightsModal
| ID | Requirement | Status |
|----|-------------|--------|
| FR-06.1 | Clicking any tile (except Success Rate) opens InsightsModal | ✅ |
| FR-06.2 | Success Rate tile click smoothly scrolls to speedometer section | ✅ |
| FR-06.3 | Modal left panel: filtered job records for that tile type | ✅ |
| FR-06.4 | Modal right panel: AI Insights section (Groq powered) | ✅ |
| FR-06.5 | "View Full List" button navigates to `/jobs?filter=<key>` | ✅ |
| FR-06.6 | Pressing Escape closes the modal | ✅ |

### FR-07: AI Insights (Groq Integration)
| ID | Requirement | Status |
|----|-------------|--------|
| FR-07.1 | Uses Groq API with `llama-3.1-8b-instant` model | ✅ |
| FR-07.2 | API key stored in `.env` as `VITE_GROQ_API_KEY` | ✅ |
| FR-07.3 | `.env` listed in `.gitignore`; never committed | ✅ |
| FR-07.4 | Each tile type has a unique, contextual prompt | ✅ |
| FR-07.5 | If API key missing: show notice with link to console.groq.com | ✅ |
| FR-07.6 | Loading spinner shown while Groq is processing | ✅ |
| FR-07.7 | Error state with "Retry" button if API call fails | ✅ |
| FR-07.8 | "Regenerate" button allows refreshing AI response | ✅ |

### FR-08: Job List Page
| ID | Requirement | Status |
|----|-------------|--------|
| FR-08.1 | Displays all jobs in a sortable table | ✅ |
| FR-08.2 | Sortable columns: Company, Title, Profile, Status, Date, Follow-up | ✅ |
| FR-08.3 | Search box filters by company name, title, or status | ✅ |
| FR-08.4 | `?filter=` URL param pre-filters the table | ✅ |
| FR-08.5 | Active filter badge shown when URL filter is active | ✅ |
| FR-08.6 | Eye icon → opens full detail drawer (JobDetailModal) | ✅ |
| FR-08.7 | Delete icon → Confirm dialog → removes record from storage | ✅ |

### FR-09: Theme Toggle (Light / Dark)
| ID | Requirement | Status |
|----|-------------|--------|
| FR-09.1 | Toggle button in Navbar with Sun/Moon icon + pill track | ✅ |
| FR-09.2 | Light mode: Ocean Blue (page bg #E8F4FD, cards #FFFFFF) | ✅ |
| FR-09.3 | Dark mode: Deep Ocean Night (page bg #0A0F1A, cards #131C2E) | ✅ |
| FR-09.4 | Ocean teal accents (#2EBFA5) remain vibrant in both modes | ✅ |
| FR-09.5 | Preference persisted to `localStorage["mja_theme"]` | ✅ |
| FR-09.6 | On page refresh, last selected theme is restored | ✅ |
| FR-09.7 | All components fully themed (tiles, modals, forms, table, nav) | ✅ |

### FR-10: Data Persistence
| ID | Requirement | Status |
|----|-------------|--------|
| FR-10.1 | All job records stored in `localStorage["mja_jobs"]` as JSON | ✅ |
| FR-10.2 | 7 seed records loaded on first launch (empty storage) | ✅ |
| FR-10.3 | Seed records spread across the full 30-day window | ✅ |
| FR-10.4 | Records survive page refresh | ✅ |
| FR-10.5 | Delete removes record permanently from storage | ✅ |

---

## 2. Non-Functional Requirements

| ID | Category | Requirement | Status |
|----|----------|-------------|--------|
| NFR-01 | Performance | FCP < 1.5 seconds | ✅ |
| NFR-02 | Performance | TTI < 2.0 seconds | ✅ |
| NFR-03 | Accessibility | ARIA roles on all interactive elements | ✅ |
| NFR-04 | Accessibility | Keyboard navigable (Tab + Enter/Space) | ✅ |
| NFR-05 | Accessibility | Focus-visible outlines on interactive elements | ✅ |
| NFR-06 | Responsiveness | Works at 375px (mobile), 768px (tablet), 1280px (desktop) | ✅ |
| NFR-07 | Security | API key NEVER in source code or committed to Git | ✅ |
| NFR-08 | SEO | Title tags, meta descriptions, Open Graph tags | ✅ |
| NFR-09 | Maintainability | All CSS via CSS Custom Properties; no inline styles | ✅ |
| NFR-10 | Deployment | Vercel SPA routing configured via `vercel.json` | ✅ |

---

## 3. User Stories

### US-01: Dashboard Overview
```
As a job seeker,
I want to see all my key metrics on a single dashboard page,
So that I can quickly understand how my job search is going in the last 30 days.

Acceptance Criteria:
  ✅ 8 metric tiles are visible on the Dashboard
  ✅ All values are calculated from jobs in the last 30 days
  ✅ The speedometer shows my interview success rate
  ✅ Tiles reflect seed data on first load
```

### US-02: Clickable Tiles with AI Coaching
```
As a job seeker,
I want to click on any metric tile to see the underlying job records and get AI coaching,
So that I can understand the details behind each number and improve my approach.

Acceptance Criteria:
  ✅ Clicking any tile opens an InsightsModal
  ✅ The modal shows filtered jobs for that metric category
  ✅ "Generate AI Insights" button fetches personalised career coaching
  ✅ "View Full List" navigates to Job List with filter applied
```

### US-03: Add Job Application
```
As a job seeker,
I want to record a new job application with all relevant details,
So that I can track my applications systematically.

Acceptance Criteria:
  ✅ 9 fields available (company, title, description, profile, interview, follow-up, status, questions, date)
  ✅ Required fields validated before submit
  ✅ Character counters shown for text fields
  ✅ Success toast shown after submission
  ✅ Dashboard tiles update immediately
```

### US-04: Dark Mode
```
As a user who works in low-light environments,
I want to switch to a dark theme,
So that the app is comfortable to use at night.

Acceptance Criteria:
  ✅ Theme toggle visible in Navbar at all times
  ✅ Dark theme applies a deep navy-black palette with ocean teal accents
  ✅ All UI elements (tiles, modals, forms, table) render correctly in dark mode
  ✅ Selected theme persists after page refresh
```

### US-05: Filter Job List by Metric
```
As a job seeker,
I want to view only the jobs relevant to a specific metric (e.g. Rejected),
So that I can focus on that subset and take targeted action.

Acceptance Criteria:
  ✅ "View Full List" in InsightsModal navigates to /jobs?filter=rejected
  ✅ Job List pre-filters by the URL parameter
  ✅ A filter badge shows which filter is active
  ✅ User can still search within the filtered results
```

### US-06: Delete Job Record
```
As a job seeker,
I want to delete an incorrect or outdated job record,
So that my metrics remain accurate.

Acceptance Criteria:
  ✅ Delete button visible in Job List
  ✅ Confirmation dialog appears before deletion
  ✅ Record removed from localStorage on confirm
  ✅ Dashboard tiles update immediately after deletion
```

---

## 4. Constraints

| Constraint | Detail |
|-----------|--------|
| No backend | Phase 1 uses localStorage only |
| No auth | Single-user application; no login required |
| Browser storage limit | Typical localStorage limit ~5MB; sufficient for hundreds of records |
| API key dependency | AI Insights requires a valid Groq API key |
| Rate limits | Groq free tier: 30 requests/minute; sufficient for single-user use |
| No offline AI | Groq API requires internet connection |

---

## 5. Change Log

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-06-14 | Initial implementation: 3-page SPA, 8 metrics, 14-day window | AI Agent |
| 2.0 | 2026-06-14 | Added: Dark mode toggle, InsightsModal + Groq AI, corrected success rate formula, fixed speedometer needle angle, URL-based filtering, 30-day window, SVG legend circles, 7 seed records | AI Agent |
