# KCG Shift Scheduler — From-Scratch Reconstruction Plan

## 1. Purpose

This document is the implementation specification for recreating a behaviorally and visually similar KCG Shift Scheduler from an empty directory. It describes observable behavior, data contracts, architecture, visual rules, build order, and acceptance criteria. It intentionally does not provide a line-for-line transcription of the current implementation.

The target is a small, unauthenticated, region-scoped scheduling SPA for a team. Users select a region, assign multiple members to calendar dates, cancel assignments with optional reasons, manage active and soft-deleted members, view an audit trail, and optionally view a public Google Calendar.

### Scope

- Client-only React single-page application.
- Supabase PostgreSQL persistence and shift realtime refresh.
- Region selection by stored preference, browser location, or dropdown.
- Schedule, contacts, history, and optional Google Calendar pages.
- Tailwind-based layout plus FullCalendar-specific CSS.
- Unit/component tests and Netlify-compatible production deployment.

### Non-goals

- Authentication, authorization, or private per-user data.
- Server-side rendering or a custom backend/API layer.
- Editing Google Calendar events.
- Transactional audit logging in the parity build.
- Automatic deletion of shifts when a member is soft-deleted.
- A general recurrence engine; the calendar rules below are deliberately narrow.
- Pixel-perfect reproduction of SVG paths. Equivalent 24px outline icons are sufficient.

## 2. Source of Truth and Known Inconsistencies

Use this priority when artifacts disagree:

1. Executable behavior in `src/` is the primary application source of truth.
2. `supabase/region_scope_setup.sql` is the source of truth for the regional extension.
3. Tests are the source of truth for explicitly locked edge cases.
4. `package-lock.json` is the source of truth for reproducible dependency versions.
5. `README.md` and the schema comment in `src/supabase.js` provide the baseline database intent, but contain stale details.

Known inconsistencies that a reconstruction must resolve deliberately:

- `README.md` declares `history.shift_date NOT NULL`, but member removal/restoration history has no date. The working contract requires `history.shift_date` to be nullable.
- The README emphasizes the legacy `VITE_SUPABASE_ANON_KEY`; runtime prefers `VITE_SUPABASE_PUBLISHABLE_KEY` and only falls back to the anon JWT.
- The README tells users to configure Google Calendar in `App.jsx`; the current source of truth is the region-keyed map in `src/config.js`.
- `package.json` uses compatible ranges. The versions below are the currently locked/installable versions and should be pinned for closest reproduction.
- The regional SQL says it is safe to run repeatedly. Its `IF NOT EXISTS`/upsert operations make ordinary reruns safe, but it assumes the three baseline tables already exist and does not reconcile a same-named pre-existing constraint with a different definition.
- The UI calls no-shift dates “greyed out,” but clicking them still opens the assignment modal and assignments remain possible.

## 3. Runtime and Pinned Dependencies

Use Node.js `20.19+` or `22.12+`. Vite 7 and several locked transitive packages do not support older Node releases. Add `.nvmrc` or `engines.node` in a hardened rebuild; neither exists in the parity source.

Pin these direct packages to the locked versions:

| Package | Version | Role |
| --- | ---: | --- |
| `react` / `react-dom` | 18.3.1 | UI/runtime |
| `react-router-dom` | 6.30.4 | Client routes and navigation |
| `@fullcalendar/react` | 6.1.20 | React calendar wrapper |
| `@fullcalendar/daygrid` | 6.1.20 | Month/week day-grid views |
| `@fullcalendar/interaction` | 6.1.20 | Date and event click interaction |
| `@supabase/supabase-js` | 2.106.1 | Database and realtime client |
| `date-fns` | 2.30.0 | Date parsing and display formatting |
| `vite` | 7.3.6 | Dev server/build |
| `@vitejs/plugin-react` | 4.7.0 | JSX transform/Fast Refresh |
| `tailwindcss` | 3.4.19 | Utility styling |
| `postcss` | 8.5.15 | CSS pipeline |
| `autoprefixer` | 10.5.0 | Vendor prefixes |
| `vitest` | 4.1.7 | Test runner |
| `jsdom` | 28.1.0 | Browser-like test environment |
| `@testing-library/react` | 16.3.2 | Component tests |
| `@testing-library/user-event` | 14.6.1 | User interaction tests |
| `@testing-library/jest-dom` | 6.9.1 | DOM matchers |
| `@rollup/rollup-win32-x64-msvc` | 4.60.4 | Optional Windows Rollup binary |

