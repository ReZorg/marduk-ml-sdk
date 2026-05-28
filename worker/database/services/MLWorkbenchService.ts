import { and, desc, eq } from 'drizzle-orm';
import { BaseService } from './BaseService';
import * as schema from '../schema';
import { generateId } from '../../utils/idGenerator';

export type CreateMlDatasetInput = {
	appId?: string;
	name: string;
	description?: string;
	sourceType?: 'upload' | 'import' | 'generated' | 'external';
	format?: string;
	storageKey?: string;
	schemaJson?: unknown;
	metadata?: unknown;
};

export type CreateMlExperimentInput = {
	appId?: string;
	datasetId?: string;
	datasetVersionId?: string;
	name: string;
	description?: string;
	targetMetric?: string;
	goal?: 'maximize' | 'minimize';
	config?: unknown;
	metadata?: unknown;
};

export type CreateMlRunInput = {
	appId?: string;
	experimentId: string;
	name?: string;
	status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
	runType?: 'training' | 'evaluation' | 'automl' | 'inference';
	parameters?: unknown;
	metrics?: unknown;
	artifactRootKey?: string;
	logKey?: string;
};

export type CreateMlModelInput = {
	appId?: string;
	name: string;
	description?: string;
	taskType?: string;
	metadata?: unknown;
};

export type CreateMlEvaluationInput = {
	appId?: string;
	modelId?: string;
	modelVersionId?: string;
	runId?: string;
	datasetId?: string;
	name: string;
	description?: string;
	metadata?: unknown;
};

export type CreateMlTrainingJobInput = {
	appId?: string;
	experimentId?: string;
	name: string;
	config?: unknown;
	resourceLimits?: unknown;
	maxRetries?: number;
};

export type CreateMlServingDeploymentInput = {
	appId?: string;
	modelId?: string;
	modelVersionId?: string;
	name: string;
	containerConfig?: unknown;
	resourceLimits?: unknown;
	replicas?: number;
	metadata?: unknown;
};

export type CreateMlAutomlStudyInput = {
	appId?: string;
	experimentId?: string;
	name: string;
	description?: string;
	searchSpace?: unknown;
	objectives?: unknown;
	algorithm?: 'moses' | 'optuna' | 'grid' | 'random';
	maxTrials?: number;
	metadata?: unknown;
};

export type CreateMlArchonAgentInput = {
	appId?: string;
	name: string;
	description?: string;
	agentType: 'dataset_profiler' | 'feature_engineer' | 'trainer' | 'evaluator' | 'hyperopt' | 'serving' | 'debugger' | 'mlops' | 'research';
	capabilities?: unknown;
	tools?: unknown;
	objectives?: unknown;
	memoryScope?: 'user' | 'project' | 'session';
	safetyLimits?: unknown;
	metadata?: unknown;
};

export type CreateMlCognitiveMemoryLinkInput = {
	appId?: string;
	entityType: 'dataset' | 'experiment' | 'run' | 'model' | 'evaluation' | 'study';
	entityId: string;
	memoryType: 'declarative' | 'episodic' | 'procedural' | 'semantic';
	memoryKey: string;
	content?: string;
	embedding?: string;
	relevanceScore?: number;
	metadata?: unknown;
};

export type CreateMlAutonomyReportInput = {
	appId?: string;
	reportType: 'health' | 'optimization' | 'alert' | 'recommendation';
	status: 'healthy' | 'degraded' | 'critical' | 'unknown';
	summary?: string;
	suggestions?: unknown;
	metrics?: unknown;
};

