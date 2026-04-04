/**
 * CognitivePreview — Preview component for Mad-Lab ML projects.
 *
 * Renders the live preview (same as app), with a Mad-Lab ML-specific empty state.
 */

import { forwardRef } from 'react';
import { PreviewIframe } from '@/routes/chat/components/preview-iframe';
import type { PreviewComponentProps } from '../../core/types';

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
				<div className={`${className ?? ''} flex items-center justify-center bg-bg-3 border border-text/10 rounded-lg`}>
					<div className="text-center p-8 max-w-sm">
						<div className="text-accent font-semibold text-lg mb-2">Mad-Lab ML</div>
						<p className="text-text-primary/70 text-sm leading-relaxed">
							Your ML project is being generated. The preview will appear once
							the first deployable phase is complete.
						</p>
						<p className="text-text-tertiary text-xs mt-3">
							Marduk cognitive system is active — episodic memory and autonomy
							heartbeat are running.
						</p>
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