Package scripts:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest"
}
```

Use a lockfile and `npm ci` for verification/deployment. The repository-level Python/`uv` convention is not applicable to this JavaScript application.

## 4. Target File Tree

Keep the reconstruction small and close to this ownership split:

```text
.
├── .env.example
├── .gitignore
├── index.html
├── netlify.toml
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── public/
│   └── calendar.svg
├── supabase/
│   ├── baseline.sql                 # recommended: extract the baseline contract
│   └── region_scope_setup.sql       # regional migration, run second
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── config.js
    ├── supabase.js
    ├── index.css
    ├── contexts/
    │   └── RegionContext.jsx
    ├── components/
    │   ├── ConfigError.jsx
    │   ├── Icons.jsx
    │   ├── LoadingSpinner.jsx
    │   ├── Modal.jsx
    │   ├── Navigation.jsx
    │   ├── RegionSelectionPrompt.jsx
    │   └── Toast.jsx
    ├── pages/
    │   ├── SchedulePage.jsx
    │   ├── scheduleRules.js
    │   ├── ContactsPage.jsx
    │   ├── HistoryPage.jsx
    │   └── GoogleCalendarPage.jsx
    ├── test/
    │   └── setup.js
    ├── __tests__/
    │   ├── calendarStyles.test.js
    │   └── regionContext.test.js
    ├── components/__tests__/
    │   └── Toast.test.jsx
    └── pages/__tests__/
        ├── ContactsPage.test.jsx
        ├── HistoryPage.test.jsx
        ├── SchedulePage.test.jsx
        └── scheduleRules.test.js
```

The current project embeds baseline SQL in a JavaScript comment. A scratch rebuild should create `supabase/baseline.sql` so database setup is executable while retaining the same contract.

## 5. Environment and Configuration

### Environment variables

Provide `.env.example` with placeholders only:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
# VITE_SUPABASE_ANON_KEY=eyJ...  # legacy fallback only
```

Never expose a service-role/secret key in a Vite variable: every `VITE_*` value is bundled into the browser.

At startup, read the URL and use the publishable key first, then the anon key. Treat configuration as valid only when:

- the URL exists and does not contain the placeholder `your-project`; and
- the chosen key starts with `sb_publishable_` or legacy JWT prefix `eyJ`.

If invalid, do not create a Supabase client. Render a full-page “Supabase Not Configured” card with `.env` creation, variable examples, restart instructions, and a README pointer. This is a format/presence check, not a connectivity check.

### Application configuration

Keep one exported configuration object containing:

- `appName`: `KCG Shift Scheduler`.
- `googleCalendarUrls`: a mapping from canonical region name to public embed URL; initially `{ central_texas: '' }`.
- the complete schedule rule constants in section 10.

Expose a helper returning the configured URL for a region, or an empty string for no region/missing entry.

### Tool configuration

- Vite: React plugin; Vitest globals; `jsdom`; setup file importing `@testing-library/jest-dom`.
- Tailwind content: `index.html` and all JS/TS/JSX/TSX below `src`.
- Tailwind extension: optional `slate.850 = #1a2332` for parity, although current UI does not materially depend on it.
- PostCSS: Tailwind then Autoprefixer.
- HTML: English document, responsive viewport, title `KCG Shift Scheduler`, calendar favicon, and DM Sans 400/500/600/700 (plus 400 italic) from Google Fonts.

## 6. Database Contract

### 6.1 Phase A — baseline schema (run first)

Create the following in `public`. UUID defaults use `gen_random_uuid()` and timestamps use `now()`.

#### `members`

| Column | Contract |
| --- | --- |
| `id` | UUID primary key, generated by default |
| `name` | TEXT, required |
| `email` | TEXT, nullable |
| `phone` | TEXT, nullable |
| `color` | TEXT, default `#6366f1`, nullable unless deliberately hardened |
| `created_at` | TIMESTAMPTZ, default current time |
| `deleted_at` | TIMESTAMPTZ, nullable; null means active |

Create `idx_members_deleted_at`. Do not physically delete members in the UI.

#### `shifts`

| Column | Contract |
| --- | --- |
| `id` | UUID primary key, generated by default |
| `member_id` | UUID FK to `members.id`, `ON DELETE CASCADE`; baseline permits null |
| `shift_date` | DATE, required |
| `created_at` | TIMESTAMPTZ, default current time |

There is intentionally no unique constraint on date or member/date. The UI supports multiple people per date and filters out an already assigned member within one open modal, but concurrent/direct writes can duplicate an assignment.

#### `history`

| Column | Contract |
| --- | --- |
| `id` | UUID primary key, generated by default |
| `member_id` | UUID nullable FK to `members.id`, `ON DELETE SET NULL` |
| `member_name` | TEXT, required snapshot of the display name |
| `shift_date` | DATE, **nullable** for member removal/restoration |
| `action` | TEXT, required; app writes `assigned`, `cancelled`, `member_removed`, `member_restored` |
| `reason` | TEXT, nullable; used for cancellation reason |
| `created_at` | TIMESTAMPTZ, default current time |

No action `CHECK` exists in the parity contract.

#### Baseline view and access

Create `active_members` selecting `id, name, email, phone, color, created_at` where `deleted_at IS NULL`; grant view SELECT to `anon` and `authenticated`.

Enable RLS on `members`, `shifts`, and `history`. For parity, create broad `FOR ALL USING (true) WITH CHECK (true)` policies. In a standard Supabase project, ensure the relevant public-client table privileges also exist. These policies deliberately provide no confidentiality or authorization.

