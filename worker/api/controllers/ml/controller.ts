import {
MLWorkbenchService,
type CreateMlDatasetInput,
type CreateMlExperimentInput,
type CreateMlRunInput,
type CreateMlModelInput,
type CreateMlEvaluationInput,
type CreateMlTrainingJobInput,
type CreateMlServingDeploymentInput,
type CreateMlAutomlStudyInput,
type CreateMlArchonAgentInput,
type CreateMlCognitiveMemoryLinkInput,
type CreateMlAutonomyReportInput,
} from '../../../database';
import { BaseController } from '../baseController';
import type { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import { ML_WORKBENCH_CAPABILITIES } from '../../../services/ml/capabilities';
import { ML_TEMPLATE_REGISTRY } from '../../../services/ml/templates';
import type {
MlCapabilitiesData,
MlDatasetData,
MlDatasetsData,
MlExperimentData,
MlExperimentsData,
MlRunData,
MlRunsData,
MlTemplatesData,
MlModelsData,
MlModelData,
MlEvaluationsData,
MlEvaluationData,
MlTrainingJobsData,
MlTrainingJobData,
MlServingDeploymentsData,
MlServingDeploymentData,
MlAutomlStudiesData,
MlAutomlStudyData,
MlArchonAgentsData,
MlArchonAgentData,
MlCognitiveMemoryLinksData,
MlCognitiveMemoryLinkData,
MlAutonomyReportsData,
MlAutonomyReportData,
} from './types';

function parseLimit(request: Request): number {
const url = new URL(request.url);
const limit = Number(url.searchParams.get('limit') ?? 50);
if (!Number.isFinite(limit) || limit <= 0) return 50;
return Math.min(Math.floor(limit), 100);
}

function isObject(value: unknown): value is Record<string, unknown> {
return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasName(value: unknown): value is { name: string } {
return isObject(value) && typeof value.name === 'string' && value.name.trim().length > 0;
}

export class MLController extends BaseController {
// Capabilities and templates
static async getCapabilities(
_request: Request,
_env: Env,
_ctx: ExecutionContext,
_context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlCapabilitiesData>>> {
return MLController.createSuccessResponse(ML_WORKBENCH_CAPABILITIES);
}

static async listTemplates(
_request: Request,
_env: Env,
_ctx: ExecutionContext,
_context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlTemplatesData>>> {
return MLController.createSuccessResponse({ templates: ML_TEMPLATE_REGISTRY });
}

// Dataset operations
static async listDatasets(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlDatasetsData>>> {
try {
const service = new MLWorkbenchService(env);
const datasets = await service.listDatasets(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ datasets });
} catch (error) {
MLController.logger.error('Failed to list ML datasets', error);
return MLController.createErrorResponse<MlDatasetsData>('Failed to list datasets', 500);
}
}

static async createDataset(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlDatasetData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlDatasetInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlDatasetData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlDatasetData>('Dataset name is required', 400);
}

const service = new MLWorkbenchService(env);
const dataset = await service.createDataset(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
});
return MLController.createSuccessResponse({ dataset });
} catch (error) {
MLController.logger.error('Failed to create ML dataset', error);
return MLController.createErrorResponse<MlDatasetData>('Failed to create dataset', 500);
}
}

// Experiment operations
static async listExperiments(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlExperimentsData>>> {
try {
const service = new MLWorkbenchService(env);
const experiments = await service.listExperiments(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ experiments });
} catch (error) {
MLController.logger.error('Failed to list ML experiments', error);
return MLController.createErrorResponse<MlExperimentsData>('Failed to list experiments', 500);
}
}

static async createExperiment(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlExperimentData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlExperimentInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlExperimentData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlExperimentData>('Experiment name is required', 400);
}

const service = new MLWorkbenchService(env);
const experiment = await service.createExperiment(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
});
return MLController.createSuccessResponse({ experiment });
} catch (error) {
const message = error instanceof Error && error.message === 'Dataset not found' ? error.message : 'Failed to create experiment';
const status = message === 'Dataset not found' ? 404 : 500;
MLController.logger.error('Failed to create ML experiment', error);
return MLController.createErrorResponse<MlExperimentData>(message, status);
}
}

