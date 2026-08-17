# Pickleball Training Session Manager

A responsive Vue.js application for organizing players, locations, training
sessions, courts, teams, and successive pickleball rotations.

> [!IMPORTANT]
> The application is under active development.
> Location and Player management and Session attendee selection are operational.
> The complete Rotation lifecycle, scoring, and automatic next-rotation
> algorithm are not implemented yet.

## Current Features

### Locations

- Display active Locations in a responsive card grid.
- Create and edit a Location from a modal form.
- Logically delete a Location after confirmation.
- Select a Location to reveal its available actions.
- Create a new training Session or continue an existing open Session.
- Prevent the number of courts from being changed while the Location has a
  started Session.
- Automatically select a newly created Location.

### Players

- Display Players in a responsive card grid.
- Create and edit Players from modal forms.
- Dynamically filter Players by name with a case-insensitive and
  accent-insensitive substring search.
- Logically delete Players and optionally display deleted Players with the
  **Show Deleted Players** switch.
- Restore deleted Players to the `AVAILABLE` status.
- Prevent deletion when a Player belongs to a started Session.
- Prevent duplicate Player names.

### Session Preparation

- Create Sessions with the `CREATED` status before they are started.
- Display all `AVAILABLE` Players as selectable cards.
- Persist the attendee selection while the Session is being prepared.
- Require at least four attending Players to start a Session.
- Make `attendingPlayers` immutable once the Session has started.
- Create the first Rotation only when **Start Session** is clicked.
- Build the first Rotation exclusively from the selected attending Players.
- Keep the Session header visible while scrolling through the responsive
  Player grid.
- Resume an unfinished Session setup after navigation or page reload.

### Sample Data

The Home page displays an **Initialize sample data** button until sample data
has been initialized for the current browser origin.

The initialization creates:

- Le Grand Saconnex — 4 courts
- Genève — 2 courts
- Lancy — 6 courts
- Carouge — 2 courts
- Bellevue — 8 courts
- 50 available Players

Initialization is non-destructive: existing entities are preserved and sample
names already present are not duplicated.

## Current Domain Lifecycle

### Location

```text
ACTIVE -> DELETED
```

### Player

```text
AVAILABLE -> PLAYING
AVAILABLE -> WAITING
PLAYING / WAITING -> AVAILABLE
AVAILABLE -> DELETED
DELETED -> AVAILABLE
```

`PLAYING` and `WAITING` will be calculated when a Rotation starts. All
participants return to `AVAILABLE` when the Rotation finishes.

### Session

```text
CREATED -> STARTED -> FINISHED
```

### Rotation

The target lifecycle is:

```text
CREATED -> IN_PROGRESS -> SCORING -> FINISHED
```

The enum and part of its domain protection already exist, but the complete
user-facing lifecycle is still in development.

## Persistence and Limitations

Application data is currently persisted in the browser's `localStorage`.

Consequences:

- Data belongs to your own browser.
- For now, data is not shared between users or devices.
- Production and preview deployment URLs have separate data.
- Clearing browser storage removes all application data.
- There is currently no authentication or shared backend.
- The existing `better-sqlite3` dependency is not yet used.

A persistent backend and database architecture remain part of the future roadmap.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Manage Locations and open or create Sessions |
| `/manage-players` | Manage the Player catalogue |
| `/manage/:locationId/:sessionId` | Prepare or manage an identified Session |
| `/manage` | Compatibility route resolving the current Session |

Invalid identified Session routes are redirected to Home.

## Technology Stack

- Vue 3
- Vite
- TypeScript for domain models and Vue components being modernized
- Pinia for application state
- Vue Router
- Browser `localStorage` for current persistence
- Vitest and Vue Test Utils for unit and component tests
- Cypress for end-to-end browser tests
- ESLint and `vue-tsc` for static validation
- Responsive CSS Grid and Flexbox layouts

## Requirements

Vite 8 requires one of the following Node.js versions:

- Node.js `20.19.0` or later in the Node 20 line
- Node.js `22.12.0` or later

Using a current Node.js 22 LTS release is recommended.

## Project Setup

Install the locked dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

The compatibility alias is also available:

```bash
npm run serve
```

## Validation Commands

Run the TypeScript/Vue type checker:

```bash
npm run type-check
```

Run ESLint:

```bash
npm run lint
```

Run the unit and component tests:

```bash
npm run test:unit
```

Run Vitest in watch mode:

```bash
npm run test:unit:watch
```

Run Cypress in headless mode:

```bash
npm run test:e2e
```

Open Cypress interactively:

```bash
npm run test:e2e:open
```

Run the complete validation chain and production build:

```bash
npm run build
```

The `prebuild` lifecycle automatically runs type-check, lint, Vitest, and
Cypress before Vite creates the production bundle.

To build only the static Vite bundle:

```bash
npm exec -- vite build
```

The generated files are written to `dist`.

## Current Test Baseline

The latest complete validation includes:

- 168 Vitest unit and component tests across 24 files
- 17 Cypress end-to-end scenarios
- Type checking with `vue-tsc`
- ESLint validation
- A successful Vite production build

## Cloudflare Pages Deployment

This repository can be deployed from GitHub using Cloudflare Pages with the
following settings:

| Setting | Value |
| --- | --- |
| Production branch | `master` |
| Framework preset | `Vue` |
| Root directory | Repository root |
| Build command | `npm exec -- vite build` |
| Build output directory | `dist` |

The direct Vite build command intentionally avoids running Cypress inside the
Cloudflare Pages build environment.

Cloudflare Pages automatically provides SPA route fallback, so direct
navigation and reloads on Vue Router routes work without an additional
`_redirects` file.

## Remaining Roadmap

### Session and Domain Structure

- Complete the `RotationStatus` transitions.
- Add Rotation start and end timestamps.
- Add Session-wide Game numbering.
- Finalize domain invariants and invalid-transition protection.
- Handle missing, inconsistent, or finished Sessions.
- Display the Location name and Session order.
- Extract `RotationCard`, `CourtCard`, `GameCard`, `TeamCard`, and
  `OffCourtPlayers`.
- Guarantee complete graph persistence and restoration.

### Rotation Preparation and Start

- Create new Rotations in `CREATED`.
- Initialize Courts, Games, Teams, and off-court Players.
- Finalize manual drag-and-drop assignments.
- Add a configurable Rotation timer.
- Implement **Start Rotation**.
- Switch assigned Players to `PLAYING` and off-court Players to `WAITING`.
- Lock all assignments while a Rotation is in progress.

### Scoring and Session Completion

- Enter `SCORING` when the timer finishes or **Match Results** is clicked.
- Validate and persist every match score.
- Determine winners and losers.
- Support manual tie resolution.
- Implement **Next Rotation** and **End Session**.
- Return all Players to `AVAILABLE` after a Rotation.
- Mark completed Rotations and Sessions as `FINISHED`.

### Next-Rotation Algorithm

- Move winners and losers between ordered courts.
- Avoid keeping former partners together when possible.
- Reintroduce waiting Players fairly.
- Handle incomplete teams and odd Player counts.
- Generate the next editable Rotation in `CREATED`.

### Tooling and Persistence

- Modernize the remaining development tooling.
- Introduce deterministic formatting and shared editor configuration.
- Add a Playwright mirror for every Cypress scenario.
- Compare Cypress and Playwright without removing either suite.
- Select and implement the persistent backend/database architecture.
- Replace browser-only persistence when a shared backend is introduced.

The detailed development plan and decision log are maintained in
[`PLAN.md`](PLAN.md).