Optional sample members may use Alice Johnson, Bob Smith, Carol Davis, David Lee, and Emma Wilson with distinct colors. Sample data is not an acceptance requirement.

### 6.2 Phase B — regional migration (run second)

The regional migration depends on all three baseline tables. Execute the following in one transaction and in this order:

1. Create `region_cities`:
   - `city TEXT PRIMARY KEY`.
   - `region_name TEXT NOT NULL`.
   - `latitude DOUBLE PRECISION NOT NULL`, constrained to `[-90, 90]`.
   - `longitude DOUBLE PRECISION NOT NULL`, constrained to `[-180, 180]`.
   - `radius_miles NUMERIC(5,2) NOT NULL`, constrained `> 0`.
   - Index `region_name`.
2. Upsert these lowercase city identifiers:

   | Region | City | Latitude | Longitude | Radius miles |
   | --- | --- | ---: | ---: | ---: |
   | `central_texas` | `austin` | 30.2672 | -97.7431 | 50.00 |
   | `central_texas` | `killeen` | 31.1171 | -97.7278 | 25.00 |
   | `central_texas` | `waco` | 31.5493 | -97.1467 | 25.00 |

3. Create canonical `regions(region_name TEXT PRIMARY KEY)` and insert distinct names from `region_cities`.
4. Ensure `members.deleted_at` and its index exist, for compatibility with older README-created projects.
5. Add nullable `members.region_name`; backfill nulls to `central_texas`; then set default `central_texas` and `NOT NULL`.
6. Add `members.region_name → regions.region_name`, plus unique `(id, region_name)`. Create index `(region_name, deleted_at)`.
7. Add/backfill/harden `shifts.region_name` the same way. Add:
   - FK `region_name → regions.region_name`.
   - named composite FK `shifts_member_id_region_name_fkey` from `(member_id, region_name)` to `members(id, region_name)`, `ON DELETE CASCADE`.
   - index `(region_name, shift_date)`.
8. Add/backfill/harden `history.region_name`; add FK to `regions`; index `(region_name, created_at DESC)`.
9. Replace `active_members` as a `security_invoker = true` view selecting the baseline active fields plus `region_name`. Grant SELECT to `anon` and `authenticated`.
10. Enable RLS on `regions` and `region_cities`. Revoke all privileges on both from `anon`/`authenticated`, then grant only SELECT on `region_cities` and add an unrestricted SELECT policy for those roles. Do not grant browser reads of `regions`.
11. Commit and verify seeded mappings, non-null regional columns, and the region-city SELECT policy.

The name of the composite shift/member FK is an application contract because Supabase relationship selection explicitly targets it.

### 6.3 RLS, realtime, and security limitations

- Region filtering is application-level scoping, not access control. Any holder of the public key can request or mutate another region because the original broad policies remain.
- There is no login and no user-to-region membership model.
- Enable `shifts` in the Supabase Realtime publication/dashboard. SQL table creation alone does not guarantee change delivery.
- Member changes and history changes have no realtime subscriptions.
- A primary mutation and its history insert are two independent browser requests. Partial success is possible and there is no rollback.
- Most Supabase methods return `{ error }` rather than throwing. The current workflows often ignore `error`, so a failed request can appear successful.
- `region_cities.city` being the primary key means one city identifier cannot belong to multiple regions.
- The browser cannot administer canonical regions or city mappings; use trusted SQL/dashboard tooling.

## 7. Application Architecture and Data Flow

### Provider and route composition

The startup chain is:

```text
index.html #root
  → React StrictMode
    → App configuration gate
      → RegionProvider
        → BrowserRouter
          → sticky Navigation
          → max-width main content
            ├── /                 SchedulePage
            ├── /contacts         ContactsPage
            ├── /history          HistoryPage
            └── /google-calendar  GoogleCalendarPage
```

Do not add authentication or a layout framework. Preserve the lack of a wildcard route for strict parity: an unknown client route renders navigation plus empty main content. Netlify must still rewrite direct route requests to `index.html`.

### Data ownership

| Owner | State/responsibility | Data source |
| --- | --- | --- |
| `RegionProvider` | city mappings, region list, current region, region loading, selection setter | one `region_cities` fetch, local storage, geolocation |
| `Navigation` | route links, region dropdown, conditional Events link | region context and config |
| `SchedulePage` | active members, shifts, modal/assignment/cancellation/reminder state | `active_members`, `shifts`, `history`, shift realtime |
| `ContactsPage` | active/removed members, edit/removal/toast state | `active_members`, `members`, `shifts`, `history` |
| `HistoryPage` | latest 100 regional history entries | `history` |
| `GoogleCalendarPage` | current region’s public embed | configuration only |

All regional database reads and writes must include `.eq('region_name', currentRegion)`. Each page must avoid database work until a region exists. On region change, clear old region state immediately, close local UI, start a fresh fetch, and ignore responses belonging to the previous region.