// Run operations
static async listRuns(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlRunsData>>> {
try {
const url = new URL(request.url);
const service = new MLWorkbenchService(env);
const runs = await service.listRuns(context.user!.id, url.searchParams.get('experimentId') ?? undefined, parseLimit(request));
return MLController.createSuccessResponse({ runs });
} catch (error) {
MLController.logger.error('Failed to list ML runs', error);
return MLController.createErrorResponse<MlRunsData>('Failed to list runs', 500);
}
}

static async createRun(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlRunData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlRunInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlRunData>>;
if (!isObject(parsed.data) || typeof parsed.data.experimentId !== 'string' || parsed.data.experimentId.trim().length === 0) {
return MLController.createErrorResponse<MlRunData>('Experiment ID is required', 400);
}

const service = new MLWorkbenchService(env);
const run = await service.createRun(context.user!.id, {
...parsed.data,
experimentId: parsed.data.experimentId.trim(),
});
return MLController.createSuccessResponse({ run });
} catch (error) {
const message = error instanceof Error && error.message === 'Experiment not found' ? error.message : 'Failed to create run';
const status = message === 'Experiment not found' ? 404 : 500;
MLController.logger.error('Failed to create ML run', error);
return MLController.createErrorResponse<MlRunData>(message, status);
}
}

// Model operations
static async listModels(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlModelsData>>> {
try {
const service = new MLWorkbenchService(env);
const models = await service.listModels(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ models });
} catch (error) {
MLController.logger.error('Failed to list ML models', error);
return MLController.createErrorResponse<MlModelsData>('Failed to list models', 500);
}
}

static async createModel(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlModelData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlModelInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlModelData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlModelData>('Model name is required', 400);
}

const service = new MLWorkbenchService(env);
const model = await service.createModel(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
});
return MLController.createSuccessResponse({ model });
} catch (error) {
MLController.logger.error('Failed to create ML model', error);
return MLController.createErrorResponse<MlModelData>('Failed to create model', 500);
}
}

// Evaluation operations
static async listEvaluations(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlEvaluationsData>>> {
try {
const service = new MLWorkbenchService(env);
const evaluations = await service.listEvaluations(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ evaluations });
} catch (error) {
MLController.logger.error('Failed to list ML evaluations', error);
return MLController.createErrorResponse<MlEvaluationsData>('Failed to list evaluations', 500);
}
}

static async createEvaluation(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlEvaluationData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlEvaluationInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlEvaluationData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlEvaluationData>('Evaluation name is required', 400);
}

const service = new MLWorkbenchService(env);
const evaluation = await service.createEvaluation(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
});
return MLController.createSuccessResponse({ evaluation });
} catch (error) {
MLController.logger.error('Failed to create ML evaluation', error);
return MLController.createErrorResponse<MlEvaluationData>('Failed to create evaluation', 500);
}
}

// Training job operations
static async listTrainingJobs(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlTrainingJobsData>>> {
try {
const service = new MLWorkbenchService(env);
const jobs = await service.listTrainingJobs(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ jobs });
} catch (error) {
MLController.logger.error('Failed to list ML training jobs', error);
return MLController.createErrorResponse<MlTrainingJobsData>('Failed to list training jobs', 500);
}
}

static async createTrainingJob(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlTrainingJobData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlTrainingJobInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlTrainingJobData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlTrainingJobData>('Training job name is required', 400);
}

const service = new MLWorkbenchService(env);
const job = await service.createTrainingJob(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
});
return MLController.createSuccessResponse({ job });
} catch (error) {
MLController.logger.error('Failed to create ML training job', error);
return MLController.createErrorResponse<MlTrainingJobData>('Failed to create training job', 500);
}
}

// Serving deployment operations
static async listServingDeployments(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlServingDeploymentsData>>> {
try {
const service = new MLWorkbenchService(env);
const deployments = await service.listServingDeployments(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ deployments });
} catch (error) {
MLController.logger.error('Failed to list ML serving deployments', error);
return MLController.createErrorResponse<MlServingDeploymentsData>('Failed to list serving deployments', 500);
}
}

static async createServingDeployment(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlServingDeploymentData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlServingDeploymentInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlServingDeploymentData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlServingDeploymentData>('Serving deployment name is required', 400);
}

const service = new MLWorkbenchService(env);
const deployment = await service.createServingDeployment(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
});
return MLController.createSuccessResponse({ deployment });
} catch (error) {
MLController.logger.error('Failed to create ML serving deployment', error);
return MLController.createErrorResponse<MlServingDeploymentData>('Failed to create serving deployment', 500);
}
}

// AutoML study operations
static async listAutomlStudies(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlAutomlStudiesData>>> {
try {
const service = new MLWorkbenchService(env);
const studies = await service.listAutomlStudies(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ studies });
} catch (error) {
MLController.logger.error('Failed to list ML AutoML studies', error);
return MLController.createErrorResponse<MlAutomlStudiesData>('Failed to list AutoML studies', 500);
}
}

static async createAutomlStudy(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlAutomlStudyData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlAutomlStudyInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlAutomlStudyData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlAutomlStudyData>('AutoML study name is required', 400);
}

const service = new MLWorkbenchService(env);
const study = await service.createAutomlStudy(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
});
return MLController.createSuccessResponse({ study });
} catch (error) {
MLController.logger.error('Failed to create ML AutoML study', error);
return MLController.createErrorResponse<MlAutomlStudyData>('Failed to create AutoML study', 500);
}
}

