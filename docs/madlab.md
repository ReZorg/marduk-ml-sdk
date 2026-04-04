# Marduk's Lab — Architecture Overview

Marduk's Lab (Mad-Lab) is an ML-specialized autonomous DevOps platform that combines two independently viable systems:

1. **Application Generator** — an AI-powered full-stack code generation platform built on Cloudflare's infrastructure (Durable Objects, D1, R2, Workers for Platforms).
2. **Marduk Cognitive SDK** (`sdk/src/marduk/`) — a production-ready cognitive architecture providing genuine cognitive patterns: memory systems, task management, evolutionary optimization, neural-symbolic integration, and autonomous self-improvement.

---

## Cognitive Layer

The cognitive SDK lives in `sdk/src/marduk/` and is entirely self-contained. It can be used standalone or embedded in any TypeScript/Node.js environment.

### Subsystems

| Module | Path | Purpose |
|--------|------|---------|
| Memory | `sdk/src/marduk/memory/` | Declarative, episodic, procedural, and semantic memory stores |
| Tasks | `sdk/src/marduk/task/` | Priority queue scheduler with dependency resolution and retry |
| AI Coordination | `sdk/src/marduk/ai/` | Multi-provider LLM abstraction with rate limiting and caching |
| Autonomy | `sdk/src/marduk/autonomy/` | Metrics collection, health monitoring, optimization suggestions |
| MOSES | `sdk/src/marduk/moses/` | Meta-Optimizing Semantic Evolutionary Search (genetic algorithms) |
| Neural | `sdk/src/marduk/neural/` | Hypergraph cognitive network with attention (ECAN) and truth values |
| Archon | `sdk/src/marduk/archon/` | AI agent builder with templates, tool library, and refinement |

### Unified Entry Point

```ts
import { createMarduk } from 'sdk/src/marduk';

const marduk = createMarduk({
  neuralDimensions: 128,
  autonomyEnabled: true,
  archonEnabled: true,
  mosesConfig: {
    populationSize: 50,
    generations: 20,
    mutationRate: 0.05,
    crossoverRate: 0.7,
    eliteRatio: 0.1,
    tournamentSize: 5,
    objectives: [{ name: 'performance', value: 0, weight: 1, direction: 'maximize' }],
    terminationCriteria: { maxGenerations: 20, fitnessThreshold: 0.9 },
  },
});
```

---

## Worker Integration

The cognitive SDK is wired into the Cloudflare Worker backend via `worker/services/marduk/MardukService.ts`.

### Episodic Memory

Every conversation turn is persisted as an episodic memory entry in `MARDUK_KV` (Cloudflare KV):

```
Key: marduk:episodic:v1
Value: JSON array of MardukEpisodicEntry[]
```

This enables associative recall across sessions — the agent can surface relevant past conversations when a user returns to a project.

Relevant code: `worker/agents/operations/UserConversationProcessor.ts` → `storeConversationEpisode()`

### Autonomy Heartbeat

Wrangler cron triggers (defined in `wrangler.jsonc`) call the scheduled handler in `worker/index.ts` every 5 minutes. This runs `runAutonomyHeartbeat()` which:

1. Instantiates a fresh Marduk instance from environment config
2. Calls `marduk.autonomy.collectMetrics()`
3. Calls `marduk.analyze()` to get optimization suggestions
4. Calls `marduk.getHealth()` for health status
5. Persists the report to `MARDUK_KV` under key `marduk:autonomy:analysis:v1`

### Archon Agent Building

The conversational agent exposes a `marduk_archon_build` tool (registered in `worker/agents/tools/customTools.ts`) that allows the LLM to create ML-specialized sub-agents on demand via the Archon system.

Example usage in chat:
> "Create a PyTorch training agent for image classification tasks"

The tool builds an `AgentBlueprint`, calls `buildArchonMLAgent()`, and persists the result to KV for reuse.

---

## ML Specialization

