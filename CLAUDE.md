# Sea Radar

Local educational web application: a map of the Strait of Dover and vessels on it. Runs on the instructor's laptop and is not exposed externally.
Customer brief: `docs/tasks/PROJECT_BRIEF.md`. Current sprint: `docs/tasks/SPRINT-01.md`. Read them from the repository rather than relying on a retelling.

## Stack

- Node.js 24, npm
- TypeScript 6.x, `strict` mode
- Next.js 16 (App Router) + React 19
- Leaflet 1.9.x — mapping library, loaded **only on the client**
- Map layer: OpenStreetMap Standard, attribution "© OpenStreetMap contributors"

Do not add other libraries without explicit approval.

## Commands

```
npm run dev      # development, http://localhost:3000
npm run build    # production build; catches Leaflet access to window
npm start        # run the built application
```

## This week's scope

Implement only the area map and demonstration vessels with a card.

Do not add:
- a button to load real data or a placeholder for one;
- calls to AISStream or any external data sources;
- server routes or APIs;
- tests or test runners;
- folders or empty modules "for the future."

## Secrets

The data-source access key must not appear in source code, screen output, or files delivered to the customer.
Never read `.env*` or display their contents. Do not print environment-variable values. If a secret is needed to work, say so rather than searching for it in files.

## Data

Zero and "no data" are different things. A speed of `0` means a stationary vessel and is displayed as `0 kn`; an unknown value is displayed as "No data."
A vessel's name comes from its crew and can contain anything. Display it as text, never as HTML.

