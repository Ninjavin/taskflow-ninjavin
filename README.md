# TaskFlow

## 1. Overview

This project is a frontend-only implementation of the TaskFlow.

- **Frontend:** React + TypeScript + Vite + React Router
- **State:** React Context + local component state
- **Mock API:** Mock Service Worker (`msw`) in-browser handlers
- **Containerization:** Docker + Docker Compose
- **UI choice:** shadcn/ui components with Tailwind CSS

Implemented user flows:

- Register and login with client-side validation
- Persistent auth state across refreshes
- Protected routes (`/projects`, `/projects/:projectId`)
- Project list and create project flow
- Project detail with task listing, status/assignee filters
- Task create/edit/delete via modal
- Optimistic task status updates with rollback on API error
- Loading, empty, and error states across all key pages

## 2. Architecture Decisions

- I kept everything frontend-only with in-browser API mocking so reviewers can run in one command.
- Auth state lives in `AuthContext` and is persisted in `localStorage` to satisfy refresh persistence + protected routes.
- API access is centralized in `src/lib/api.ts` so pages stay focused on UI and state transitions.
- I used MSW request handlers to emulate the assignment REST contract directly in the browser, which removes local API runtime issues for frontend-only review.

## 3. Running Locally

### Docker (recommended, zero manual steps)

```bash
git clone <your-repo-url>
cd taskflow
cp .env.example .env
docker compose up --build
```

App URL: [http://localhost:3000](http://localhost:3000)

API calls are mocked in-browser by MSW (no separate API process required).

### Local Node workflow (optional)

```bash
npm install
npm run dev:all
```

## 4. Running Migrations

Not applicable in this frontend-only implementation.

Data seeding is handled through `src/mocks/data.ts` and loaded by MSW automatically in the browser.

## 5. Test Credentials

```text
Email:    test@example.com
Password: password123
```

## 6. Future Enhancements

- Continue refining shadcn-based design system consistency across all screens.
- Add tests.
- Add dark mode with persisted preference.
- Add drag-and-drop between status columns.
- Add stricter mock auth/authorization behavior and richer API error simulation.
