import { MLWorkbenchService, type CreateMlDatasetInput, type CreateMlExperimentInput, type CreateMlRunInput } from '../../../database';
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
}