The schedule page subscribes to all `INSERT`/`UPDATE`/`DELETE` events on `public.shifts` filtered by `region_name=eq.<currentRegion>`. Any event triggers a complete members-and-shifts refetch. Unsubscribe when the region changes or the page unmounts.

## 8. Region Resolution Algorithm

Use local-storage key `kcg-shift-scheduler.region-name` and Earth radius `3958.8` miles.

1. Fetch `region_name, latitude, longitude, radius_miles` from `region_cities` once when the provider mounts.
2. On query failure, continue with an empty city list. Do not crash.
3. Build selectable regions by filtering falsey names and de-duplicating while preserving first appearance order.
4. Read local storage inside `try/catch`.
5. If the stored value exactly matches a loaded region, select it and stop. Stale/invalid values do not become the active region.
6. Otherwise, if geolocation exists, request the current position with `maximumAge: 300000` and `timeout: 10000`. Ignore permission/time-out errors.
7. For valid finite coordinates, evaluate every valid city row using the Haversine formula. Ignore rows with missing/invalid coordinates, missing region, non-finite radius, or negative radius.
8. Consider the radius inclusive. Choose the closest city whose distance is within its radius. On an exact distance tie, retain the first city encountered. Return that city’s region or null.
9. A manual dropdown selection made while geolocation is pending must win; never let the late callback overwrite it.
10. Manual selection trims the requested string, accepts it only if it is in the loaded region list, and otherwise clears selection. Save a valid manual choice; removing/invalidating it removes the storage key. Storage failures are ignored.
11. Geolocated choices are not persisted in the parity behavior.

Loading ends after the city query, not after geolocation. Therefore, the region-selection prompt may appear briefly while location resolution is pending. Protect callbacks after unmount.

## 9. Visual System and Responsive Behavior

### Global shell

- Font: DM Sans.
- Body: full viewport height; diagonal `135deg` background from `#f8fafc` to `#eef2ff`; zero margin.
- Content: Tailwind `max-w-6xl`, centered, `px-4 py-8`.
- Cards: white, `rounded-xl`, subtle shadow, `border-slate-200`.
- Primary: indigo 500 (`#6366f1`), hover indigo 600; selected nav uses indigo 100/700.
- Text: headings slate 800; body slate 600/700; secondary slate 500/400.
- Destructive: red 500/600, with pale red hover/backgrounds.
- Warning/KRG/availability: amber palette.
- Form controls: slate 200 border, rounded-lg, indigo two-pixel focus ring.
- Scrollbar: 8px, slate track/thumb, rounded.

### Navigation

- Sticky at viewport top, z-index 40, 64px high, translucent white with backdrop blur and bottom border.
- Left: 32px indigo rounded-square calendar mark and `KCG Shift Scheduler`.
- Right: region select (maximum width 9rem), then Schedule, Contacts, History, and conditionally Events.
- Dropdown placeholder is `Loading regions...` while loading and `Select region` afterward; it is disabled only while regions load.
- Events link appears only when the selected region has a nonempty Google Calendar URL. The route itself always exists.
- Link labels are hidden below the `sm` breakpoint; icons remain. Preserve compact spacing and active/hover fills.

### Calendar

- White `rounded-xl` calendar card, padding 1.5rem.
- FullCalendar CSS variables: border `#e2e8f0`; button indigo 500, hover indigo 600, active indigo 700; today background `#c7d2fe`.
- Toolbar title: slate 800, 1.4rem/600. Buttons: rounded 8px, medium weight, capitalized.
- Normal eligible day cells: `#fef3c7`; hover `#fde68a`.
- KRG cells: `#fde68a`; hover `#fcd34d`.
- No-shift cells: `#f8fafc`; hover `#f1f5f9`; day number `#cbd5e1`; cursor visually default.
- Today number: 28px indigo circle with white text.
- Events: member color, borderless, 6px radius, compact 0.8rem label.
- Column headings: uppercase slate 500, 0.75rem, letter-spaced.
- At widths up to 640px, stack toolbar chunks vertically with 12px gap; center chunks; shrink title to 1.2rem and buttons to 0.875rem with 6px/12px padding.

### Overlays and feedback

- Modal overlay: fixed full screen, z-index 50, black at 40%, slight blur, closes on backdrop click.
- Modal panel: white, `rounded-2xl`, maximum width 28rem, strong shadow, header border, 1.5rem body padding. Fade overlay for 0.2s and slide/scale panel for 0.25s.
- Toast: fixed bottom-center, z-index 50, slate 800, white text, rounded, shadow; slide upward for 0.3s; auto-dismiss after 5 seconds.
- Loading: centered 32px indigo bottom-border spinner in a 24rem-high region.

## 10. Schedule Business Rules

Use local `Date` weekday values (`0=Sunday` through `6=Saturday`) and Sunday-start week-of-month ranges: week 1 is days 1–7, week 2 is 8–14, and so on.

