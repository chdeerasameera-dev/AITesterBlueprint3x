# RICEPOT Prompt Template
## MyJobAssistant — AI-Assisted Development Prompt Framework

**Version:** 2.0  
**Date:** 2026-06-14  
**Purpose:** Structured prompt template used with AI coding assistants to build and extend the MyJobAssistant application following the B.L.A.S.T Framework.

---

## What is RICEPOT?

**RICEPOT** is a prompt engineering template that ensures AI assistants have complete context before writing any code. It prevents hallucinations, reduces rework, and ensures outputs match the architectural decisions of the project.

```
R — Role         Who the AI should behave as
I — Intent       What the AI needs to accomplish
C — Constraints  Hard boundaries the AI must never violate
E — Examples     Reference code or patterns to follow
P — Persona      The user the feature is built for
O — Output       Exact expected deliverables
T — Tests        Validation criteria the output must satisfy
```

---

## Master RICEPOT Template — MyJobAssistant

### R — Role
```
You are a senior React developer specialising in:
- React 18 functional components and hooks
- CSS Custom Properties (no Tailwind, no CSS-in-JS)
- localStorage-based state persistence
- SVG data visualisation
- Accessible, WCAG 2.1-compliant web UIs
- Groq API integration (fetch-based, no SDK)

You follow the B.L.A.S.T Framework (Boundary, Logic, Architecture, 
Scenario, Test) and write clean, well-commented code.
```

### I — Intent
```
Build/modify the MyJobAssistant single-page application.
Current state as of v2.0:
- 3-page React SPA (Dashboard, Add Job, Job List)
- 8 clickable metric tiles → InsightsModal + Groq AI insights
- SVG speedometer showing Interview SUCCESS RATE (not failure rate)
- Light/Dark theme toggle with localStorage persistence
- URL-param based filtering on the Job List page
- localStorage-only data persistence (no backend)
- 30-day rolling data window
- Groq API (llama-3.1-8b-instant) for AI career coaching
```

### C — Constraints

#### Hard Constraints (NEVER violate)
```
✗ Do NOT use Tailwind CSS — all styles must use CSS Custom Properties
✗ Do NOT add a backend, API, or database — localStorage only in Phase 1
✗ Do NOT add user authentication — single-user application
✗ Do NOT change the success rate formula:
    successRate = ROUND(successes / interviewsAttended × 100)
    (NOT failure rate, NOT any other formula)
✗ Do NOT use inline styles — use class names referencing CSS Custom Properties
✗ Do NOT break the dark theme — all new components MUST include dark mode overrides
✗ Do NOT commit .env to Git — API key stays in .env, which is in .gitignore
✗ Do NOT use a Groq SDK — use native fetch() to the Groq API endpoint
```

#### Soft Constraints (Prefer these patterns)
```
~ Keep components focused and single-responsibility
~ Each JSX component has a matching CSS file in the same folder
~ Use useCallback/useMemo where dependencies are clear
~ Keep all data computations in utils/metrics.js
~ Keep Groq prompts in services/groqService.js
~ New UI components go in src/components/ui/
~ New pages go in src/pages/ with matching .css file
```

### E — Examples

#### Correct Success Rate Calculation
```javascript
// src/utils/metrics.js — DO NOT CHANGE THIS FORMULA
const successRate = interviewsAttended > 0
  ? Math.round((successes / interviewsAttended) * 100)
  : 0;
```

#### Correct Speedometer Needle Angle
```javascript
// src/components/dashboard/Speedometer.jsx
// Maps: 0% → 180° (left) | 50% → 270° (top) | 100% → 0° (right)
const angleDeg = 180 + (animatedRate / 100) * 180;
const angleRad = (angleDeg * Math.PI) / 180;
const needleX  = cx + 85 * Math.cos(angleRad);
const needleY  = cy + 85 * Math.sin(angleRad);
```

