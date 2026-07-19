# PROJECT_BRIEF.md — Marduk's Lab (Mad-Lab)

Single source of truth for all AI team chats. Read this first in every session.

## 1. Project Overview

ML-specialized autonomous DevOps platform on Cloudflare infrastructure. Combines an
AI-powered full-stack application generator with the Marduk Cognitive SDK (memory
systems, MOSES evolutionary optimization, neural-symbolic integration, autonomous
self-improvement).

## 2. Concept / Product Description

- Users chat with an agent that generates, debugs, and deploys full-stack apps.
- Each chat session is a Durable Object (SimpleCodeGeneratorAgent) with its own
  git history stored in SQLite.
- The Marduk SDK (`sdk/src/marduk/`) provides cognitive services: memory, task
  orchestration, MOSES, Archon, neural components.

## 3. Tech Stack

- Frontend: React 19, TypeScript, Vite, TailwindCSS, React Router v7
- Backend: Cloudflare Workers, Durable Objects, D1 (SQLite), Drizzle ORM
- AI/LLM: OpenAI, Anthropic, Google AI Studio (Gemini), OpenRouter, Groq
- Realtime: PartySocket (WebSocket)
- Git: isomorphic-git with SQLite filesystem adapter
- Sandbox: custom container service with CLI tools

## 4. Architecture

```
Browser (React 19 SPA)
   |  HTTPS / WebSocket (PartySocket)
   v
Cloudflare Worker (worker/index.ts)
   +-- API routes/controllers (worker/api/)
   +-- D1 database via Drizzle (worker/database/)
   +-- Durable Object per chat: SimpleCodeGeneratorAgent
   |     State machine: IDLE -> PHASE_GENERATING -> PHASE_IMPLEMENTING -> REVIEWING -> IDLE
   |     +-- Git history in DO SQLite (isomorphic-git)
   |     +-- LLM tools (worker/agents/tools/toolkit/)
   |     +-- Deep debugger (worker/agents/assistants/codeDebugger.ts)
   +-- User Secrets Store DO (worker/services/secrets/)
   +-- Sandbox container service (worker/services/sandbox/)
```

Full diagrams: `docs/architecture-diagrams.md`.

## 5. Key Files Map

| Area | Path |
|------|------|
| Frontend types (source of truth) | `src/api-types.ts` |
| Frontend API calls | `src/lib/api-client.ts` |
| Worker entry | `worker/index.ts` |
| Agent core (Durable Object) | `worker/agents/core/` |
| Agent operations | `worker/agents/operations/` |
| LLM tools | `worker/agents/tools/toolkit/` + `customTools.ts` |
| LLM model config | `worker/agents/inferutils/config.ts` |
| Git system | `worker/agents/git/` |
| DB services | `worker/database/services/` |
| API controllers/routes | `worker/api/controllers/`, `worker/api/routes/` |
| Secrets store | `worker/services/secrets/` |
| Shared types | `shared/types/` |
| Migrations | `migrations/` |
| Cognitive SDK | `sdk/src/marduk/` |

## 6. Team Roles

| Agent | Name | Role | Focus |
|-------|------|------|-------|
| Producer | Remy | Sprint planning, merging PRs, issue triage | NEVER writes code |
| Product Designer | Kira | UX, agent conversation flows | User flows, feature design |
| Visual/Art Director | Milo | TailwindCSS, animations | Design system, accessibility |
| Frontend Engineer | Nova | React 19, hooks, WebSocket client | `src/` |
| Backend Engineer | Sage | Workers, DOs, D1, agents, security | `worker/` |
| DevOps Engineer | Dash | CI/CD, wrangler deploys | GitHub Actions, environments |
| QA Engineer | Ivy | Vitest, E2E, playtesting | `test/`, bug filing, sign-off |

## 7. Sprint Status

| Sprint | Branch | Status | Notes |
|--------|--------|--------|-------|
| 0 (bootstrap) | `danregima-ai-team-orchestration-bootstrap` | In progress | Orchestration docs created |

## 8. Current State

- Full platform in repo (frontend, worker, SDK, container, templates, migrations).
- Architecture documented in `docs/architecture-diagrams.md`.
- Orchestration bootstrapped: this brief + `docs/sprint-0/`.
- Sprint 1 scope to be set by Remy after team brainstorm.

## 9. Security Rules

- Never commit secrets. `.dev.vars` locally (gitignored); `wrangler secret put` in CI.
- User API keys only via User Secrets Store DO (XChaCha20-Poly1305, MEK->UMK->DEK).
- RPC methods return `null`/`boolean` on error — never throw.
- No `any` types; strict type safety.
- Branch protection on `main`: PR required; build + test + lint checks must pass.

## 10. How to Run Locally

```bash
npm install
npm run dev          # frontend (Vite)
npm run dev:worker   # backend (Wrangler)
npm run test         # Vitest
npm run typecheck && npm run lint
```

## 11. How to Deploy

```bash
npm run build && npx wrangler deploy
npx wrangler d1 migrations apply <DB>
```

CI gate: `npm ci && npm run typecheck && npm run lint && npm run test && npm run build`

Rollback: `npx wrangler rollback` OR `git revert HEAD && git push`

## 12. Cross-Chat Handoff Protocol

The human (CEO) is the message bus between parallel chats.

1. Every chat starts: "Read PROJECT_BRIEF.md, then docs/sprint-N/plan.md."
2. Before closing a long chat (>100 messages): update `docs/sprint-N/progress.md`,
   update Sections 7-8 here, write `docs/sprint-N/done.md`.
3. Cold start: "Read PROJECT_BRIEF.md and docs/sprint-N/progress.md. Continue."
4. Handoffs between teams go through Remy via the human.

## 13. Bug & Fix Tracking

- GitHub Issues are the single source of truth for bugs.
- One commit per fix: `fix: description (Fixes #NN)`.
- Ivy files issues; Remy triages; engineers fix on sprint branches.
- QA sign-off: `docs/qa/sprint-N-signoff.md` after each merge to main.

## 14. Multi-Repo Setup

```bash
git clone <repo> madlab-dev     # Dev team (Nova, Sage, Milo)
git clone <repo> madlab-qa      # QA (Ivy)
git clone <repo> madlab-devops  # DevOps (Dash, on demand)
```

- Branches: `feature/sprint-N` (dev), `feature/qa-N` (QA), `feature/devops-N` (DevOps).
- Merge, never rebase feature branches.
- Remy merges PRs to `main` after checks pass and QA sign-off.