Configuration:

| Rule | Value |
| --- | --- |
| Shift weekdays | Sunday (0), Wednesday (3), Saturday (6) |
| District meeting week | Third Sunday-start week |
| District Saturday cutoff | `2026-05` inclusive |
| KRG week | First Sunday-start week |
| Year-end block | December 24–31 inclusive |
| Sunday time | `8:30am - 12:30pm` |
| Wednesday time | `6:45pm - 8:15pm` |
| Saturday time | `9:30am - 12:30pm` |
| KRG reminder note | `Note that you may need to be there earlier for KRG prep` |

Classification precedence and output classes:

1. January 1 always returns only `first-sunday-krg`, regardless of its weekday or other rules.
2. December 24–31 always returns only `no-shift-day`.
3. Determine the third Sunday as a Sunday whose day-of-month is 15–21; classify it `no-shift-day`.
4. Determine the Saturday ending that same Sunday–Saturday week (day-of-month 21–27). Classify it `no-shift-day` only for `YYYY-MM >= 2026-05` using zero-padded lexical comparison.
5. Monday, Tuesday, Thursday, and Friday receive `no-shift-day`.
6. The first Sunday (day 1–7) outside January receives `first-sunday-krg`.
7. A day can contain both classes under general/custom rules, except for the January 1 and year-end early-return cases.

The rules style availability only. They do not suppress `dateClick`, disable the assignment button, validate writes, or cap KRG staffing. Preserve that distinction for parity.

After assignment, show `Weekday <time>` using the table above. For weekdays without a configured time, show only the weekday. Append `. <KRG reminder note>` to KRG dates.

## 11. Exact Page and Component Workflows

### 11.1 Schedule (`/`)

Initial load and region changes:

1. While provider/page data loads, show the spinner.
2. With no selected region, show the shared “Choose a region” status card and make no page query/subscription.
3. For a region, fetch in parallel:
   - `active_members`, region-filtered, ordered by name.
   - `shifts`, region-filtered, selecting every shift field and its member through `members!shifts_member_id_region_name_fkey(*)`.
4. Map shifts to FullCalendar events: id, member name or `Unknown`, date, and member color or `#6366f1`.
5. Configure month as the initial view; controls `prev,next today`, centered title, and `dayGridMonth,dayGridWeek`; automatic height; maximum three visible events per day.

Date/event interaction:

1. Clicking a date or an event opens the same date modal.
2. Title format: full weekday, month, day, year.
3. List all existing assignments. Each shows color/name, optional cancellation-reason input, and a full-width red “Cancel Shift” button.
4. If existing assignments and unassigned active members both exist, show an “Add another” divider.
5. Only members not already assigned in the modal appear in the dropdown. Hide the add section if none remain.
6. Assign requires a selected member. Insert a regional shift, request the named member relationship, then insert an `assigned` history row with the current member-name snapshot. Close the modal, show the time reminder, and refresh.
7. Cancel deletes the shift by both id and region, then inserts a `cancelled` history row using the modal date and optional reason. Remove it from modal state immediately and refresh.
8. Render a second “Shift confirmed” modal with reminder text and Close button after assignment.

Below the calendar, show a white legend card containing the exact hours summary, “No shift 3rd Sun (District Mtg),” an amber KRG note (“Requires more than 3 for KRG”), and one color-dot legend item per active member.

### 11.2 Contacts (`/contacts`)

Load both active and removed member lists in parallel for the selected region. Active reads use `active_members`; removed reads use `members` with `deleted_at IS NOT NULL`; both order by name. Reset to Active and clear dialogs/toasts on region change.

Page behavior:

- Header “Team Members” and Add Member button (Active tab only).
- Active/Removed pill tabs. Include removed count only when nonzero; clicking Removed refetches it.
- Active cards use a one-column grid, two at `sm`, three at `lg`; show first uppercase name character in a colored 40px circle, name, mailto email, tel phone, edit icon, and named remove action.
- Removed cards are slate, 75% opacity, with muted details and Restore action.
- Show distinct empty cards for no active or no removed members.

Add/edit modal fields are name, email, phone, and color. The palette in order is:

```text
#6366f1 #ec4899 #14b8a6 #f59e0b #8b5cf6 #ef4444 #22c55e #3b82f6
```

Name is the only required field. Disable save when `name.trim()` is empty, but preserve the entered string on write (including surrounding whitespace) for parity. New rows include the current region. Edits constrain by id and region.

Removal workflow:

1. Count this member’s shifts on/after the browser’s current ISO date, filtered by member and region.
2. Confirmation states that upcoming shifts remain and that the member leaves the assignment dropdown.
3. On confirm, set `deleted_at` to the current ISO timestamp; do not delete shifts.
4. Insert `member_removed` history with no shift date.
5. Refresh both lists and show `<name> removed from team` with Undo.
6. Undo/Restore sets `deleted_at` to null, inserts `member_restored` regional history, hides toast, and refreshes both lists.

