@AGENTS.md

# POV Win Goals App

## Project overview

A cross-platform Progressive Web App for solution consultants to run structured proof-of-value meetings. The app organizes use cases, surfaces ROI data, and produces a clean meeting summary — so every POV meeting ends with a booked next step, not a "we'll follow up."

Target users: solution consultants in enterprise sales. Small team (2–10) at launch.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (React) | App Router, TypeScript, deployed as PWA |
| Styling | Tailwind CSS | Utility-first, no custom CSS unless Tailwind can't do it |
| Backend | Supabase | Auth, PostgreSQL, file storage for proof artifacts |
| Deployment | Vercel | Auto-deploys from `main` branch |

---

## Screen inventory (MVP)

| # | Screen | Purpose |
|---|---|---|
| 1 | Login | Email + password auth, session persistence |
| 2 | Home | Start new meeting, view history, navigate to library |
| 3 | Library | Browse and manage personal use case library |
| 4 | POV Goal Setting | Set measurable goals, link to use cases, track status |
| 5 | Meeting Summary | Review resonated use cases, next step, notes, export |
| 6 | Meeting History | List of past sessions, re-open as read-only |

---

## Design constraints

These are non-negotiable — the app is used live on a Zoom-shared screen with a prospect watching.

- **Zoom-first:** every screen must read clearly at shared-screen resolution and contrast
- **One thing per screen:** no scrolling during live meeting navigation
- **Taps only during meetings:** no typing while presenting
- **Fast navigation:** moving between use cases must be instant and frictionless
- **Look polished:** this tool is used live with prospects — no rough edges in committed code

---

## Data model (reference)

```
User                  id, email, password_hash, name, role (admin|consultant)
Use Case (Org)        id, pain_point_tag, before_text, after_text, roi_stat, roi_description, artifacts[]
Use Case (Fork)       id, org_use_case_id (nullable), consultant_id, is_hidden, ...same fields
POV Goal              id, consultant_id, title, success_metric, status, linked_use_case_ids[]
Meeting Session       id, consultant_id, prospect_name?, prospect_company?, resonated_use_case_ids[], next_step, notes
```

---

## Theme — Expenzo (licensed)

The visual design is based on the **Expenzo Next.js admin template** (licensed copy at `NextJs-Expenzo-v1.0-08_May_2025/`). Extract components and patterns from the source rather than rebuilding from scratch.

### Font

**Poppins** via `next/font/google` — weights 300, 400, 500, 600, 700.

```ts
import { Poppins } from 'next/font/google'
const poppins = Poppins({ weight: ['300','400','500','600','700'], subsets: ['latin'], display: 'swap' })
```

### Icons

**Lucide React** — use exclusively, no other icon libraries.

### Component library

**shadcn/ui** — default style, CSS variables enabled, aliases at `@/components/ui`. Install components with `npx shadcn@latest add <component>`.

### Color tokens

All colors are CSS custom properties consumed via Tailwind's `hsl(var(--token))` pattern. Never hardcode hex values — reference the token names.

| Token | Dark mode value | Approximate hex | Usage |
|---|---|---|---|
| `--background` | `222.2 84% 4.9%` | `#050D1A` | Page background |
| `--card` | same as background | `#050D1A` | Card surfaces |
| `--secondary` / `--muted` | `217.2 32.6% 17.5%` | `#1E2D45` | Elevated surfaces, sidebar |
| `--foreground` | `210 40% 98%` | `#F8FAFC` | Primary text |
| `--muted-foreground` | `215 20.2% 65.1%` | `#8FA3BF` | Secondary text, labels |
| `--border` / `--input` | `217.2 32.6% 17.5%` | `#1E2D45` | Borders, input outlines |
| `--primary` (teal) | `162 83% 40%` | `#11B989` | CTAs, active states, highlights |
| `--destructive` | `0 62.8% 30.6%` | `#7A1A1A` | Errors, destructive actions |

**Accent palette** (for category differentiation — pain point tags, status badges, etc.):

| Name | Hex |
|---|---|
| Teal (primary) | `#11B989` |
| Blue | `#3B82F6` |
| Pink | `#EC4899` |
| Green | `#22C55E` |
| Orange | `#F97316` |
| Red | `#EF4444` |

