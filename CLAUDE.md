# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A simple shift scheduling app for small teams built with React + Vite, Supabase (PostgreSQL), and deployed on Netlify. The app allows teams to manage shift assignments via a calendar interface, track history, and optionally integrate Google Calendar.

## Project Guidelines: TDD (t-wada style)

We follow strict TDD (Test-Driven Development) in the t-wada style.
You are the "Driver". You must follow these cycles strictly.

## # TDD Cycle Rules

1. **Red:** Write a failing test first. Do not implement the logic yet.
2. **Blue (Fake It):** Write the minimal code to pass the test. Hard-coding constants ("Fake It") is encouraged to get the test to pass before implementing the real logic.
3. **Green (Triangulation):** Adding a second test case with different data to force the generalization of the logic. Remove hard-coding only when a new test requires it.
4. **Refactor:** Clean up the code only after tests are green.

## Behavior

- **One by One:** Do not implement multiple features at once.
- **Baby Steps:** If a step feels too big, break it down.
- **Run Tests:** Always run tests (`pytest` or equivalent) before committing.
- **Update TODO List:** Immediately add any new ideas that come up during implementation to the list.
- **Commit:** Commit immediately once the test passes.
- **Commit Small:** Keep commits small (1 feature per commit).

## Commit Rules

- **After writing a test:** `test: add failing test for [feature]`
- **After passing a test:** `feat: implement [feature] to pass test`
- **After refactoring:** `refactor: [description]`
- **Commit Small:** Keep commits small (1 feature per commit).

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:5173
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
```

## Architecture

### Single-File React Application

The entire application lives in `src/App.jsx` as a single-file architecture with clearly labeled sections:

- **CONFIG** (line ~12): Runtime configuration for app name and Google Calendar URL
- **Icons** (line ~25): Inline SVG icon components
- **Navigation** (line ~75): Top nav bar with conditional Google Calendar tab
- **Modal** (line ~124): Reusable modal component
- **SchedulePage** (line ~156): Main calendar view with FullCalendar, shift assignment/cancellation
- **ContactsPage** (line ~402): Team member CRUD with color picker
- **HistoryPage** (line ~615): Audit log of shift changes
- **GoogleCalendarPage** (line ~697): Optional embedded Google Calendar iframe
- **App** (line ~736): React Router setup

### Data Layer

- `src/supabase.js` - Supabase client initialization using Vite env vars
- Real-time subscriptions used in SchedulePage for live shift updates
- Three tables: `members`, `shifts`, `history` (schema in README.md and supabase.js comments)

### Styling

- Tailwind CSS with custom FullCalendar theming in `src/index.css`
- CSS variables for FullCalendar colors (--fc-* prefix)
- Custom slate-850 color extended in tailwind.config.js

## Environment Variables

Required in `.env` (see `.env.example`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Key Dependencies

- `@fullcalendar/react` - Calendar UI with day grid and interaction plugins
- `@supabase/supabase-js` - Database and real-time subscriptions
- `date-fns` - Date formatting (format, parseISO)
- `react-router-dom` - Client-side routing (BrowserRouter)

## Netlify Deployment

`netlify.toml` configures:
- Build output: `dist/`
- SPA redirect: all routes → `index.html` (status 200)