#### Correct Colour Logic
```javascript
// src/utils/metrics.js
export const getSuccessRateColour = (rate) => {
  if (rate <= 33) return '#E53E3E';  // Red   — Low (0–33%)
  if (rate <= 66) return '#DD6B20';  // Orange — Mid (34–66%)
  return '#38A169';                   // Green  — High (67–100%)
};
```

#### Correct Dark Theme Pattern
```css
/* Every new component MUST include dark overrides at bottom of ocean.css */
[data-theme="dark"] .new-component {
  background: #131C2E;
  color: #D0E8F5;
  border-color: rgba(46,191,165,0.18);
}
```

#### Correct Context Usage
```javascript
// src/hooks/useJobs.js — always use this hook, never JobContext directly
import { useJobs } from '../../hooks/useJobs';
const { jobs, addJob, deleteJob, metrics } = useJobs();
```

#### Correct Groq API Call Pattern
```javascript
// src/services/groqService.js
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 600,
    temperature: 0.7,
  }),
});
```

#### CSS Custom Properties Token Reference
```css
/* Light theme (default) */
--ocean-sky:      #E8F4FD;   /* page background */
--white:          #FFFFFF;   /* card/surface */
--ocean-deep:     #0A2342;   /* dark navy */
--ocean-mid:      #1A6B8A;   /* deep teal */
--ocean-bright:   #2EBFA5;   /* seafoam CTA */
--ocean-wave:     #3AAFA9;   /* wave border */
--text-primary:   #0A2342;
--text-secondary: #4A7B9D;
--text-muted:     #7EB8C9;

/* Dark theme (data-theme="dark") */
--ocean-sky:      #0A0F1A;   /* near-black bg */
--white:          #131C2E;   /* dark surface */
--text-primary:   #D0E8F5;
--text-secondary: #7EB8D4;
/* Ocean accent colours stay identical in dark mode */
```

### P — Persona

```
Name:       Rajesh K.
Role:       Senior QA Engineer / Test Automation Specialist
Experience: 12+ years in software testing
Location:   Hyderabad, India
Job Search: Actively looking for QA Lead / SDET roles in IT/BFSI sector

Pain Points:
- Loses track of applications sent across multiple portals (Naukri, LinkedIn, Indeed)
- Cannot remember which companies asked for follow-ups
- No visibility into interview success rate trends
- Wants AI coaching on how to improve rejection patterns
- Needs a quick, private tracker without signing up for any SaaS tool

Technical Comfort: High — comfortable with browser-based tools
```

### O — Output

#### For New Feature Additions
```
1. JSX component file (e.g. src/components/ui/NewComponent.jsx)
   - Functional component with PropTypes or JSDoc comments
   - ARIA roles and labels on interactive elements
   - Uses CSS class names only (no inline styles)
   - Uses useTheme() if rendering differently in dark mode
   
2. CSS file (e.g. src/components/ui/NewComponent.css)
   - Light mode styles under default selectors
   - Dark mode overrides under [data-theme="dark"] .new-component
   - Uses CSS Custom Properties from ocean.css
   
3. Dark mode additions to ocean.css (if new surface/background elements)
   - [data-theme="dark"] .new-component { ... }
   
4. Unit tests (if logic is added)
   - Input → expected output table in the BLAST_Prototype.md Test section
```

#### For Bug Fixes
```
1. Root cause explanation (1–2 sentences)
2. The corrected code with before/after diff
3. A test case to prevent regression (added to BLAST_Prototype.md)
```

#### For Documentation Updates
```
Update all 4 documents when any of the following change:
  - Business rules (metrics, formulas, colour logic)
  - Data model (new fields on JobRecord)
  - Architecture (new contexts, services, routing)
  - Test coverage (new unit/integration/E2E tests)

Files to update:
  - BLAST_Prototype.md      (B/L/A/S/T sections + test table)
  - Framework_Document.md   (architecture, data model, code samples)
  - Requirements_Document.md (FR/NFR tables, user stories, change log)
  - RICEPOT_Prompt.md       (examples, constraints if patterns change)
```