### ML System Prompt

When a project is of type `cognitive` (or when `isMLQuery()` detects ML intent), the `ML_SYSTEM_PROMPT_EXTENSION` from `worker/agents/prompts.ts` is appended to the system prompt. This guides the LLM to:

- Generate Python ML code (PyTorch, scikit-learn, HuggingFace, Gymnasium)
- Follow proper project structure (data / models / training / evaluation / serving)
- Apply MLOps best practices (MLflow/W&B logging, DVC versioning, checkpointing)
- Use FastAPI for model serving with proper lifespan management
- Document tensor shapes, seed everything for reproducibility

### ML Project Templates

Five canonical ML project templates are defined in `ML_TEMPLATE_REGISTRY` in `worker/agents/prompts.ts`:

| Template ID | Description |
|-------------|-------------|
| `ml-training-pipeline` | PyTorch training + MLflow tracking |
| `ml-fastapi-serving` | FastAPI model serving with ONNX support |
| `ml-data-pipeline` | Polars/Pandas data processing with DVC |
| `ml-rl-environment` | Gymnasium RL environment + Stable-Baselines3 |
| `ml-fine-tuning` | HuggingFace PEFT/LoRA fine-tuning |

### Cognitive Feature Type

The `cognitive` project type is registered in:
- `worker/agents/core/types.ts` — added to `ProjectType` union
- `worker/agents/core/features/types.ts` — `DEFAULT_FEATURE_DEFINITIONS.cognitive`
- `worker/api/controllers/capabilities/controller.ts` — exposed in capabilities API
- `src/features/cognitive/` — frontend feature module with preview and header actions
- `src/features/index.ts` — lazy-loaded registration

---

## ML DevOps CI/CD

Four GitHub Actions workflows in `.github/workflows/` enable autonomous ML DevOps:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ml-train.yml` | Push to `ml/**` or manual | Run training in a PyTorch container, upload model artifact |
| `ml-evaluate.yml` | After training or on ML PR | Evaluate model, compare to baseline, post PR comment |
| `ml-deploy.yml` | Merge to main or manual | Export to ONNX, upload to Cloudflare AI or MLflow registry |
| `ml-evolve.yml` | Weekly cron (Monday 02:00 UTC) | Run MOSES evolutionary hyperparameter search, open PR |

### MOSES Workflow

The `ml-evolve.yml` workflow uses the Marduk SDK's `MOSESEngine` directly (via `sdk/dist/index.js`) to run multi-objective evolutionary search over the ML hyperparameter space:

- Genome: `learning_rate`, `batch_size`, `hidden_dim`, `dropout`, `weight_decay`
- Objectives: `accuracy` (maximize), `efficiency` (maximize)
- Output: `config/evolved_hyperparams.json` — committed in a new PR for human review

---

## Environment Configuration

Relevant variables in `wrangler.jsonc`:

| Variable | Purpose |
|----------|---------|
| `MARDUK_MEMORY_CAPACITY` | Max episodic memory entries per session (default: 1000) |
| `MARDUK_EVOLUTION_MUTATION_RATE` | MOSES mutation rate (default: 0.05) |
| `MARDUK_EVOLUTION_FITNESS_THRESHOLD` | MOSES termination threshold (default: 0.7) |
| `MARDUK_ATTENTION_TOTAL_RESOURCES` | ECAN attention budget (default: 100) |
| `MARDUK_ENABLE_AUTONOMY` | Enable autonomy heartbeat (default: true) |
| `MARDUK_KV` | KV namespace binding for cognitive state |
| `MardukStore` | KV namespace binding for agent config/cache |

---

## Development

```bash
# Install dependencies
npm install

# Start development servers (frontend + worker)
npm run dev

# Run all tests
npm run test

# Type check
npm run typecheck

# Run SDK tests only
cd sdk && bun test test/*.test.ts
```

See [docs/setup.md](setup.md) for full local setup instructions.
