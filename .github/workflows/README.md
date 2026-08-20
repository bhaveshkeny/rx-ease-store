CI / Pipeline Overview

This document describes the current DevOps pipeline and notes for local builds and troubleshooting.

Primary workflow
- File: `.github/workflows/ci.yml`
- Triggers: `push` and `pull_request` on `main` and `feature/bhaveshkeny-infra`, and manual `workflow_dispatch` with boolean `build_images` input.

Jobs (current)
- `frontend` — Builds the Vite/React frontend. CI uses `node-version: 22.12.0` and the install step runs `npm ci || npm install` to tolerate lockfile mismatches.
- `build-backend` — Builds the backend Docker image. This job runs on the `feature/bhaveshkeny-infra` branch or when `build_images=true` is passed to the workflow.
- `docker-images` — Builds and pushes both backend and frontend images when `build_images` is `true` (or omitted on non-PR runs). This job depends on `frontend` and `build-backend`.

Note: backend unit tests were removed from this workflow. If you want automated backend tests, add a dedicated workflow or reintroduce a `tests` job.

Image tags
- CI tags images as: `ghcr.io/${{ github.repository }}-backend:latest` and `ghcr.io/${{ github.repository }}-frontend:latest`. `github.repository` expands to `owner/repo` so final image names look like `ghcr.io/owner/repo-backend:latest`.

Node / runner notes
- GitHub-hosted runners now default to Node 24; Node 20 is deprecated. The workflow pins Node to `22.12.0` to satisfy package engine requirements. To temporarily allow Node 20 on runners, set `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true`.

GHCR / permissions
- If you see `denied: installation not allowed to Create organization package`, the token used by the runner does not have permission to create packages in the org. Options:
  - Ask org admins to enable Packages for the organization or allow Actions to publish packages.
  - Use a Personal Access Token (PAT) with `write:packages`/`read:packages`, store it in Actions secrets (e.g. `GHCR_PAT`), and switch `docker/login-action` to use that secret.
  - Push to a registry you control (Docker Hub, ECR, etc.).

Local build and test
- Frontend:
```bash
# from repo root
npm install
npm run build
```
- Backend (tests):
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pytest -q
```

Build images locally
```bash
# backend image
docker build -f infra/Dockerfile.backend -t rx-ease-store-backend:latest .
# frontend image
docker build -f infra/Dockerfile.frontend -t rx-ease-store-frontend:latest .
```

Docker Compose
```bash
docker compose -f infra/docker-compose.yml up --build
```

Lockfile guidance
- CI prefers `npm ci` for reproducible installs. If `npm ci` fails because `package.json` and `package-lock.json` are out of sync, regenerate the lockfile locally and commit it:
```bash
npm install
git add package-lock.json
git commit -m "chore: update package-lock for Node 22"
git push origin feature/bhaveshkeny-infra
```

Manual CI runs
- Trigger the workflow to build/push images manually:
```bash
gh workflow run ci.yml --ref feature/bhaveshkeny-infra -f build_images=true
```

Recommended next steps
- If you want automated backend tests, I can add a separate workflow `backend-tests.yml` that runs on push and PRs.
- If GHCR pushes fail, I can update the workflow to use a `GHCR_PAT` secret and update README with PAT setup instructions.