export class MLWorkbenchService extends BaseService {
	// Dataset operations
	async listDatasets(userId: string, limit = 50): Promise<schema.MlDataset[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlDatasets)
			.where(eq(schema.mlDatasets.userId, userId))
			.orderBy(desc(schema.mlDatasets.updatedAt))
			.limit(limit);
	}

	async createDataset(userId: string, input: CreateMlDatasetInput): Promise<schema.MlDataset> {
		const [dataset] = await this.database
			.insert(schema.mlDatasets)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				name: input.name,
				description: input.description,
				sourceType: input.sourceType ?? 'upload',
				format: input.format,
				storageKey: input.storageKey,
				schemaJson: input.schemaJson,
				metadata: input.metadata ?? {},
			})
			.returning();
		return dataset;
	}

	// Experiment operations
	async listExperiments(userId: string, limit = 50): Promise<schema.MlExperiment[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlExperiments)
			.where(eq(schema.mlExperiments.userId, userId))
			.orderBy(desc(schema.mlExperiments.updatedAt))
			.limit(limit);
	}

	async createExperiment(userId: string, input: CreateMlExperimentInput): Promise<schema.MlExperiment> {
		if (input.datasetId) {
			const dataset = await this.getDatasetForUser(input.datasetId, userId);
			if (!dataset) {
				throw new Error('Dataset not found');
			}
		}

		const [experiment] = await this.database
			.insert(schema.mlExperiments)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				datasetId: input.datasetId,
				datasetVersionId: input.datasetVersionId,
				name: input.name,
				description: input.description,
				targetMetric: input.targetMetric,
				goal: input.goal ?? 'maximize',
				config: input.config ?? {},
				metadata: input.metadata ?? {},
			})
			.returning();
		return experiment;
	}

	// Run operations
	async listRuns(userId: string, experimentId?: string, limit = 50): Promise<schema.MlRun[]> {
		const where = experimentId
			? and(eq(schema.mlRuns.userId, userId), eq(schema.mlRuns.experimentId, experimentId))
			: eq(schema.mlRuns.userId, userId);

		return this.getReadDb()
			.select()
			.from(schema.mlRuns)
			.where(where)
			.orderBy(desc(schema.mlRuns.createdAt))
			.limit(limit);
	}

	async createRun(userId: string, input: CreateMlRunInput): Promise<schema.MlRun> {
		const experiment = await this.getExperimentForUser(input.experimentId, userId);
		if (!experiment) {
			throw new Error('Experiment not found');
		}

		const [run] = await this.database
			.insert(schema.mlRuns)
			.values({
				id: generateId(),
				experimentId: input.experimentId,
				userId,
				appId: input.appId ?? experiment.appId,
				name: input.name,
				status: input.status ?? 'queued',
				runType: input.runType ?? 'training',
				parameters: input.parameters ?? {},
				metrics: input.metrics ?? {},
				artifactRootKey: input.artifactRootKey,
				logKey: input.logKey,
			})
			.returning();
		return run;
	}

	// Model operations
	async listModels(userId: string, limit = 50): Promise<schema.MlModel[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlModels)
			.where(eq(schema.mlModels.userId, userId))
			.orderBy(desc(schema.mlModels.updatedAt))
			.limit(limit);
	}

	async createModel(userId: string, input: CreateMlModelInput): Promise<schema.MlModel> {
		const [model] = await this.database
			.insert(schema.mlModels)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				name: input.name,
				description: input.description,
				taskType: input.taskType,
				metadata: input.metadata ?? {},
			})
			.returning();
		return model;
	}

	async getModel(userId: string, modelId: string): Promise<schema.MlModel | undefined> {
		const [model] = await this.getReadDb()
			.select()
			.from(schema.mlModels)
			.where(and(eq(schema.mlModels.id, modelId), eq(schema.mlModels.userId, userId)))
			.limit(1);
		return model;
	}

	// Evaluation operations
	async listEvaluations(userId: string, limit = 50): Promise<schema.MlEvaluation[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlEvaluations)
			.where(eq(schema.mlEvaluations.userId, userId))
			.orderBy(desc(schema.mlEvaluations.updatedAt))
			.limit(limit);
	}

	async createEvaluation(userId: string, input: CreateMlEvaluationInput): Promise<schema.MlEvaluation> {
		const [evaluation] = await this.database
			.insert(schema.mlEvaluations)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				modelId: input.modelId,
				modelVersionId: input.modelVersionId,
				runId: input.runId,
				datasetId: input.datasetId,
				name: input.name,
				description: input.description,
				metadata: input.metadata ?? {},
			})
			.returning();
		return evaluation;
	}

	// Training job operations
	async listTrainingJobs(userId: string, limit = 50): Promise<schema.MlTrainingJob[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlTrainingJobs)
			.where(eq(schema.mlTrainingJobs.userId, userId))
			.orderBy(desc(schema.mlTrainingJobs.createdAt))
			.limit(limit);
	}

	async createTrainingJob(userId: string, input: CreateMlTrainingJobInput): Promise<schema.MlTrainingJob> {
		const [job] = await this.database
			.insert(schema.mlTrainingJobs)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				experimentId: input.experimentId,
				name: input.name,
				config: input.config ?? {},
				resourceLimits: input.resourceLimits ?? {},
				maxRetries: input.maxRetries ?? 3,
			})
			.returning();
		return job;
	}

	async updateTrainingJobStatus(
		userId: string,
		jobId: string,
		status: 'queued' | 'provisioning' | 'running' | 'succeeded' | 'failed' | 'cancelled',
		updates?: { exitCode?: number; errorMessage?: string; runId?: string }
	): Promise<schema.MlTrainingJob | undefined> {
		const now = new Date();

		// Fetch existing job to check if startedAt is already set (preserve on retries)
		const existingJob = await this.getReadDb()
			.select({ startedAt: schema.mlTrainingJobs.startedAt })
			.from(schema.mlTrainingJobs)
			.where(and(eq(schema.mlTrainingJobs.id, jobId), eq(schema.mlTrainingJobs.userId, userId)))
			.get();

		// Build update object conditionally to avoid setting undefined values
		const updateData: Record<string, unknown> = {
			status,
			updatedAt: now,
		};

		if (updates?.exitCode !== undefined) updateData.exitCode = updates.exitCode;
		if (updates?.errorMessage !== undefined) updateData.errorMessage = updates.errorMessage;
		if (updates?.runId !== undefined) updateData.runId = updates.runId;

		// Only set startedAt on first transition to 'running', not on retries
		if (status === 'running' && !existingJob?.startedAt) {
			updateData.startedAt = now;
		}

		// Set completedAt for terminal states
		if (['succeeded', 'failed', 'cancelled'].includes(status)) {
			updateData.completedAt = now;
		}

		const [job] = await this.database
			.update(schema.mlTrainingJobs)
			.set(updateData)
			.where(and(eq(schema.mlTrainingJobs.id, jobId), eq(schema.mlTrainingJobs.userId, userId)))
			.returning();
		return job;
	}

	// Serving deployment operations
	async listServingDeployments(userId: string, limit = 50): Promise<schema.MlServingDeployment[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlServingDeployments)
			.where(eq(schema.mlServingDeployments.userId, userId))
			.orderBy(desc(schema.mlServingDeployments.updatedAt))
			.limit(limit);
	}

	async createServingDeployment(userId: string, input: CreateMlServingDeploymentInput): Promise<schema.MlServingDeployment> {
		const [deployment] = await this.database
			.insert(schema.mlServingDeployments)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				modelId: input.modelId,
				modelVersionId: input.modelVersionId,
				name: input.name,
				containerConfig: input.containerConfig ?? {},
				resourceLimits: input.resourceLimits ?? {},
				replicas: input.replicas ?? 1,
				metadata: input.metadata ?? {},
			})
			.returning();
		return deployment;
	}

	async updateServingDeploymentStatus(
		userId: string,
		deploymentId: string,
		status: 'provisioning' | 'running' | 'stopped' | 'failed' | 'deleted',
		endpointUrl?: string
	): Promise<schema.MlServingDeployment | undefined> {
		const [deployment] = await this.database
			.update(schema.mlServingDeployments)
			.set({
				status,
				endpointUrl,
				updatedAt: new Date(),
			})
			.where(and(eq(schema.mlServingDeployments.id, deploymentId), eq(schema.mlServingDeployments.userId, userId)))
			.returning();
		return deployment;
	}

	// AutoML study operations
	async listAutomlStudies(userId: string, limit = 50): Promise<schema.MlAutomlStudy[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlAutomlStudies)
			.where(eq(schema.mlAutomlStudies.userId, userId))
			.orderBy(desc(schema.mlAutomlStudies.updatedAt))
			.limit(limit);
	}

	async createAutomlStudy(userId: string, input: CreateMlAutomlStudyInput): Promise<schema.MlAutomlStudy> {
		const [study] = await this.database
			.insert(schema.mlAutomlStudies)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				experimentId: input.experimentId,
				name: input.name,
				description: input.description,
				searchSpace: input.searchSpace ?? {},
				objectives: input.objectives ?? [],
				algorithm: input.algorithm ?? 'moses',
				maxTrials: input.maxTrials ?? 100,
				metadata: input.metadata ?? {},
			})
			.returning();
		return study;
	}

	// Archon agent operations
	async listArchonAgents(userId: string, limit = 50): Promise<schema.MlArchonAgent[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlArchonAgents)
			.where(eq(schema.mlArchonAgents.userId, userId))
			.orderBy(desc(schema.mlArchonAgents.updatedAt))
			.limit(limit);
	}

	async createArchonAgent(userId: string, input: CreateMlArchonAgentInput): Promise<schema.MlArchonAgent> {
		const [agent] = await this.database
			.insert(schema.mlArchonAgents)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				name: input.name,
				description: input.description,
				agentType: input.agentType,
				capabilities: input.capabilities ?? [],
				tools: input.tools ?? [],
				objectives: input.objectives ?? [],
				memoryScope: input.memoryScope ?? 'project',
				safetyLimits: input.safetyLimits ?? {},
				metadata: input.metadata ?? {},
			})
			.returning();
		return agent;
	}

	// Cognitive memory operations
	async listCognitiveMemoryLinks(userId: string, entityType?: string, entityId?: string, limit = 50): Promise<schema.MlCognitiveMemoryLink[]> {
		let whereCondition = eq(schema.mlCognitiveMemoryLinks.userId, userId);
		if (entityType && entityId) {
			whereCondition = and(
				whereCondition,
				eq(schema.mlCognitiveMemoryLinks.entityType, entityType as 'dataset' | 'experiment' | 'run' | 'model' | 'evaluation' | 'study'),
				eq(schema.mlCognitiveMemoryLinks.entityId, entityId)
			)!;
		}

		return this.getReadDb()
			.select()
			.from(schema.mlCognitiveMemoryLinks)
			.where(whereCondition)
			.orderBy(desc(schema.mlCognitiveMemoryLinks.updatedAt))
			.limit(limit);
	}

	async createCognitiveMemoryLink(userId: string, input: CreateMlCognitiveMemoryLinkInput): Promise<schema.MlCognitiveMemoryLink> {
		const [link] = await this.database
			.insert(schema.mlCognitiveMemoryLinks)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				entityType: input.entityType,
				entityId: input.entityId,
				memoryType: input.memoryType,
				memoryKey: input.memoryKey,
				content: input.content,
				embedding: input.embedding,
				relevanceScore: input.relevanceScore,
				metadata: input.metadata ?? {},
			})
			.returning();
		return link;
	}

	// Autonomy report operations
	async listAutonomyReports(userId: string, limit = 50): Promise<schema.MlAutonomyReport[]> {
		return this.getReadDb()
			.select()
			.from(schema.mlAutonomyReports)
			.where(eq(schema.mlAutonomyReports.userId, userId))
			.orderBy(desc(schema.mlAutonomyReports.createdAt))
			.limit(limit);
	}

	async createAutonomyReport(userId: string | null, input: CreateMlAutonomyReportInput): Promise<schema.MlAutonomyReport> {
		const [report] = await this.database
			.insert(schema.mlAutonomyReports)
			.values({
				id: generateId(),
				userId,
				appId: input.appId,
				reportType: input.reportType,
				status: input.status,
				summary: input.summary,
				suggestions: input.suggestions ?? [],
				metrics: input.metrics ?? {},
			})
			.returning();
		return report;
	}

	// Helper methods
	private async getDatasetForUser(datasetId: string, userId: string): Promise<schema.MlDataset | undefined> {
		const [dataset] = await this.getReadDb('fresh')
			.select()
			.from(schema.mlDatasets)
			.where(and(eq(schema.mlDatasets.id, datasetId), eq(schema.mlDatasets.userId, userId)))
			.limit(1);
		return dataset;
	}

	private async getExperimentForUser(experimentId: string, userId: string): Promise<schema.MlExperiment | undefined> {
		const [experiment] = await this.getReadDb('fresh')
			.select()
			.from(schema.mlExperiments)
			.where(and(eq(schema.mlExperiments.id, experimentId), eq(schema.mlExperiments.userId, userId)))
			.limit(1);
		return experiment;
	}
}