// Archon agent operations
static async listArchonAgents(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlArchonAgentsData>>> {
try {
const service = new MLWorkbenchService(env);
const agents = await service.listArchonAgents(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ agents });
} catch (error) {
MLController.logger.error('Failed to list ML Archon agents', error);
return MLController.createErrorResponse<MlArchonAgentsData>('Failed to list Archon agents', 500);
}
}

static async createArchonAgent(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlArchonAgentData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlArchonAgentInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlArchonAgentData>>;
if (!hasName(parsed.data)) {
return MLController.createErrorResponse<MlArchonAgentData>('Archon agent name is required', 400);
}
if (!isObject(parsed.data) || typeof parsed.data.agentType !== 'string') {
return MLController.createErrorResponse<MlArchonAgentData>('Agent type is required', 400);
}

const service = new MLWorkbenchService(env);
const agent = await service.createArchonAgent(context.user!.id, {
...parsed.data,
name: parsed.data.name.trim(),
agentType: parsed.data.agentType as CreateMlArchonAgentInput['agentType'],
});
return MLController.createSuccessResponse({ agent });
} catch (error) {
MLController.logger.error('Failed to create ML Archon agent', error);
return MLController.createErrorResponse<MlArchonAgentData>('Failed to create Archon agent', 500);
}
}

// Cognitive memory operations
static async listCognitiveMemoryLinks(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlCognitiveMemoryLinksData>>> {
try {
const url = new URL(request.url);
const service = new MLWorkbenchService(env);
const links = await service.listCognitiveMemoryLinks(
context.user!.id,
url.searchParams.get('entityType') ?? undefined,
url.searchParams.get('entityId') ?? undefined,
parseLimit(request)
);
return MLController.createSuccessResponse({ links });
} catch (error) {
MLController.logger.error('Failed to list ML cognitive memory links', error);
return MLController.createErrorResponse<MlCognitiveMemoryLinksData>('Failed to list cognitive memory links', 500);
}
}

static async createCognitiveMemoryLink(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlCognitiveMemoryLinkData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlCognitiveMemoryLinkInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlCognitiveMemoryLinkData>>;
if (!isObject(parsed.data) || typeof parsed.data.entityType !== 'string' || typeof parsed.data.entityId !== 'string') {
return MLController.createErrorResponse<MlCognitiveMemoryLinkData>('Entity type and ID are required', 400);
}
if (typeof parsed.data.memoryType !== 'string' || typeof parsed.data.memoryKey !== 'string') {
return MLController.createErrorResponse<MlCognitiveMemoryLinkData>('Memory type and key are required', 400);
}

const service = new MLWorkbenchService(env);
const link = await service.createCognitiveMemoryLink(context.user!.id, parsed.data as CreateMlCognitiveMemoryLinkInput);
return MLController.createSuccessResponse({ link });
} catch (error) {
MLController.logger.error('Failed to create ML cognitive memory link', error);
return MLController.createErrorResponse<MlCognitiveMemoryLinkData>('Failed to create cognitive memory link', 500);
}
}

// Autonomy report operations
static async listAutonomyReports(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlAutonomyReportsData>>> {
try {
const service = new MLWorkbenchService(env);
const reports = await service.listAutonomyReports(context.user!.id, parseLimit(request));
return MLController.createSuccessResponse({ reports });
} catch (error) {
MLController.logger.error('Failed to list ML autonomy reports', error);
return MLController.createErrorResponse<MlAutonomyReportsData>('Failed to list autonomy reports', 500);
}
}

static async createAutonomyReport(
request: Request,
env: Env,
_ctx: ExecutionContext,
context: RouteContext,
): Promise<ControllerResponse<ApiResponse<MlAutonomyReportData>>> {
try {
const parsed = await MLController.parseJsonBody<CreateMlAutonomyReportInput>(request);
if (!parsed.success) return parsed.response as ControllerResponse<ApiResponse<MlAutonomyReportData>>;
if (!isObject(parsed.data) || typeof parsed.data.reportType !== 'string' || typeof parsed.data.status !== 'string') {
return MLController.createErrorResponse<MlAutonomyReportData>('Report type and status are required', 400);
}

const service = new MLWorkbenchService(env);
const report = await service.createAutonomyReport(
context.user!.id,
parsed.data.appId ?? null,
parsed.data.reportType,
parsed.data.status,
parsed.data.summary,
parsed.data.suggestions,
parsed.data.metrics
);
return MLController.createSuccessResponse({ report });
} catch (error) {
MLController.logger.error('Failed to create ML autonomy report', error);
return MLController.createErrorResponse<MlAutonomyReportData>('Failed to create autonomy report', 500);
}
}
}
