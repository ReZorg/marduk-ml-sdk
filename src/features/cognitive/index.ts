/**
 * Mad-Lab ML Feature Module (cognitive)
 *
 * Registers the 'cognitive' project type for ML and data science projects.
 * Uses the Marduk cognitive architecture on the backend for episodic memory,
 * Archon agent building, and autonomy optimization.
 */

import type { ViewDefinition } from '@/api-types';
import type { FeatureModule } from '../core/types';
import { CognitivePreview } from './components/CognitivePreview';
import { CognitiveHeaderActions } from './components/CognitiveHeaderActions';

const COGNITIVE_VIEWS: ViewDefinition[] = [
	{
		id: 'editor',
		label: 'Code',
		iconName: 'Code2',
		tooltip: 'View and edit ML project source code',
	},
	{
		id: 'preview',
		label: 'Preview',
		iconName: 'Eye',
		tooltip: 'Live preview of the ML application',
	},
	{
		id: 'blueprint',
		label: 'Blueprint',
		iconName: 'Workflow',
		tooltip: 'View project blueprint and ML phases',
	},
	{
		id: 'terminal',
		label: 'Terminal',
		iconName: 'Terminal',
		tooltip: 'Training logs and command output',
	},
];

const cognitiveFeatureModule: FeatureModule = {
	id: 'cognitive',

	getViews(): ViewDefinition[] {
		return COGNITIVE_VIEWS;
	},

	PreviewComponent: CognitivePreview,

	HeaderActionsComponent: CognitiveHeaderActions,

	onActivate(context) {
		console.log('[CognitiveFeature] Mad-Lab ML activated for project:', context.projectType);
	},

	onDeactivate(context) {
		console.log('[CognitiveFeature] Mad-Lab ML deactivated from project:', context.projectType);
	},
};

export default cognitiveFeatureModule;
