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

export class MLWorkbenchService extends BaseService {
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