### Border radius

Base radius is `--radius: 0.5rem` (8px). Tailwind tokens: `rounded-lg` (8px), `rounded-md` (6px), `rounded-sm` (4px).

### Dark mode

- Class-based dark mode (`darkMode: ["class"]` in Tailwind config)
- Default theme: `"system"` — follows OS preference
- Managed by `next-themes` via `ThemeProvider`
- The app is designed dark-first — Zoom-shared screens benefit from dark backgrounds

### Key dependencies (from Expenzo)

```
recharts              — charts (area, bar, line)
framer-motion         — animations
next-themes           — dark/light mode
lucide-react          — icons
react-hook-form       — forms
zod                   — validation
sonner                — toasts
tailwindcss-animate   — keyframe animations
```

---

## Supabase local dev workflow

```bash
# Start local Supabase stack
npx supabase start

# Check status and get API keys
npx supabase status

# Apply migrations
npx supabase db push

# Reset and reseed local DB
npx supabase db reset

# Generate TypeScript types from schema
# tail -n +2 strips the "Connecting to db" prefix; grep -v strips the injected claude-code-hint tag
npx supabase gen types typescript --local | tail -n +2 | grep -v "claude-code-hint" > lib/database.types.ts
```

Local Supabase runs at `http://127.0.0.1:54321`. Studio at `http://127.0.0.1:54323`.

**Auth key names changed in CLI v2:** the old `anon key` is now `Publishable`, and `service_role key` is now `Secret`. Use `npx supabase status` to retrieve them.

---

## PWA conventions

- PWA manifest lives at `public/manifest.json`
- Icons: 192×192 and 512×512 PNG at `public/icons/` — replace placeholders with real branding before launch
- Service worker is deferred — Next.js 16 uses Turbopack by default, which conflicts with all current SW plugins. Manifest alone is sufficient for install-to-dock at MVP.
- Test installability in Chrome DevTools → Application → Manifest before shipping any UI change

---

## Component conventions

- Tailwind utility classes only — no inline `style=` props, no CSS modules unless Tailwind genuinely can't do it
- Server components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- No placeholder content in committed files — every committed screen must show real content, not lorem ipsum or "TODO"

---

## Screenshot workflow

**Required for any layout or theme change:** take before and after screenshots and visually compare them before considering a change done.

```bash
# Capture local dev server page
node tools/screenshots/screenshot.js url http://localhost:3000/<path> <label>
```

Screenshots save to `tools/screenshots/output/` (gitignored). Captures desktop (1440px) and mobile (390px).

### Workflow

1. Start dev server: `npm run dev`
2. Screenshot the screen *before* changes — label it `<screen>-before`
3. Make the changes
4. Screenshot *after* — label it `<screen>-after`
5. Read both images and confirm visually before moving on

---

## Out of MVP scope

Do not build or stub these — they are explicitly deferred:

- Salesforce CRM integration (export is plain text / `.txt` only at MVP)
- Org library auto-sync to consultant forks (manual admin action at MVP)
- SSO / enterprise auth (email + password only)
- iOS and Android mobile apps (desktop PWA is sufficient)
- Analytics and usage reporting
- Password self-reset (admin resets manually)

---

## Git branching workflow

Three long-lived branches. Never commit directly to `qa` or `main`.

| Branch | Purpose | Vercel environment |
|--------|---------|-------------------|
| `dev`  | Active development — all commits land here | Preview (dev URL) |
| `qa`   | Stable build ready for review and testing | Preview (qa URL) |
| `main` | Production — only merged from `qa` | Production URL |

**Promotion flow:**

```
dev  →  (PR)  →  qa  →  (PR)  →  main
```

1. All code changes go to `dev` (auto-push is fine here).
2. When a feature or batch of changes is done, open a PR from `dev → qa` on GitHub.
3. Test on the `qa` Vercel preview URL — confirm everything works.
4. Open a PR from `qa → main` to ship to production.

`dev` is the default GitHub branch. Vercel auto-deploys all three branches to separate preview URLs on every push.

---

## Commands

```bash
npm run dev          # Start local dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx supabase start   # Start local Supabase stack
```

Deploy: merge `qa → main` via PR — Vercel handles the rest.
