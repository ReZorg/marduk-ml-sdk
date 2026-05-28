export type MLTemplateLifecycle = {
training?: string[];
evaluation?: string[];
serving?: string[];
};

export type MLTemplateDescriptor = {
id: string;
name: string;
description: string;
tags: string[];
entryPoint: string;
family:
	| 'training'
	| 'serving'
	| 'data'
	| 'reinforcement-learning'
	| 'fine-tuning'
	| 'rag'
	| 'automl'
	| 'evaluation';
files: Record<string, string>;
dependencies: string[];
commands: Record<string, string>;
preview: {
type: 'notebook' | 'api' | 'dashboard' | 'static-report';
entry: string;
};
lifecycle: MLTemplateLifecycle;
exportTargets: Array<'github' | 'r2-artifact' | 'container' | 'onnx' | 'huggingface'>;
};

export const ML_TEMPLATE_REGISTRY = [
{
id: 'ml-training-pipeline',
name: 'PyTorch Training Pipeline',
description: 'End-to-end PyTorch training pipeline with validation, checkpointing, and metrics capture.',
tags: ['pytorch', 'training', 'deep-learning', 'checkpoints'],
entryPoint: 'scripts/train.py',
family: 'training',
files: {
'README.md': 'Project overview, dataset contract, training commands, and expected metrics.',
'requirements.txt': 'torch\ntorchvision\nscikit-learn\npandas\n',
'scripts/train.py': 'Training entrypoint with argument parsing, metric logging, and checkpoint output.',
'scripts/evaluate.py': 'Evaluation entrypoint that loads checkpoints and emits metrics.json.',
'configs/train.yaml': 'Default hyperparameters and dataset paths.',
},
dependencies: ['torch', 'torchvision', 'scikit-learn', 'pandas'],
commands: {
install: 'pip install -r requirements.txt',
train: 'python scripts/train.py --config configs/train.yaml',
evaluate: 'python scripts/evaluate.py --checkpoint artifacts/checkpoint.pt',
},
preview: { type: 'dashboard', entry: 'reports/index.html' },
lifecycle: {
training: ['prepare dataset', 'train model', 'write checkpoint', 'emit metrics'],
evaluation: ['load checkpoint', 'run validation split', 'write evaluation report'],
},
exportTargets: ['github', 'r2-artifact', 'container', 'onnx'],
},
{
id: 'ml-fastapi-serving',
name: 'FastAPI Model Serving',
description: 'Model-serving API with health checks, typed inference payloads, and container deployment metadata.',
tags: ['fastapi', 'serving', 'inference', 'docker', 'onnx'],
entryPoint: 'app/main.py',
family: 'serving',
files: {
'README.md': 'Serving contract, local commands, and deployment notes.',
'requirements.txt': 'fastapi\nuvicorn\npydantic\nonnxruntime\n',
'app/main.py': 'FastAPI app exposing /health and /predict.',
'app/model.py': 'Model loading and inference adapter.',
'Dockerfile': 'Container image for model serving previews.',
},
dependencies: ['fastapi', 'uvicorn', 'pydantic', 'onnxruntime'],
commands: {
install: 'pip install -r requirements.txt',
serve: 'uvicorn app.main:app --host 0.0.0.0 --port 8000',
test: 'python -m pytest tests',
},
preview: { type: 'api', entry: '/docs' },
lifecycle: { serving: ['load model artifact', 'start API server', 'probe health endpoint'] },
exportTargets: ['github', 'container', 'r2-artifact'],
},
{
id: 'ml-data-pipeline',
name: 'Data Pipeline',
description: 'Data ingestion, validation, transformation, and versioned artifact production.',
tags: ['pandas', 'polars', 'validation', 'data-engineering'],
entryPoint: 'scripts/pipeline.py',
family: 'data',
files: {
'README.md': 'Pipeline stages, input contracts, and output locations.',
'requirements.txt': 'pandas\npolars\npyarrow\npydantic\n',
'scripts/pipeline.py': 'Extract-transform-load pipeline entrypoint.',
'configs/pipeline.yaml': 'Input sources, transformations, and validation rules.',
},
dependencies: ['pandas', 'polars', 'pyarrow', 'pydantic'],
commands: {
install: 'pip install -r requirements.txt',
run: 'python scripts/pipeline.py --config configs/pipeline.yaml',
validate: 'python scripts/pipeline.py --config configs/pipeline.yaml --validate-only',
},
preview: { type: 'static-report', entry: 'reports/data-profile.html' },
lifecycle: { evaluation: ['profile raw data', 'validate schema', 'write transformed dataset'] },
exportTargets: ['github', 'r2-artifact'],
},
{
id: 'ml-rl-environment',
name: 'RL Environment',
description: 'Gymnasium-compatible reinforcement-learning environment with training and rollout evaluation.',
tags: ['gymnasium', 'rl', 'stable-baselines3', 'reinforcement-learning'],
entryPoint: 'scripts/train_rl.py',
family: 'reinforcement-learning',
files: {
'README.md': 'Environment API, reward function, training, and evaluation workflow.',
'requirements.txt': 'gymnasium\nstable-baselines3\nnumpy\n',
'envs/custom_env.py': 'Gymnasium environment implementation.',
'scripts/train_rl.py': 'Policy training entrypoint.',
'scripts/evaluate_rl.py': 'Rollout evaluation entrypoint.',
},
dependencies: ['gymnasium', 'stable-baselines3', 'numpy'],
commands: {
install: 'pip install -r requirements.txt',
train: 'python scripts/train_rl.py',
evaluate: 'python scripts/evaluate_rl.py --model artifacts/policy.zip',
},
preview: { type: 'dashboard', entry: 'reports/rollouts.html' },
lifecycle: { training: ['create environment', 'train policy', 'save policy'], evaluation: ['run rollouts', 'summarize rewards'] },
exportTargets: ['github', 'r2-artifact', 'container'],
},
{
id: 'ml-fine-tuning',
name: 'HuggingFace Fine-Tuning',
description: 'Parameter-efficient fine-tuning with dataset preparation, evaluation, and model-card generation.',
tags: ['huggingface', 'peft', 'lora', 'fine-tuning', 'transformers'],
entryPoint: 'scripts/finetune.py',
family: 'fine-tuning',
files: {
'README.md': 'Fine-tuning workflow, dataset format, and publishing checklist.',
'requirements.txt': 'transformers\ndatasets\npeft\naccelerate\n',
'scripts/finetune.py': 'Fine-tuning entrypoint.',
'scripts/evaluate.py': 'Task-specific evaluation entrypoint.',
'MODEL_CARD.md': 'Generated model-card template.',
},
dependencies: ['transformers', 'datasets', 'peft', 'accelerate'],
commands: {
install: 'pip install -r requirements.txt',
train: 'python scripts/finetune.py',
evaluate: 'python scripts/evaluate.py',
},
preview: { type: 'static-report', entry: 'MODEL_CARD.md' },
lifecycle: { training: ['load base model', 'fine-tune adapter', 'save adapter'], evaluation: ['score validation set', 'write model card'] },
exportTargets: ['github', 'r2-artifact', 'huggingface'],
},
{
id: 'ml-rag-embedding-pipeline',
name: 'RAG / Embedding Pipeline',
description: 'Document ingestion, chunking, embedding, retrieval evaluation, and query preview.',
tags: ['rag', 'embeddings', 'retrieval', 'vector-search'],
entryPoint: 'scripts/build_index.py',
family: 'rag',
files: {
'README.md': 'RAG architecture, corpus format, indexing, and evaluation workflow.',
'requirements.txt': 'sentence-transformers\nfaiss-cpu\npandas\n',
'scripts/build_index.py': 'Embedding and index build entrypoint.',
'scripts/evaluate_retrieval.py': 'Retrieval quality benchmark.',
'app/query.py': 'Local query preview adapter.',
},
dependencies: ['sentence-transformers', 'faiss-cpu', 'pandas'],
commands: {
install: 'pip install -r requirements.txt',
index: 'python scripts/build_index.py',
evaluate: 'python scripts/evaluate_retrieval.py',
},
preview: { type: 'dashboard', entry: 'reports/retrieval.html' },
lifecycle: { training: ['ingest documents', 'create embeddings', 'persist index'], evaluation: ['run retrieval benchmark'] },
exportTargets: ['github', 'r2-artifact', 'container'],
},
{
id: 'ml-automl-experiment',
name: 'AutoML Experiment',
description: 'Search-space definition, trial orchestration, fitness tracking, and best-run promotion.',
tags: ['automl', 'optimization', 'moses', 'hyperparameter-search'],
entryPoint: 'scripts/search.py',
family: 'automl',
files: {
'README.md': 'Search space, objectives, trial lifecycle, and promotion workflow.',
'requirements.txt': 'optuna\nscikit-learn\npandas\n',
'scripts/search.py': 'AutoML search entrypoint.',
'configs/search.yaml': 'Search space and optimization objective.',
},
dependencies: ['optuna', 'scikit-learn', 'pandas'],
commands: {
install: 'pip install -r requirements.txt',
search: 'python scripts/search.py --config configs/search.yaml',
promote: 'python scripts/search.py --promote-best',
},
preview: { type: 'dashboard', entry: 'reports/study.html' },
lifecycle: { training: ['sample trial', 'train candidate', 'record fitness'], evaluation: ['compare trials', 'promote best run'] },
exportTargets: ['github', 'r2-artifact'],
},
{
id: 'ml-evaluation-benchmark',
name: 'Evaluation Benchmark Suite',
description: 'Reusable benchmark harness with metric cards, comparison reports, and regression checks.',
tags: ['evaluation', 'benchmark', 'metrics', 'regression-testing'],
entryPoint: 'scripts/benchmark.py',
family: 'evaluation',
files: {
'README.md': 'Benchmark inputs, metrics, thresholds, and report outputs.',
'requirements.txt': 'scikit-learn\npandas\nmatplotlib\n',
'scripts/benchmark.py': 'Benchmark suite entrypoint.',
'configs/benchmark.yaml': 'Datasets, models, and metric thresholds.',
},
dependencies: ['scikit-learn', 'pandas', 'matplotlib'],
commands: {
install: 'pip install -r requirements.txt',
evaluate: 'python scripts/benchmark.py --config configs/benchmark.yaml',
report: 'python scripts/benchmark.py --write-report',
},
preview: { type: 'static-report', entry: 'reports/benchmark.html' },
lifecycle: { evaluation: ['load benchmark inputs', 'score models', 'write report', 'check thresholds'] },
exportTargets: ['github', 'r2-artifact'],
},
] as const satisfies readonly MLTemplateDescriptor[];

export type MLTemplateId = typeof ML_TEMPLATE_REGISTRY[number]['id'];

export function getMLTemplate(templateId: string): MLTemplateDescriptor | undefined {
return ML_TEMPLATE_REGISTRY.find((template) => template.id === templateId);
}
