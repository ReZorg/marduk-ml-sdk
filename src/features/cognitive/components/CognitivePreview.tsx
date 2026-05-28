/**
 * CognitivePreview — Preview component for Mad-Lab ML projects.
 *
 * Renders the live preview (same as app), with a Mad-Lab ML-specific workbench shell empty state.
 */

import { forwardRef } from 'react';
import { PreviewIframe } from '@/routes/chat/components/preview-iframe';
import type { PreviewComponentProps } from '../../core/types';

const WORKBENCH_AREAS = [
'Datasets',
'Experiments',
'Runs',
'Metrics',
'Models',
'Evaluation',
'Serving',
'Agents',
'Memory',
'Autonomy',
];

const CAPABILITY_SUMMARY = [
'Training orchestration',
'Evaluation runs',
'Dataset uploads',
'Model artifacts',
'AutoML search',
'Cognitive recall',
];

export const CognitivePreview = forwardRef<HTMLIFrameElement, PreviewComponentProps>(
(
{
previewUrl,
websocket,
shouldRefreshPreview,
manualRefreshTrigger,
previewRef,
className,
},
ref,
) => {
if (!previewUrl) {
return (
<div className={`${className ?? ''} overflow-y-auto bg-bg-3 border border-text/10 rounded-lg`}>
<div className="mx-auto max-w-5xl p-8 space-y-8">
<div className="space-y-3">
<div className="text-accent font-semibold text-xl">Mad-Lab ML Workbench</div>
<p className="text-text-primary/70 text-sm leading-relaxed max-w-2xl">
Your autonomous ML project is being generated. The workbench will connect code,
datasets, experiments, model artifacts, agents, and Marduk cognitive memory as
project services become available.
</p>
</div>

<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
{WORKBENCH_AREAS.map((area) => (
<div key={area} className="rounded-lg border border-text/10 bg-bg-2 p-3">
<div className="text-sm font-medium text-text-primary">{area}</div>
<div className="text-xs text-text-tertiary mt-1">Ready for ML metadata</div>
</div>
))}
</div>

<div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
<div className="text-sm font-medium text-text-primary mb-3">Enabled capabilities</div>
<div className="flex flex-wrap gap-2">
{CAPABILITY_SUMMARY.map((capability) => (
<span key={capability} className="rounded-full bg-bg-1 px-3 py-1 text-xs text-text-primary/80 border border-text/10">
{capability}
</span>
))}
</div>
<p className="text-text-tertiary text-xs mt-4">
Marduk cognitive system is active — episodic memory and autonomy heartbeat are running.
</p>
</div>
</div>
</div>
);
}

return (
<PreviewIframe
ref={ref ?? previewRef}
src={previewUrl}
className={className}
webSocket={websocket ?? null}
shouldRefreshPreview={shouldRefreshPreview}
manualRefreshTrigger={manualRefreshTrigger}
/>
);
},
);

