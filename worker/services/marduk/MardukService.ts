/**
 * MardukService — Worker-side integration of the Marduk Cognitive Architecture.
 *
 * This service provides the worker with cognitive persistence capabilities via
 * Cloudflare KV bindings (MARDUK_KV / MardukStore). It does NOT bundle the full
 * Marduk SDK into the worker — instead it handles the lightweight I/O operations
 * (episodic memory persistence, Archon agent configuration storage, autonomy
 * report persistence) that the worker layer needs.
 *
 * The full Marduk cognitive engine (MOSES, neural networks, etc.) runs in the SDK
 * layer (client-side scripts, CI workflows) where compute constraints are different.
 */

/** KV key used to store serialized episodic memory snapshots. */
const EPISODIC_MEMORY_KV_KEY = 'marduk:episodic:v1';

/** KV key used to store the last autonomy analysis result. */
const AUTONOMY_ANALYSIS_KV_KEY = 'marduk:autonomy:analysis:v1';

export interface MardukEpisodicEntry {
	sessionId: string;
	userMessage: string;
	assistantSummary: string;
	timestamp: number;
	projectType?: string;
	tags?: string[];
}

export interface AutonomyReport {
	timestamp: number;
	status: 'healthy' | 'degraded' | 'critical' | 'unknown';
	suggestions: Array<{ description: string; impact: string; risk: string }>;
	metrics: Record<string, unknown> | undefined;
}

export interface AgentCapabilityDef {
	name: string;
	description: string;
	required: boolean;
}

export interface ArchonAgentConfig {
	name: string;
	description: string;
	capabilities: AgentCapabilityDef[];
	objectives: string[];
}

export interface ArchonBuildResult {
	agentId: string;
	name: string;
	description: string;
	tools: string[];
}

/** Built-in ML tool names available to Archon agents. */
const ML_TOOL_NAMES = [
	'execute_code',
	'memory_store',
	'memory_recall',
	'http_request',
	'read_file',
	'write_file',
	'database_query',
	'schedule_task',
	'send_message',
	'web_search',
] as const;

type MLToolName = typeof ML_TOOL_NAMES[number];

/** Map capability keywords to recommended ML tools. */
function resolveToolsFromCapabilities(capabilities: AgentCapabilityDef[]): MLToolName[] {
	const tools = new Set<MLToolName>();
	for (const cap of capabilities) {
		const name = cap.name.toLowerCase();
		if (name.includes('code') || name.includes('exec') || name.includes('train')) {
			tools.add('execute_code');
		}
		if (name.includes('memory') || name.includes('store') || name.includes('recall')) {
			tools.add('memory_store');
			tools.add('memory_recall');
		}
		if (name.includes('http') || name.includes('api') || name.includes('request')) {
			tools.add('http_request');
		}
		if (name.includes('file') || name.includes('read')) {
			tools.add('read_file');
			tools.add('write_file');
		}
		if (name.includes('db') || name.includes('database') || name.includes('query')) {
			tools.add('database_query');
		}
		if (name.includes('schedule') || name.includes('task')) {
			tools.add('schedule_task');
		}
		if (name.includes('search') || name.includes('web')) {
			tools.add('web_search');
		}
	}
	// Default tools for all agents
	tools.add('memory_store');
	tools.add('memory_recall');
	return Array.from(tools);
}

/**
 * Persist a conversation turn as an episodic memory entry in KV.
 * Loads existing entries, appends the new one, and trims to capacity.
 */
export async function storeConversationEpisode(
	env: Env,
	entry: MardukEpisodicEntry,
): Promise<void> {
	const kv = env.MARDUK_KV;
	if (!kv) return;

	const capacity = parseInt(env.MARDUK_MEMORY_CAPACITY ?? '1000', 10);
	let entries: MardukEpisodicEntry[] = [];

	try {
		const raw = await kv.get(EPISODIC_MEMORY_KV_KEY);
		if (raw) {
			entries = JSON.parse(raw) as MardukEpisodicEntry[];
		}
	} catch {
		entries = [];
	}

	entries.push(entry);

	// Trim oldest entries if over capacity
	if (entries.length > capacity) {
		entries = entries.slice(entries.length - capacity);
	}

	await kv.put(EPISODIC_MEMORY_KV_KEY, JSON.stringify(entries));
}