### 11.3 History (`/history`)

- Query only after region selection.
- Fetch at most 100 regional rows, newest `created_at` first.
- Each row shows member snapshot name, action text, optional shift date (`MMM d, yyyy`), optional `Reason: ...`, and local timestamp (`MMM d, h:mm a`).
- Translate `member_removed` to “removed from team” and `member_restored` to “restored to team”; display other action strings directly.
- Assigned/restored use green dot/text; every other action uses red.
- Empty message: `No history yet. Assign or cancel shifts to see activity here.`

### 11.4 Google Calendar (`/google-calendar`)

- No region: show a centered “Select a region to view its Google Calendar” card.
- Region with no configured URL: show “Google Calendar not configured” and direct the developer to the region entry in `src/config.js`.
- Configured region: title “Google Calendar Events,” white bordered embed card, public URL iframe at 100% width and 600px height, no visible border, no scrolling, title `Google Calendar`, plus a centered read-only notice.
- Do not add OAuth or calendar write capabilities.

### 11.5 Shared components

- `RegionSelectionPrompt`: a `role=status`, polite-live white card instructing selection from navigation.
- `Modal`: render nothing when closed; backdrop click and X close; panel click stops propagation.
- `Toast`: message, optional Undo, named Close, and 5-second cleanup-safe timer.
- `Icons`: inline outline SVG components inheriting current color and consistently sized for calendar/users/history/Google/add/edit/delete/contact/status actions.

## 12. Implementation Plan (Dependency Order)

### Step 1 — Scaffold and lock the runtime

- [ ] Create the Vite React project, file tree, scripts, exact dependencies, Tailwind/PostCSS, Vitest/jsdom, HTML metadata/font, and favicon.
- [ ] Add `.env.example` and ignore `.env`.

**Verification:** `npm ci` succeeds on a supported Node version; a minimal `npm run dev` page starts; `npm test -- --run` discovers the setup without environment errors.

### Step 2 — Build and verify the baseline database

- [ ] Implement `baseline.sql` exactly as section 6.1, including nullable history date, soft-delete column/view, RLS, policies, grants, and indexes.
- [ ] Run it in a clean Supabase project and optionally seed members.

**Verification:** schema inspection matches every column/default/FK/nullability; an anon/publishable client can select and mutate the three app tables and read `active_members`.

### Step 3 — Apply regional schema

- [ ] Implement and run section 6.2 only after baseline setup.
- [ ] Enable shift realtime publication separately.

**Verification:** all existing app rows are `central_texas`; all three regional columns are non-null; wrong-region member/shift pairs fail; city mappings are publicly readable but not writable; `active_members` includes region and omits deleted members; a second ordinary migration run succeeds.

### Step 4 — Configuration gate and Supabase client

- [ ] Add environment selection/validation, singleton client, app config, and configuration-error screen.

**Verification:** missing, placeholder, and invalid-prefix credentials show ConfigError without client calls; publishable and legacy keys create the client; service-role keys are absent from output.

### Step 5 — Region provider and unit-tested resolution

- [ ] Implement city loading, ordered unique regions, safe storage, Haversine matching, location fallback, manual-selection precedence, context hook guard, and stale/unmount protection.

**Verification:** unit tests cover unique regions, zero distance, nearest in-radius city, outside all radii, malformed rows, inclusive boundary/tie behavior, stored priority, stale stored selection, geolocation denial, and late geolocation after manual selection.

### Step 6 — App shell, navigation, and shared UI

- [ ] Compose providers/routes, sticky responsive navigation, conditional Events link, prompt, spinner, modal, toast, icons, and global visual tokens/animations.

**Verification:** all four routes render via in-app and direct navigation; mobile labels hide; dropdown status is accessible; modal/backdrop/toast behavior matches section 9/11.

### Step 7 — Schedule rules before calendar workflows

- [ ] Implement pure day classification and reminder functions from section 10.
- [ ] Add FullCalendar imports and CSS states.

**Verification:** test representative third Sunday, pre/post-cutover Saturday, non-shift weekdays, normal working days, January 1, first non-January Sunday, December boundary, each reminder time, and KRG note. Inspect month and week views at desktop/mobile widths.

### Step 8 — Regional schedule page

- [ ] Implement guarded parallel reads, named relationship select, stale response checks, regional realtime lifecycle, event mapping, modal assignment/cancellation, history writes, legend, and confirmation reminder.

**Verification:** page tests prove no calls without region, filters on both reads, exact named join, filtered subscription/unsubscribe, duplicate-member filtering, regional writes, and refetch. Manual two-browser check proves a shift mutation refreshes the same region only.

### Step 9 — Contacts workflows

- [ ] Implement regional active/removed reads, responsive cards, add/edit, future shift count, soft-delete confirmation, restore/undo, and history writes.

**Verification:** tests cover no-region guard, regional reads/writes, add/edit validation, future count boundary, shifts retained after removal, removed tab, restore history, and 5-second toast behavior.

