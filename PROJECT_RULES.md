# PROJECT RULES

## React + FastAPI Monorepo

This repository contains a React frontend and a Python FastAPI backend.

These rules define the required project architecture and development practices.

All developers, AI coding tools, Lovable, GitHub Copilot, and other coding assistants should follow these rules.

---

# 1. PROJECT STRUCTURE

The repository must maintain this structure:

```text
/
├── frontend/                  # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.*
│   ├── tsconfig*.json
│   └── ...
│
├── backend/                   # FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   ├── alembic/               # If used
│   └── ...
│
├── .github/
│   └── copilot-instructions.md
│
├── PROJECT_RULES.md
├── README.md
└── .gitignore
```

## CRITICAL RULE

The frontend application MUST remain inside:

```text
/frontend
```

The backend application MUST remain inside:

```text
/backend
```

Do not change this architecture unless explicitly requested by the user.

## SUPABASE IS NOT USED

This project uses the FastAPI backend for its API, authentication, and database integration.

Do NOT create:

```text
/supabase
/src/integrations/supabase
```

Do not add Supabase clients, middleware, configuration, migrations, or environment variables. Reuse the existing frontend API client and FastAPI backend instead.

---

# 2. FRONTEND RULES

The frontend is a React application.

All frontend code MUST be inside:

```text
/frontend
```

Examples:

```text
/frontend/src
/frontend/public
/frontend/package.json
/frontend/vite.config.ts
/frontend/tsconfig.json
```

## NEVER create frontend files at repository root

Do NOT create:

```text
/src
/public
/package.json
/vite.config.ts
/vite.config.js
/index.html
/tsconfig.json
```

for the React application at the repository root.

If a frontend file needs to be created, determine the correct location inside `/frontend` first.

---

# 3. BACKEND RULES

The backend is a Python FastAPI application.

All backend code MUST remain inside:

```text
/backend
```

Examples:

```text
/backend/app
/backend/requirements.txt
/backend/alembic
```

Do not create another FastAPI application.

Do not move the backend to the repository root.

Do not create backend files inside `/frontend`.

---

# 4. EXISTING ARCHITECTURE MUST BE PRESERVED

Before modifying code:

1. Inspect the existing project structure.
2. Inspect related existing files.
3. Understand the existing implementation.
4. Reuse existing components, services, utilities, hooks, schemas, and API functions.
5. Make the smallest change required.

Do not replace existing architecture simply because another implementation appears easier.

Do not rewrite unrelated code.

---

# 5. FRONTEND COMPONENT RULES

Before creating a new React component:

1. Search `/frontend/src`.
2. Check whether a similar component already exists.
3. Reuse an existing component when possible.
4. Follow the existing component structure.
5. Follow the existing styling approach.

Do not create duplicate components unnecessarily.

For example, if the project already has:

```text
/frontend/src/components/Button.tsx
```

do not create another generic button component unless there is a genuine requirement.

---

# 6. ROUTING RULES

Before adding a route:

1. Inspect the existing routing implementation.
2. Follow the existing routing pattern.
3. Add the route in the existing route configuration.
4. Do not create a second routing system.

Do not modify unrelated routes.

---

# 7. STATE MANAGEMENT

Before introducing state management:

1. Check how the existing project manages state.
2. Reuse the existing approach.
3. Do not introduce Redux, Zustand, Context, or another state library unless required.

Do not replace the existing state-management architecture unnecessarily.

---

# 8. API RULES

The React frontend communicates with the FastAPI backend.

Before creating an API call:

1. Search for existing API/service utilities.
2. Reuse the existing API client.
3. Follow the existing request/response pattern.
4. Use the existing environment configuration.
5. Do not hardcode production URLs.

Do not create multiple API clients for the same backend unless there is a clear architectural reason.

---

# 9. BACKEND API RULES

When modifying FastAPI:

1. Inspect existing routers.
2. Inspect existing schemas.
3. Inspect existing models.
4. Inspect existing services.
5. Reuse existing database utilities.
6. Follow the existing project structure.

Do not create duplicate routers, services, models, or database configurations.

---

# 10. DATABASE RULES

The backend may use PostgreSQL or another configured database.

Do not change the database architecture unless explicitly requested.

Never:

- Delete existing tables
- Delete migrations
- Reset the database
- Change production database configuration
- Hardcode database credentials

unless explicitly instructed.

---

# 11. ENVIRONMENT VARIABLES

Never hardcode:

- Database passwords
- API keys
- Secret keys
- JWT secrets
- Access tokens
- Private credentials

Use environment variables.

Examples:

```text
DATABASE_URL
SECRET_KEY
CORS_ORIGINS
API_BASE_URL
```

Do not commit real `.env` files containing secrets.

If a new environment variable is required:

1. Add it to the appropriate example/configuration documentation.
2. Explain what it is used for.
3. Do not expose its secret value.

---

# 12. CORS

CORS configuration belongs to the FastAPI backend.

Do not add random CORS configurations to the React application.

Use environment-based configuration where the existing backend architecture supports it.

Do not hardcode production origins unnecessarily.

---

# 13. DEPENDENCY RULES

Before installing a dependency:

1. Check whether the project already has an equivalent dependency.
2. Prefer existing dependencies.
3. Install a new dependency only when necessary.
4. Do not upgrade unrelated packages.

Do not replace the project's package manager.

Do not perform large dependency upgrades unless explicitly requested.

---

# 14. STYLING RULES

Use the styling system already present in the project.

For example, if the project already uses:

```text
Tailwind CSS
```

continue using Tailwind.

Do not introduce Material UI, Bootstrap, Chakra, another CSS framework, or another UI library unless explicitly requested.

Maintain:

- Existing design system
- Existing spacing
- Existing typography
- Existing responsive behavior
- Existing reusable UI components

---

# 15. RESPONSIVE DESIGN

Frontend changes should maintain responsive behavior.

When modifying UI:

- Check desktop layout.
- Check tablet layout.
- Check mobile layout.
- Do not unnecessarily break existing responsive behavior.

---

# 16. FILE CREATION RULE

Before creating a file, determine which application owns the file.

### React

```text
/frontend/...
```

### FastAPI

```text
/backend/...
```

### Shared repository documentation

```text
/
```

### GitHub/Copilot configuration

```text
/.github/...
```

Never place application files at the repository root simply because it is convenient.

---

# 17. NO DUPLICATE APPLICATIONS

Never create:

```text
/src
/frontend/src
```

as two separate React applications.

Never create:

```text
/backend
/api
```

as two separate FastAPI applications unless explicitly requested.

There must be one frontend and one backend.

---

# 18. LOVABLE RULES

Lovable must preserve the existing monorepo architecture.

Before making changes, Lovable should inspect:

```text
/frontend
/backend
```

If the user asks for a frontend change:

- Modify `/frontend`.
- Do not create frontend files at root.
- Do not create another React application.
- Do not modify `/backend` unless required.

If the user asks for a backend change:

- Modify `/backend`.
- Do not create another backend.

Lovable must not assume that the project was generated entirely by Lovable.

The repository may contain local changes created by the developer.

Those changes must be preserved.

---

# 19. GITHUB RULES

GitHub is the shared source of truth for the project.

Development should normally happen on feature branches.

Recommended structure:

```text
main
│
├── feature/product-page
├── feature/order-management
├── feature/authentication
└── feature/api-integration
```

Do not use `main` for experimental development when a feature branch is appropriate.

---

# 20. FEATURE BRANCH RULES

Use descriptive branch names.

Examples:

```text
feature/product-page
feature/user-crud
feature/order-api
fix/login-error
fix/cors-error
refactor/api-client
```

Avoid:

```text
test
abc
new
changes
final
final2
latest
```

---

# 21. GIT SAFETY

Never perform destructive Git operations without explicit user approval.

Do not use:

```bash
git reset --hard
git clean -fd
git push --force
git push --force-with-lease
```

unless explicitly requested.

Never discard user changes.

Never overwrite uncommitted work.

Before significant changes, inspect the Git status.

---

# 22. SYNCING WITH GITHUB

Before starting work:

```bash
git status
git pull origin main
```

If working on a feature branch, synchronize appropriately with the current project workflow.

Before switching between Lovable and local development:

1. Ensure local changes are committed.
2. Push changes to GitHub.
3. Allow the latest changes to reach the intended branch.
4. Pull the latest GitHub changes before continuing locally.

Never assume the local repository contains the latest Lovable changes.

---

# 23. LOVABLE + LOCAL DEVELOPMENT

The project may be modified from two environments:

```text
Lovable
   ↓
GitHub

VS Code + GitHub Copilot
   ↓
GitHub
```

Both environments must preserve the same repository structure.

Before local development:

```text
GitHub → Pull → Local
```

Before handing work back to Lovable:

