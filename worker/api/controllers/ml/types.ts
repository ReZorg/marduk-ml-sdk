import type { MlDataset, MlExperiment, MlRun } from '../../../database/schema';
import type { ML_TEMPLATE_REGISTRY } from '../../../services/ml/templates';
import type { ML_WORKBENCH_CAPABILITIES } from '../../../services/ml/capabilities';

export type MlCapabilitiesData = typeof ML_WORKBENCH_CAPABILITIES;
export type MlTemplatesData = { templates: typeof ML_TEMPLATE_REGISTRY };
export type MlDatasetsData = { datasets: MlDataset[] };
export type MlDatasetData = { dataset: MlDataset };
export type MlExperimentsData = { experiments: MlExperiment[] };
export type MlExperimentData = { experiment: MlExperiment };
export type MlRunsData = { runs: MlRun[] };
export type MlRunData = { run: MlRun };