### Step 10 — History and Google Calendar

- [ ] Implement limited/ordered regional history formatting and empty state.
- [ ] Implement calendar unavailable/configured/no-region states and conditional navigation.

**Verification:** component tests assert regional query/order/limit and each action rendering; manually confirm a public calendar loads, is read-only, and the Events link responds to region changes.

### Step 11 — Parity QA and production packaging

- [ ] Run the full automated suite and production build.
- [ ] Execute the manual matrix below at small and large viewport widths.
- [ ] Configure Netlify and verify direct-route rewrites.

**Verification:** all checks and acceptance rows pass; production contains no secret key; direct refresh on every route returns the SPA; build warnings are documented.

## 13. Acceptance Matrix

### Automated

| Area | Required assertions |
| --- | --- |
| Region helpers/provider | unique names; Haversine; nearest in-radius; outside-radius null; invalid input; stored/manual/location precedence; failures are nonfatal |
| Schedule rules | third Sunday; Saturday cutoff before/after 2026-05; nonworking weekdays; normal Sun/Wed/Sat; Jan 1; first Sunday; Dec 24/31; three times; KRG note |
| Schedule page | no query/subscription without region; regional active-member and shift filters; named composite join; regional realtime filter; cleanup; add/cancel regional writes |
| Contacts | regional active/removed lists; no-region guard; add/edit; soft delete; regional future count; regional history; restore; empty states |
| History | regional filter; descending/100 limit; no-region guard; action/date/reason rendering |
| Shared UI | toast message/undo/close/timer; modal open/close/backdrop behavior; region prompt semantics |
| Visual regression contracts | exact calendar availability/KRG colors and no obsolete inset-outline rule |

Current reference suite status: 7 files, 32 tests. The latest consolidated rerun reported all 32 passing; an earlier run saw one Schedule test time out, so watch for asynchronous test flakiness. Router v7 future-flag warnings are non-failing.

Run:

```bash
npm test -- --run
npm run build
npm run preview
```

The current reference build succeeds and reports an approximately 659 KB JavaScript chunk warning. Treat it as a performance warning, not a parity failure.

### Manual

| Scenario | Expected result |
| --- | --- |
| Invalid/missing environment | Setup card renders; app does not attempt normal data UI |
| Fresh session, geolocation allowed in Austin | `central_texas` becomes selected if no manual/stored choice wins |
| Geolocation denied/outside radii | Region remains empty; selection prompt and usable dropdown remain |
| Stored valid region | Loads without waiting for geolocation |
| Switch regions during slow reads | No previous-region members, shifts, history, dialogs, or toast remain |
| Calendar month/week and mobile | Toolbar, colors, today marker, events, and stacked mobile controls match the visual spec |
| Click grey no-shift day | Assignment modal still opens (parity quirk) |
| Add two different members to one date | Both events appear; already assigned names leave the dropdown |
| Cancel with/without reason | Shift disappears and history contains correct snapshot/reason |
| Assign KRG date | Confirmation includes time and preparation note |
| Soft-delete member with future shifts | Warning count appears; shifts remain; member leaves active/dropdown and appears Removed |
| Undo within toast window / restore later | Member returns and restoration history is created |
| Two clients, same region | Shift mutation in one refreshes calendar in the other |
| Two clients, different regions | Filtered subscription/data do not visually cross regions |
| History | Latest 100 descending; action colors/text/date/reason/timestamp correct |
| Google Calendar config | Events link only appears for configured selected region; direct route still shows appropriate empty/configured state |
| Accessibility smoke test | Keyboard can reach controls; dropdown and named actions announce; document known modal/icon/live-region gaps |
| Netlify direct URLs | Refreshing `/contacts`, `/history`, and `/google-calendar` returns `index.html`, not 404 |

Coverage not present in the current reference: browser E2E, live Supabase integration, migration/RLS tests, realtime integration, environment matrix, Google iframe validation, and Netlify deployment tests.

## 14. Deployment

Use Netlify with:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deployment sequence:

1. Provision Supabase.
2. Run baseline SQL, then regional migration; run verification queries.
3. Enable `shifts` realtime replication.
4. Configure only `VITE_SUPABASE_URL` and a public publishable (or legacy anon) key in Netlify.
5. Configure public regional Google Calendar embed URLs in source before build, if used.
6. Run tests/build locally with the same lockfile and Node major.
7. Deploy `dist`, then test direct routes, regional CRUD, realtime, and iframe behavior in production.

Because Vite substitutes environment values at build time, changing credentials requires a rebuild/redeploy.

## 15. Parity Quirks to Preserve

These are observable current behaviors. Keep them when the goal is a very similar reconstruction:

- Grey no-shift dates still accept clicks and assignments.
- January 1 is KRG even when it is not Sunday; December 24–31 early-return as no-shift.
- The district Saturday rule changes behavior at May 2026.
- Multiple members may share a date; duplicate prevention is only the open-modal dropdown filter.
- A soft-deleted member’s existing shifts remain and continue joining the base `members` table.
- Geolocated selection is not stored; only manual selection is.
- Region loading ends before geolocation completes, so a prompt can flash.
- Events navigation is conditional, but the route always exists.
- Unknown routes have no custom 404 UI.
- Names are trim-validated but stored untrimmed.
- Database errors are mostly console-only and returned Supabase errors may not prevent optimistic-looking UI.
- Audit writes are separate from their mutations.
- History timestamps use the viewer’s local timezone and omit the year.
- Only shifts update in realtime; member/history screens require their normal refresh path.

## 16. Recommended Hardening (Do Not Mix Into a Strict Parity Build)

Track these as a separate follow-up so they do not silently change behavior:

- Add authentication plus membership-derived regional RLS; remove broad public mutation policies.
- Move mutation+history pairs into transactional database functions.
- Check every Supabase `{ error }`, display failure feedback, and only confirm success after verified writes.
- Add a unique `(region_name, member_id, shift_date)` constraint if duplicate assignment is invalid.
- Enforce no-shift/KRG staffing rules in UI and database only after product confirmation.
- Validate/normalize member name, email, phone, color, action enum, and calendar URLs.
- Add accessible dialog semantics, focus trapping/restoration, Escape close, labels for edit/color/X controls, and live regions for spinner/toast.
- Subscribe to member/history changes or define an explicit refresh strategy.
- Add abortable requests rather than only ignoring stale responses.
- Add Node pinning, linting, coverage, CI, integration/E2E tests, and SQL migration tests.
- Lazy-load FullCalendar/page chunks to address the current bundle-size warning.
- Add a wildcard 404/redirect route and error boundary.
- Prefer a self-hosted/system font fallback strategy if external Google Fonts availability matters.

## 17. Risks and Open Questions

- **Authorization model:** What identity should own a region, and may a user access multiple regions? This blocks secure RLS design.
- **Availability enforcement:** Are grey dates informational or prohibited? Existing UI copy/style and click behavior conflict.
- **Duplicate assignments:** Is a member allowed to receive duplicate rows for one date through races/direct API calls?
- **KRG semantics:** The UI says more than three people are required, but no minimum/count validation exists.
- **Regional configuration:** Should schedule rules, timezone, and Google URL move from source configuration into the database?
- **Timezone:** Shift dates are date-only, while history/removal timestamps are local-display instants. Cross-timezone expectations are unspecified.
- **Calendar privacy:** Public iframe URLs require publicly viewable calendars. Confirm this is acceptable.
- **Migration portability:** `security_invoker` views require a suitable PostgreSQL version; current Supabase supports the intended pattern, but a non-Supabase target must be checked.
- **Realtime setup:** Dashboard/publication state is external to the repository and can drift.
- **Error UX:** Strict parity can report apparent success after a returned database error; decide when reliability should supersede parity.
- **Test stability:** One prior run timed out a Schedule test while a subsequent full run passed. Keep async waits deterministic.

## 18. Reference Map to the Current Source

| Concern | Current reference |
| --- | --- |
| Boot and provider/router order | `index.html`, `src/main.jsx`, `src/App.jsx` |
| Runtime configuration and schedule constants | `src/config.js` |
| Environment gate and baseline schema intent | `.env.example`, `src/supabase.js`, `README.md` |
| Exact regional database migration | `supabase/region_scope_setup.sql` |
| Region resolution and context contract | `src/contexts/RegionContext.jsx` |
| Routes, region selector, conditional Events link | `src/components/Navigation.jsx` |
| Calendar data/mutations/realtime/modal workflow | `src/pages/SchedulePage.jsx` |
| Calendar classification/reminders | `src/pages/scheduleRules.js` |
| Member CRUD, soft delete, restore, undo | `src/pages/ContactsPage.jsx` |
| Audit list formatting | `src/pages/HistoryPage.jsx` |
| Public calendar states/embed | `src/pages/GoogleCalendarPage.jsx` |
| Shared overlays/status UI | `src/components/Modal.jsx`, `Toast.jsx`, `LoadingSpinner.jsx`, `RegionSelectionPrompt.jsx`, `ConfigError.jsx` |
| Icon vocabulary | `src/components/Icons.jsx` |
| Visual and responsive rules | `src/index.css`, `tailwind.config.js`, `index.html` |
| Build/test/deployment configuration | `package.json`, `package-lock.json`, `vite.config.js`, `postcss.config.js`, `netlify.toml` |
| Behavioral tests | `src/__tests__/`, `src/components/__tests__/`, `src/pages/__tests__/` |

## 19. Completion Definition

The reconstruction is complete when a clean checkout can be installed from its lockfile, its two database phases can be applied to an empty Supabase project in order, all automated checks pass, the production build succeeds, and every manual acceptance row matches at desktop and mobile widths. Security hardening is complete only if separately selected requirements from section 16 are implemented and tested; it is not implied by region filtering.
