# Framework Document
## MyJobAssistant — Technical Architecture & Development Framework

**Version:** 2.0  
**Date:** 2026-06-14  
**Deployment Target:** https://myjobassistant.vercel.app

---

## 1. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| UI Framework | React 18 (Vite) | Fast HMR, lightweight, component-based |
| Routing | React Router v6 | SPA routing + URL search params for filtering |
| Styling | CSS Custom Properties (ocean.css) | Light + Dark theme tokens without extra dependencies |
| State | React Context + useReducer | JobContext (data) + ThemeContext (UI) |
| Persistence | localStorage (JSON) | Zero-backend Phase 1; easy to swap to API later |
| Visualisation | Pure SVG (inline React) | Corrected speedometer gauge, no charting library |
| AI Insights | Groq API (Llama 3.1 8B Instant) | Fast, free-tier AI coaching per tile click |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Notifications | Custom Toast component | Lightweight; no dependency needed |
| Deployment | Vercel (free tier) | Git-push deploy; SPA rewrites via vercel.json |
| Unique IDs | uuid v4 | Collision-free record IDs |

---

## 2. Project Structure

```
myjobassistant/
├── public/
│   └── favicon.svg                 # Ocean-themed SVG icon
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx          # Nav + Light/Dark toggle button
│   │   │   └── Navbar.css
│   │   ├── dashboard/
│   │   │   ├── MetricTile.jsx      # Clickable tile card (onClick + onSubtitleClick)
│   │   │   ├── MetricTile.css
│   │   │   ├── Speedometer.jsx     # SVG gauge (corrected angle formula)
│   │   │   └── Speedometer.css
│   │   ├── jobs/
│   │   │   ├── JobForm.jsx         # 9-field form with inline validation
│   │   │   ├── JobForm.css
│   │   │   ├── JobList.jsx         # Sortable + URL-param filter
│   │   │   ├── JobList.css
│   │   │   ├── JobDetailModal.jsx  # Full-detail slide-in drawer
│   │   │   └── JobDetailModal.css
│   │   └── ui/
│   │       ├── Toast.jsx / .css    # Auto-dismiss snackbar
│   │       ├── Badge.jsx           # Status colour badges
│   │       ├── ConfirmDialog.jsx / .css
│   │       ├── InsightsModal.jsx   # ★ NEW — AI insights popup per tile
│   │       └── InsightsModal.css
│   ├── pages/
│   │   ├── Dashboard.jsx           # 8 clickable tiles + speedometer
│   │   ├── Dashboard.css
│   │   ├── AddJob.jsx
│   │   ├── AddJob.css
│   │   ├── Jobs.jsx                # Reads ?filter= URL param
│   │   └── Jobs.css
│   ├── context/
│   │   ├── JobContext.jsx          # CRUD + localStorage sync + seed injection
│   │   └── ThemeContext.jsx        # ★ NEW — light/dark toggle with persistence
│   ├── hooks/
│   │   └── useJobs.js              # Consumes JobContext
│   ├── services/
│   │   └── groqService.js          # ★ NEW — Groq API + per-tile prompt builders
│   ├── utils/
│   │   ├── storage.js              # localStorage read/write helpers
│   │   ├── metrics.js              # 14-day window + success rate calculation
│   │   └── seedData.js             # 5 AI-generated seed records
│   ├── theme/
│   │   └── ocean.css               # CSS tokens + ★ NEW dark theme overrides
│   ├── App.jsx                     # Router + ThemeProvider + JobProvider
│   └── main.jsx                    # Entry point
├── index.html                      # SEO meta + OG tags
├── vite.config.js
├── vercel.json                     # SPA routing fallback
├── .env                            # VITE_GROQ_API_KEY (git-ignored)
├── .gitignore                      # Excludes .env, node_modules, dist
└── package.json
```

---

## 3. Data Model

### 3.1 Job Application Record

```typescript
interface JobRecord {
  id: string;                    // UUID v4
  companyName: string;           // max 100 chars
  jobTitle: string;              // max 255 chars
  jobDescription: string;        // max 10,000 chars
  profileMatched: boolean;       // Yes = true, No = false
  interviewDetails: string;      // Free text
  followUp: boolean;             // Yes = true, No = false
  status: JobStatus;             // Applied | Selected | Rejected | In Progress
  questionsAsked: string;        // Free text
  dateApplied: string;           // ISO 8601 date "YYYY-MM-DD"
  createdAt: string;             // ISO 8601 datetime
}

type JobStatus = 'Applied' | 'Selected' | 'Rejected' | 'In Progress';
```

### 3.2 localStorage Schema

```
Key: "mja_jobs"    → JSON array of JobRecord[]
Key: "mja_theme"   → "light" | "dark"
```

---

## 4. Metrics Calculation (14-Day Window)

```javascript
// utils/metrics.js

const getWindowStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getRecentJobs = (jobs) => {
  const cutoff = getWindowStart();
  return jobs.filter(j => new Date(j.dateApplied) >= cutoff);
};

export const getSuccessRateColour = (rate) => {
  if (rate <= 33) return '#E53E3E';  // Red
  if (rate <= 66) return '#DD6B20';  // Orange
  return '#38A169';                   // Green
};

export const computeMetrics = (jobs) => {
  const recent = getRecentJobs(jobs);
  const interviewsAttended = recent.filter(j => j.interviewDetails?.trim()).length;
  const successes = recent.filter(j => j.status === 'Selected').length;

  // SUCCESS RATE (v2.0): successes / attended × 100
  const successRate = interviewsAttended > 0
    ? Math.round((successes / interviewsAttended) * 100)
    : 0;

  return {
    profileMatched:   recent.filter(j => j.profileMatched).length,
    jobsApplied:      recent.length,
    interviewsAttended,
    jobsRejected:     recent.filter(j => j.status === 'Rejected').length,
    followUpsPending: recent.filter(j => j.followUp && j.status !== 'Selected' && j.status !== 'Rejected').length,
    successes,
    successRate,
    successRateColour: getSuccessRateColour(successRate),
    feedback: recent.filter(j => j.questionsAsked?.trim()).length,
  };
};
```