### T — Tests

#### Before Marking any Feature DONE:
```
[ ] All form validations fire correctly (required, max length, type)
[ ] localStorage saves on add; reads on reload
[ ] Tile count updates immediately after add/delete
[ ] InsightsModal opens with correct filtered data for each tile
[ ] Groq AI returns a response when valid API key is set
[ ] "View Full List" navigates to correct /jobs?filter=xxx URL
[ ] Job List filter badge appears for all filter keys
[ ] Dark mode: toggle works; persists on refresh
[ ] Dark mode: all new components render legibly
[ ] Speedometer needle: 0% → LEFT, 50% → UP, 100% → RIGHT
[ ] Success rate colour: ≤33 = Red, 34–66 = Orange, ≥67 = Green
[ ] Mobile view (375px): no horizontal scroll, tiles stack properly
[ ] No console errors in browser developer tools
[ ] Lighthouse Accessibility score ≥ 90
```

---

## Prompt Templates for Common Tasks

### Add a New Metric Tile
```
Using RICEPOT constraints for MyJobAssistant v2.0:
Add a new metric tile called "[Tile Name]" that:
- Calculates: [formula based on JobRecord fields]
- Colour: [hex or variable name]
- Click behaviour: opens InsightsModal with filter: (j) => [filter function]
- Filter key: "[filterKey]" (used in URL /jobs?filter=[filterKey])
- Groq prompt for this tile: [describe what the AI should analyse]

Provide:
1. Updated tiles array entry in Dashboard.jsx
2. Updated FILTER_FNS entry in JobList.jsx
3. Updated filterMap entry in Dashboard.jsx
4. buildPrompt() case in groqService.js
5. Dark mode CSS if new elements added
```

### Fix a Visual Bug
```
Using RICEPOT constraints for MyJobAssistant v2.0:
Bug: [describe the visual bug]
Affected component: [component name and file path]
Expected behaviour: [what it should look like/do]
Current behaviour: [what it actually does]

Provide:
1. Root cause analysis
2. Corrected code (diff format)
3. New test case to add to BLAST_Prototype.md Test section
4. Dark mode verification: does the fix work in both themes?
```

### Add a Phase 2 Feature (Preparation)
```
Using RICEPOT constraints for MyJobAssistant v2.0:
Plan a Phase 2 addition: [feature name]
Constraints:
- Must not break Phase 1 localStorage behaviour
- Must remain compatible with existing ThemeContext and JobContext
- Must include dark mode styling
- Must be behind a feature flag or separate route
- Must update all 4 BLAST documentation files

Provide:
1. Architecture impact analysis
2. New files needed
3. Changes to existing files
4. Updated data model if new fields required
5. Migration strategy from localStorage to Phase 2 storage
```

---

## Project File Quick Reference

| File | Purpose |
|------|---------|
| `src/theme/ocean.css` | All CSS tokens + dark mode overrides (DO NOT remove existing rules) |
| `src/context/JobContext.jsx` | CRUD + localStorage + seed injection |
| `src/context/ThemeContext.jsx` | Light/Dark toggle + persistence |
| `src/utils/metrics.js` | All 8 metric calculations + success rate formula |
| `src/services/groqService.js` | Groq API + all 8 per-tile prompt builders |
| `src/components/ui/InsightsModal.jsx` | Tile click popup with AI insights |
| `src/pages/Dashboard.jsx` | 8 clickable tiles + speedometer + InsightsModal state |
| `src/pages/Jobs.jsx` | Reads `?filter=` URL param → passes to JobList |
| `src/components/jobs/JobList.jsx` | URL filter + search + sort table |
| `.env` | `VITE_GROQ_API_KEY` (never committed) |
| `.gitignore` | Excludes .env, node_modules, dist |
| `vercel.json` | SPA routing fallback for Vercel |
