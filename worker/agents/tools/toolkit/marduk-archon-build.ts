/**
 * marduk-archon-build — LLM tool for building ML-specialized sub-agents via Archon.
 *
 * Allows the conversational agent to instruct the Archon system to create a
 * purpose-built ML agent (e.g. a PyTorch training helper, a data pipeline
 * orchestrator, an MLflow tracking assistant) on demand.
 */

import { tool, t } from '../types';
import { StructuredLogger } from '../../../logger';
import { buildArchonMLAgent } from '../../../services/marduk/MardukService';
import type { ICodingAgent } from 'worker/agents/services/interfaces/ICodingAgent';
import type { ArchonAgentConfig } from '../../../services/marduk/MardukService';

export function createMardukArchonBuildTool(agent: ICodingAgent, logger: StructuredLogger) {
	return tool({
		name: 'marduk_archon_build',
		description:
			'Use the Marduk Archon system to build a specialized ML sub-agent. ' +
			'Provide a name, goal description, and list of required capabilities. ' +
			'Returns the new agent ID and its assigned tools.',
		args: {
			agentName: t.string().describe('Short name for the new ML agent (e.g. "pytorch-trainer")'),
			goal: t.string().describe('Goal or purpose of the agent (e.g. "Train PyTorch image classifiers and track experiments with MLflow")'),
			capabilities: t.array(t.string()).describe('List of capability keywords the agent needs (e.g. ["execute_code", "memory_store", "http_request"])').optional().default([]),
		},
		run: async ({ agentName, goal, capabilities }) => {
			logger.info('Building Archon ML agent', { agentName, goal });

			const config: ArchonAgentConfig = {
				name: agentName,
				description: goal,
				capabilities: (capabilities ?? []).map((cap) => ({
					name: cap,
					description: cap,
					required: true,
				})),
				objectives: [goal],
			};

			const env = (agent as unknown as { env: Env }).env;
			if (!env) {
				logger.warn('Env not accessible from agent; Archon build skipped');
				return JSON.stringify({
					error: 'Environment bindings not available',
					agentName,
				});
			}

			const result = await buildArchonMLAgent(env, config);
			logger.info('Archon ML agent built', { agentId: result.agentId });

			return JSON.stringify(result);
		},
	});
}