---

## 5. Speedometer Component Design (v2.0 — corrected)

```
SVG Arc: 180° semicircle (left to right through top)
Centre: (150, 130) | Radius: 100px
Arc gradient: Red (0%) → Orange (50%) → Green (100%)
Needle: rotates from LEFT (0%) to TOP (50%) to RIGHT (100%)

Angle mapping (SVG coordinate system, y-axis points down):
  0%   → 180° (left)
  50%  → 270° (top — needle points upward in SVG)
  100% → 360°/0° (right)

CORRECTED formula:
  angle = 180 + (rate / 100) × 180   [degrees]
  rad   = angle × π / 180
  needleX = cx + 85 × cos(rad)
  needleY = cy + 85 × sin(rad)

Colour of needle + score label matches range:
  0–33%   → Red    #E53E3E
  34–66%  → Orange #DD6B20
  67–100% → Green  #38A169
```

---

## 6. Theme System

### Light Theme (Ocean Blue)
```css
:root {
  --ocean-sky:    #E8F4FD;   /* page background */
  --white:        #FFFFFF;   /* card/surface */
  --text-primary: #0A2342;
  --ocean-bright: #2EBFA5;   /* CTA accent */
}
```

### Dark Theme (Deep Ocean Night)
```css
[data-theme="dark"] {
  --ocean-sky:    #0A0F1A;   /* near-black background */
  --white:        #131C2E;   /* dark navy surface */
  --text-primary: #D0E8F5;   /* light text */
  --ocean-bright: #2EBFA5;   /* same teal — pops on dark */
}
/* + 60+ element-specific dark overrides in ocean.css */
```

### Toggle Implementation
```jsx
// ThemeContext.jsx
const [theme, setTheme] = useState(() => localStorage.getItem('mja_theme') || 'light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mja_theme', theme);
}, [theme]);
```

---

## 7. Groq AI Integration

```javascript
// services/groqService.js
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

export const callGroq = async (systemPrompt, userPrompt) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  // ... fetch call to Groq API
};

// Per-tile prompt builders (8 tile types):
// jobsApplied, profileMatched, interviewed, rejected,
// followup, selected, feedback, successRate
export const buildPrompt = (tileType, jobs, metrics) => { ... };
```

### .env Setup
```bash
# .env (never committed — listed in .gitignore)
VITE_GROQ_API_KEY=gsk_your_key_here
```

Get your free key: https://console.groq.com

---

## 8. Routing Map

```
/              → Dashboard (Page 1)
/add           → Add Job (Page 2)
/jobs          → Job List (Page 3) — all jobs
/jobs?filter=profileMatched  → filtered by profile match
/jobs?filter=interviewed     → filtered by interview attended
/jobs?filter=rejected        → filtered by Rejected status
/jobs?filter=followup        → filtered by pending follow-up
/jobs?filter=selected        → filtered by Selected status
/jobs?filter=feedback        → filtered by questions recorded
```

`vercel.json` rewrite rule:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## 9. InsightsModal — Tile Click Flow

```
Dashboard tile click
  → Compute filtered jobs for tile type
  → Set modal state: { tileType, title, icon, colour, jobs, filterKey }
  → InsightsModal renders:
       Left panel:  Filtered job cards (company, title, status, date, flags)
       Right panel: AI Insights section
         - No key: Warning with link to console.groq.com
         - Has key: "Generate AI Insights" button
           → callGroq(systemPrompt, buildPrompt(tileType, jobs, metrics))
           → Response displayed as formatted text
           → "Regenerate" button available
  → Footer: Close | View Full List → navigate('/jobs?filter=<key>')

Success Rate tile click:
  → Scrolls page to speedometer section (no modal)
  → Uses useRef + scrollIntoView({ behavior: 'smooth' })
```

---

## 10. Deployment Checklist

```
[ ] npm run build  → dist/ folder generated without errors
[ ] vercel.json    → SPA rewrites configured
[ ] .env           → VITE_GROQ_API_KEY set (Vercel env var, not committed)
[ ] vercel login   → authenticated to Vercel account
[ ] vercel --prod  → deployed to production
[ ] hostname       → myjobassistant.vercel.app confirmed live
[ ] Smoke test     → Dashboard loads, tiles show seed data
[ ] Dark mode      → Toggle works; persists on refresh
[ ] Tile click     → InsightsModal opens with filtered data
[ ] AI Insights    → Groq API returns coaching text (with valid key)
[ ] View Full List → /jobs?filter=xxx loads correctly
```

---

## 11. Phase 2 Roadmap

| Phase | Feature | Notes |
|-------|---------|-------|
| 2.0 | AI Feedback (enhanced) | Claude API for deeper job description analysis |
| 2.1 | Cloud Sync | Supabase or Firebase backend; replace localStorage |
| 2.2 | Calendar Integration | Google Calendar for follow-up reminders |
| 2.3 | Export | PDF / CSV export of job list |
| 2.4 | Multi-user | Clerk auth + per-user data isolation |
| 2.5 | Mobile App | React Native with shared business logic |
