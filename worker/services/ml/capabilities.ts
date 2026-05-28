import { ML_TEMPLATE_REGISTRY } from './templates';

export const ML_WORKBENCH_CAPABILITIES = {
product: 'Mad-Lab ML Workbench',
version: '0.1.0',
capabilities: {
trainingJobs: true,
evaluationRuns: true,
datasetUploads: true,
modelArtifactStorage: true,
experimentDashboards: true,
inferenceEndpoints: true,
autoMLSearch: true,
agentAssistedDebugging: true,
cognitiveMemoryRecall: true,
},
persistence: {
metadata: 'D1',
artifacts: 'R2',
fastState: 'KV',
semanticRetrieval: 'Vectorize-ready',
},
routes: [
'/api/ml/capabilities',
'/api/ml/templates',
'/api/ml/datasets',
'/api/ml/experiments',
'/api/ml/runs',
],
templates: ML_TEMPLATE_REGISTRY.map((template) => ({
id: template.id,
name: template.name,
family: template.family,
description: template.description,
tags: template.tags,
entryPoint: template.entryPoint,
commands: template.commands,
preview: template.preview,
exportTargets: template.exportTargets,
})),
} as const;