```text
Local → Commit → Push → GitHub
```

Before continuing local work after Lovable changes:

```text
Lovable → GitHub → Pull → Local
```

---

# 24. CONFLICT PREVENTION

Avoid modifying the same files simultaneously in Lovable and VS Code.

If Lovable has modified the project:

1. Pull the latest changes.
2. Inspect the changes.
3. Resolve conflicts if necessary.
4. Continue local development only after synchronization.

Never blindly overwrite changes.

---

# 25. CHANGE SCOPE

When the user requests:

> "Change the product card"

Only modify the code necessary for the product card.

Do not:

- Rewrite routing
- Replace state management
- Upgrade dependencies
- Change backend architecture
- Rename unrelated files
- Reformat the entire project

unless required.

---

# 26. DO NOT OVER-ENGINEER

Prefer simple solutions that fit the existing architecture.

Do not introduce abstractions unnecessarily.

Do not create:

- Extra layers
- Extra services
- Extra hooks
- Extra components
- Extra libraries

unless they provide a clear benefit.

---

# 27. VALIDATION

After changes, verify as appropriate:

### Frontend

- Imports
- TypeScript errors
- React errors
- Routing
- API integration
- Loading/shimmer states for any new async data fetch
- Responsive behavior
- Build

### Backend

- Python imports
- FastAPI routes
- Pydantic schemas
- Database integration
- Authentication
- CORS
- API responses

Do not claim that something was tested if it was not actually tested.

---

# 28. DOCUMENTATION

When introducing an important architectural change:

Update:

```text
PROJECT_RULES.md
README.md
```

when appropriate.

Keep documentation concise and accurate.

---

# 29. BEFORE COMPLETING A TASK

Check:

```text
[ ] Correct folder was modified
[ ] Existing architecture was preserved
[ ] No duplicate application was created
[ ] No unrelated files were changed
[ ] No secrets were added
[ ] Existing functionality was preserved
[ ] Dependencies were not unnecessarily changed
[ ] Frontend remains inside /frontend
[ ] Backend remains inside /backend
[ ] Shimmer/skeleton loading state added for any new data-fetching UI
```

---

# 30. FINAL ARCHITECTURE RULE

The following architecture is mandatory unless explicitly changed by the user:

```text
Repository
│
├── frontend/                  ← React application
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/                   ← FastAPI application
│   ├── app/
│   └── requirements.txt
│
├── .github/
│   └── copilot-instructions.md
│
├── PROJECT_RULES.md
├── README.md
└── .gitignore
```

The frontend must remain inside `/frontend`.

The backend must remain inside `/backend`.

Preserve this architecture at all times.

---

# 31. LOADING STATE (SHIMMER) RULES

Every page or component that fetches data asynchronously — via `useQuery`, a route `loader`, or any direct API call — MUST render a shimmer/skeleton placeholder while that data is loading. A plain "Loading..." text block or a bare spinner covering page content is not acceptable for new work.

## Required pattern

Shared skeleton primitives live in:

```text
/frontend/src/components/skeletons.tsx
```

Before building a loading state:

1. Check `skeletons.tsx` for an existing skeleton that fits (e.g. `MedicineCardSkeleton`, `StatCardSkeleton`, `CategoryFilterSkeleton`, `OrderCardSkeleton`, `TableRowSkeleton`).
2. Reuse it if it matches, or matches closely enough with props (e.g. `count`).
3. If nothing fits, add a new skeleton component to `skeletons.tsx` — do not define one-off skeletons inline inside a route file.
4. Build new skeletons using the existing `Skeleton` primitive from `/frontend/src/components/ui/skeleton.tsx`, not raw `div`s with hand-rolled `animate-pulse` classes.

## Shape rules

- The skeleton must mirror the real content's layout: same spacing, same element sizes, same grid/flex structure, so there is no layout shift when data arrives.
- Skeleton only the section that actually depends on the fetch. Static content (headers, nav, hero sections, forms not tied to the fetch) must render immediately — do not gate the whole page behind one `isLoading` check if only part of it needs data.
- Spinners (`Loader2`, `animate-spin`) are reserved for inline/button action states (e.g. a submit button mid-request), not for page or section loading states.

## New features

Any new feature that introduces a data fetch — whether built by a developer, Lovable, GitHub Copilot, or another AI coding tool — must ship its shimmer/skeleton state as part of the initial implementation, not as a follow-up task. This applies equally to new pages, new sections on existing pages, and new components that fetch their own data.