/**
 * Retrieve recent episodic memory entries for a given session.
 */
export async function recallEpisodicMemory(
	env: Env,
	sessionId: string,
	limit = 5,
): Promise<MardukEpisodicEntry[]> {
	const kv = env.MARDUK_KV;
	if (!kv) return [];

	try {
		const raw = await kv.get(EPISODIC_MEMORY_KV_KEY);
		if (!raw) return [];
		const entries = JSON.parse(raw) as MardukEpisodicEntry[];
		return entries
			.filter((e) => e.sessionId === sessionId)
			.slice(-limit);
	} catch {
		return [];
	}
}

/**
 * Build an ML-specialized Archon agent configuration and persist it to KV.
 */
export async function buildArchonMLAgent(
	env: Env,
	config: ArchonAgentConfig,
): Promise<ArchonBuildResult> {
	const tools = resolveToolsFromCapabilities(config.capabilities);
	const agentId = `archon-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

	const result: ArchonBuildResult = {
		agentId,
		name: config.name,
		description: config.description,
		tools,
	};

	const kv = env.MARDUK_KV;
	if (kv) {
		await kv.put(`marduk:archon:agent:${agentId}`, JSON.stringify(result));
	}

	return result;
}

/**
 * Run a lightweight autonomy analysis cycle and store the result.
 * Called from the scheduled heartbeat handler.
 * 
 * Worker-side implementation: collects KV stats and produces an optimistic
 * health report. The full MOSES/neural analysis runs in the SDK (client/CI layer).
 */
export async function runAutonomyHeartbeat(env: Env): Promise<AutonomyReport> {
	const kv = env.MARDUK_KV;

	let episodicCount = 0;
	let archonAgentCount = 0;

	if (kv) {
		try {
			const raw = await kv.get(EPISODIC_MEMORY_KV_KEY);
			if (raw) {
				const entries = JSON.parse(raw) as MardukEpisodicEntry[];
				episodicCount = entries.length;
			}
		} catch {
			// non-fatal
		}

		try {
			const listing = await kv.list({ prefix: 'marduk:archon:agent:' });
			archonAgentCount = listing.keys.length;
		} catch {
			// non-fatal
		}
	}

	const capacity = Math.max(1, parseInt(env.MARDUK_MEMORY_CAPACITY ?? '1000', 10));
	const usagePct = episodicCount / capacity;

	const suggestions: AutonomyReport['suggestions'] = [];
	if (usagePct > 0.8) {
		suggestions.push({
			description: 'Episodic memory usage exceeds 80% of capacity',
			impact: `memory.usage: ${(usagePct * 100).toFixed(1)}% → consider increasing MARDUK_MEMORY_CAPACITY`,
			risk: 'low',
		});
	}

	const report: AutonomyReport = {
		timestamp: Date.now(),
		status: usagePct > 0.95 ? 'degraded' : 'healthy',
		suggestions,
		metrics: {
			episodicMemoryEntries: episodicCount,
			episodicMemoryCapacity: capacity,
			episodicMemoryUsagePct: usagePct,
			archonAgentCount,
		},
	};

	if (kv) {
		await kv.put(AUTONOMY_ANALYSIS_KV_KEY, JSON.stringify(report));
	}

	return report;
}

/**
 * Retrieve the most recent autonomy analysis report from KV.
 */
export async function getLastAutonomyReport(env: Env): Promise<AutonomyReport | null> {
	const kv = env.MARDUK_KV;
	if (!kv) return null;

	try {
		const raw = await kv.get(AUTONOMY_ANALYSIS_KV_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as AutonomyReport;
	} catch {
		return null;
	}
}

