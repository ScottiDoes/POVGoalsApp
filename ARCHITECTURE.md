# POV Win Goals App — Architecture

This document explains how the app is built, why it's structured the way it is, and what each library does. It's written for someone who knows how websites work but is new to React and Next.js.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [How the Folder Structure Works](#3-how-the-folder-structure-works)
4. [Screens & Routes](#4-screens--routes)
5. [How Authentication Works](#5-how-authentication-works)
6. [The Database (Supabase)](#6-the-database-supabase)
7. [How React Components Work in This App](#7-how-react-components-work-in-this-app)
8. [The UI System](#8-the-ui-system)
9. [PWA — Installing Like a Native App](#9-pwa--installing-like-a-native-app)
10. [Data Flow Diagram](#10-data-flow-diagram)
11. [Library Reference](#11-library-reference)

---

## 1. The Big Picture

This app is a **Progressive Web App (PWA)** — it runs in a browser but can be installed on a desktop or mobile device like a native app. Think of it as a website that blurs the line between "website" and "installed software."

The app has three main parts:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / DEVICE                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Next.js App                          │    │
│  │   (React UI running on Vercel — the web server)         │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │ reads/writes data                   │
│  ┌────────────────────────▼────────────────────────────────┐    │
│  │                  Supabase (Backend)                      │    │
│  │   PostgreSQL database + Auth + File storage              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

- **Next.js** handles what you see on screen — pages, navigation, forms
- **Supabase** stores all the data — users, use cases, goals, meeting sessions
- **Vercel** hosts the app and redeploys it automatically whenever you push to `main` on GitHub

---

## 2. Tech Stack Overview

| Layer | Technology | What It Does |
|---|---|---|
| Framework | **Next.js 16** (React) | Renders pages, handles routing, runs server logic |
| Language | **TypeScript** | JavaScript with type safety — catches mistakes before they ship |
| Styling | **Tailwind CSS v4** | Utility classes directly in HTML (no separate CSS files needed) |
| UI Components | **shadcn/ui** | Pre-built, styled components (buttons, dialogs, inputs) |
| Backend / DB | **Supabase** | Postgres database + authentication + file storage |
| Deployment | **Vercel** | Hosts the app; auto-deploys from GitHub `main` branch |
| Icons | **Lucide React** | Clean SVG icon set |
| Fonts | **Poppins** (Google Fonts) | The app's typeface, loaded via Next.js |

---

## 3. How the Folder Structure Works

```
POVGoalsApp/
│
├── app/                          ← All pages live here (Next.js App Router)
│   ├── layout.tsx                ← The HTML shell every page shares
│   ├── globals.css               ← Theme colors, fonts, base styles
│   │
│   ├── (auth)/                   ← Pages you see when NOT logged in
│   │   └── login/page.tsx        ← /login
│   │
│   └── (app)/                    ← Pages you see when logged in
│       ├── layout.tsx            ← Adds the sidebar to every page
│       ├── home/page.tsx         ← /home (dashboard)
│       ├── library/              ← /library (use case library)
│       ├── goals/                ← /goals (POV goals)
│       ├── meeting/              ← /meeting/new and /meeting/[id]
│       └── history/              ← /history and /history/[id]
│
├── components/
│   ├── layout/                   ← Sidebar and navigation
│   └── ui/                       ← Reusable UI pieces (button, card, etc.)
│
├── lib/
│   ├── database.types.ts         ← Auto-generated TypeScript types from DB
│   ├── utils.ts                  ← Helper: cn() for combining CSS classes
│   └── supabase/
│       ├── client.ts             ← DB client for the browser
│       └── server.ts             ← DB client for the server
│
├── supabase/
│   └── migrations/               ← SQL files that define the database schema
│
├── proxy.ts                      ← Authentication gatekeeper (runs on every request)
├── public/
│   ├── manifest.json             ← PWA install config
│   └── icons/                    ← App icons for home screen installs
│
└── tools/screenshots/            ← Screenshot utility for visual QA
```

### The `(auth)` and `(app)` folders — what are the parentheses for?

In Next.js, folders wrapped in parentheses `()` are called **Route Groups**. They let you organize files without adding those folder names to the URL. So `(app)/home/page.tsx` creates the route `/home`, not `/app/home`. The parentheses are just a grouping tool — they're invisible to the URL.

---

## 4. Screens & Routes

```
URL                        Screen                  Who can see it
─────────────────────────────────────────────────────────────────
/login                     Login                   Anyone (not logged in)
/home                      Dashboard               Logged-in users
/library                   Use Case Library        Logged-in users
/goals                     POV Goals               Logged-in users
/meeting/new               Start Meeting           Logged-in users
/meeting/[id]              Live Meeting            Logged-in users
/meeting/[id]/summary      Meeting Summary         Logged-in users
/history                   Meeting History         Logged-in users
/history/[id]              Session Detail          Logged-in users
```

`[id]` is a dynamic segment — it gets replaced with a real ID from the database. For example, `/meeting/abc-123` would load the session with ID `abc-123`. This is equivalent to query parameters (`?id=abc-123`) in traditional web development, just cleaner.

### Screen flow

```
Login ──► Home
           │
           ├──► Library ──► (edit use case)
           │
           ├──► POV Goals ──► (add/edit goal)
           │
           ├──► Start Meeting ──► Live Meeting ──► Summary ──► History
           │                                                      │
           └──────────────────────────────────────────────────────┘
```

---

## 5. How Authentication Works

Authentication is handled by **Supabase Auth** combined with a file called `proxy.ts`.

### What is proxy.ts?

In traditional web development, you might check "is the user logged in?" inside each page. In Next.js, you can run code **before** the page even loads using what's called middleware (here named `proxy.ts`). It runs on every request and acts as a gatekeeper:

```
User requests /home
       │
       ▼
  proxy.ts runs first
       │
  Is the user logged in?
  ┌────┴────┐
  No       Yes
  │         │
  ▼         ▼
Redirect  Let them through
to /login  to /home
```

### Session persistence

When a user logs in, Supabase stores a **session token in a cookie** (not localStorage). This means:
- The session survives page refreshes
- The session is accessible on the server — so pages can pre-load data with the user's identity before rendering

### Two Supabase clients

There are two ways to talk to the database, depending on where the code runs:

```
lib/supabase/client.ts  ← used in components marked "use client"
                           (runs in the browser, knows about cookies)

lib/supabase/server.ts  ← used in page.tsx files (server components)
                           (runs on the server before HTML is sent)
```

---

## 6. The Database (Supabase)

Supabase provides a **PostgreSQL** database. If you've worked with SQL before, it's the same — tables, rows, columns, foreign keys.

### Tables

```
profiles              ← One row per user. Extends the built-in auth.users table.
                        Stores: name, role (admin or consultant)

use_cases_org         ← Master library, managed by admins.
                        Available to all consultants as a starting point.

use_cases_consultant  ← Each consultant's personal library.
                        Can be forked from the org library or created from scratch.
                        Has: title, pain_point_tag, roi_stat, roi_description,
                             before_text, after_text, components[], is_hidden

pov_goals             ← Goals set by a consultant.
                        Has: title, success_metric, status, linked_use_case_ids[]

meeting_sessions      ← One row per meeting run with a prospect.
                        Has: prospect_name, prospect_company,
                             resonated_use_case_ids[], next_step, notes
```

### Entity Relationship Diagram

```
profiles
  │ id ──────────────────────────────────┐
  │                                      │
  ├──► use_cases_consultant              │
  │      id                              │
  │      consultant_id ─────────────────►┤
  │      org_use_case_id ──►use_cases_org│
  │      components[]                    │
  │                                      │
  ├──► pov_goals                         │
  │      consultant_id ─────────────────►┤
  │      linked_use_case_ids[]           │
  │                                      │
  └──► meeting_sessions                  │
         consultant_id ─────────────────►┘
         resonated_use_case_ids[]
```

### Row-Level Security (RLS)

Every table has RLS enabled. This means database rules enforce that:
- Consultants can only see and edit **their own** data
- Admins can see and edit **everyone's** data
- No client-side code can bypass this — the rules live in the database itself

Think of it like a bouncer that checks IDs at the database level, not just at the app level.

### Migrations

Schema changes are tracked as SQL files in `supabase/migrations/`. Each file is timestamped and applied in order:

| File | What it does |
|---|---|
| `20260510000000_initial_schema.sql` | Creates all tables, enums, RLS policies, triggers, storage buckets |
| `20260510000001_use_case_title.sql` | Adds `title` column to `use_cases_consultant` |
| `20260510000002_use_case_components.sql` | Adds `components text[]` column to `use_cases_consultant` |

---

## 7. How React Components Work in This App

If you've built websites with HTML and JS before, think of React components as **reusable HTML snippets that manage their own data**.

### Server Components vs Client Components

Next.js App Router introduced a distinction that's important to understand:

```
Server Component (default)          Client Component ("use client" at top)
────────────────────────────        ──────────────────────────────────────
Runs on the server                  Runs in the browser
Can fetch from the database         Cannot fetch directly from the DB
No interactivity                    Can have buttons, state, event handlers
Sends finished HTML to browser      Sends JavaScript to the browser
Fast first load                     Required for dynamic UI
```

**How it plays out in this app:**

```
page.tsx (Server)                  goals-client.tsx (Client)
─────────────────                  ─────────────────────────
Fetches goals from DB      ──►     Displays them, handles filter
Fetches use cases from DB  ──►     clicks, opens dialog, etc.
Passes data as props       ──►     Updates DB on user action
```

The pattern throughout the app: `page.tsx` fetches data, `*-client.tsx` handles interaction.

### Component hierarchy

```
app/layout.tsx          (the outermost shell — HTML, head, fonts)
  └── app/(app)/layout.tsx    (sidebar + main content area)
        └── app/(app)/goals/page.tsx    (fetches data)
              └── GoalsClient           (renders cards, handles clicks)
                    └── AddGoalDialog   (the modal dialog)
```

---

## 8. The UI System

### Tailwind CSS

Instead of writing separate CSS files, Tailwind lets you apply styles directly to elements using class names:

```html
<!-- Traditional CSS -->
<button class="save-button">Save</button>

<!-- Tailwind -->
<button class="bg-primary text-white rounded-lg px-4 py-2 hover:opacity-90">Save</button>
```

This app uses **CSS custom properties** (variables) for colors so the theme can be changed in one place (`globals.css`). The key color tokens:

| Token | Color | Used For |
|---|---|---|
| `--background` | `#050D1A` (dark navy) | Page background |
| `--primary` | `#11B989` (teal) | Buttons, active states, highlights |
| `--secondary` | `#1E2D45` | Cards, sidebar, elevated surfaces |
| `--foreground` | `#F8FAFC` | Primary text |
| `--muted-foreground` | `#8FA3BF` | Subtle labels, secondary text |

### shadcn/ui

shadcn/ui provides pre-built React components that you own — the source code lives in `components/ui/`. They use the Tailwind tokens above so they automatically respect the theme.

Available components in this app: `Button`, `Card`, `Dialog`, `Input`, `Label`, `Textarea`, `Badge`, `Avatar`, `Tooltip`, `Tabs`, `Checkbox`, `ScrollArea`, `Separator`.

---

## 9. PWA — Installing Like a Native App

A Progressive Web App is a website with a few extra files that tell the browser "this can be installed."

### What makes it a PWA

```
public/manifest.json        ← Tells the browser: app name, icon, theme color,
                               whether to show the browser chrome when installed

public/icons/               ← App icons shown on the home screen / dock
  icon-192.png
  icon-512.png
```

When a user visits the app in Chrome or Safari and the manifest is present, the browser offers an "Add to Home Screen" / "Install" prompt. Once installed, it opens in its own window without browser chrome — it looks and feels like a native app.

**What's deferred to post-MVP:** Service workers (offline support). The current setup gives install-to-dock capability. Full offline caching is a future addition.

---

## 10. Data Flow Diagram

Here's how a typical interaction flows through the app — using "Add a POV Goal" as an example:

```
User clicks "Add Goal"
        │
        ▼
AddGoalDialog opens    ← Client component, manages form state in React
        │
User fills in form
        │
User clicks "Save goal"
        │
        ▼
Supabase client.ts     ← Browser calls Supabase directly (no server needed)
        │
        ▼
INSERT into pov_goals  ← Row-Level Security checks user identity automatically
        │
        ▼
router.refresh()       ← Tells Next.js to re-run the server component
        │
        ▼
page.tsx re-fetches    ← Server fetches fresh data from Supabase
        │
        ▼
GoalsClient re-renders ← React updates just the changed parts of the page
        │
        ▼
New goal card appears
```

---

## 11. Library Reference

A quick summary of every dependency and what it does:

### Core Framework
| Library | Why it's here |
|---|---|
| **next** | The framework. Handles routing, server rendering, API routes, image optimization |
| **react** / **react-dom** | The UI library. Everything you see is a React component |
| **typescript** | Adds types to JavaScript. Catches bugs at write time, not runtime |

### Database & Auth
| Library | Why it's here |
|---|---|
| **@supabase/supabase-js** | The Supabase SDK — makes API calls to your database |
| **@supabase/ssr** | Adapts Supabase for Next.js server rendering (handles cookie-based sessions) |

### Styling
| Library | Why it's here |
|---|---|
| **tailwindcss** | Utility-first CSS framework — style with class names, no CSS files |
| **@tailwindcss/postcss** | Connects Tailwind to the PostCSS build pipeline |
| **tailwind-merge** | Prevents conflicting Tailwind classes when combining them programmatically |
| **clsx** | Conditionally joins CSS class names (used inside the `cn()` helper) |
| **tailwindcss-animate** | Adds animation utilities like `animate-in`, `slide-in-from-bottom` |

### UI Components
| Library | Why it's here |
|---|---|
| **shadcn/ui** (via `@base-ui/react`) | Pre-built accessible components. You own the source code in `components/ui/` |
| **lucide-react** | SVG icon library. Every icon in the app comes from here |
| **next-themes** | Manages dark/light mode and syncs with the OS preference |
| **sonner** | Toast notifications (the pop-up feedback messages) |
| **framer-motion** | Animation library — available but not heavily used yet |
| **recharts** | Chart library (area, bar, line charts) — available for future analytics screens |

### Forms & Validation
| Library | Why it's here |
|---|---|
| **react-hook-form** | Manages form state without re-rendering everything on every keystroke |
| **zod** | Schema validation — define the shape of data and validate it |
| **@hookform/resolvers** | Connects Zod to react-hook-form |

### Utilities
| Library | Why it's here |
|---|---|
| **date-fns** | Date formatting and manipulation (e.g., "3 days ago") |
