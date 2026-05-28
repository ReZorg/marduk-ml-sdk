import type {
	MlDataset,
	MlExperiment,
	MlRun,
	MlModel,
	MlEvaluation,
	MlTrainingJob,
	MlServingDeployment,
	MlAutomlStudy,
	MlArchonAgent,
	MlCognitiveMemoryLink,
	MlAutonomyReport,
} from '../../../database/schema';
import type { ML_TEMPLATE_REGISTRY } from '../../../services/ml/templates';
import type { ML_WORKBENCH_CAPABILITIES } from '../../../services/ml/capabilities';

export type MlCapabilitiesData = typeof ML_WORKBENCH_CAPABILITIES;
export type MlTemplatesData = { templates: typeof ML_TEMPLATE_REGISTRY };

// Dataset types
export type MlDatasetsData = { datasets: MlDataset[] };
export type MlDatasetData = { dataset: MlDataset };

// Experiment types
export type MlExperimentsData = { experiments: MlExperiment[] };
export type MlExperimentData = { experiment: MlExperiment };

// Run types
export type MlRunsData = { runs: MlRun[] };
export type MlRunData = { run: MlRun };

// Model types
export type MlModelsData = { models: MlModel[] };
export type MlModelData = { model: MlModel };

// Evaluation types
export type MlEvaluationsData = { evaluations: MlEvaluation[] };
export type MlEvaluationData = { evaluation: MlEvaluation };

// Training job types
export type MlTrainingJobsData = { jobs: MlTrainingJob[] };
export type MlTrainingJobData = { job: MlTrainingJob };

// Serving deployment types
export type MlServingDeploymentsData = { deployments: MlServingDeployment[] };
export type MlServingDeploymentData = { deployment: MlServingDeployment };

// AutoML study types
export type MlAutomlStudiesData = { studies: MlAutomlStudy[] };
export type MlAutomlStudyData = { study: MlAutomlStudy };

// Archon agent types
export type MlArchonAgentsData = { agents: MlArchonAgent[] };
export type MlArchonAgentData = { agent: MlArchonAgent };

// Cognitive memory types
export type MlCognitiveMemoryLinksData = { links: MlCognitiveMemoryLink[] };
export type MlCognitiveMemoryLinkData = { link: MlCognitiveMemoryLink };

// Autonomy report types
export type MlAutonomyReportsData = { reports: MlAutonomyReport[] };
export type MlAutonomyReportData = { report: MlAutonomyReport };
