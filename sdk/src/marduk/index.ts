/**
 * Marduk's Machine Learning & AI Workbench
 *
 * A sophisticated cognitive architecture framework that implements
 * genuine cognitive patterns inspired by human cognition while
 * maintaining the precision and scalability of modern computational systems.
 *
 * The framework integrates four primary subsystems:
 * - Memory System: Declarative, episodic, procedural, and semantic memory
 * - Task Management: Intelligent prioritization, scheduling, and execution
 * - AI Coordination: Unified interface for multiple AI providers
 * - Autonomy System: Self-analysis, optimization, and adaptive control
 *
 * Plus advanced components:
 * - MOSES: Meta-Optimizing Semantic Evolutionary Search
 * - Neural-Symbolic Integration: Hypergraph cognitive networks
 * - Archon: AI agent builder ("Agenteer")
 */

// Core types
export type {
	CognitiveEntityId,
	CognitiveEntityType,
	CognitiveEntity,
	Timestamp,
	MemoryType,
	MemoryItem,
	MemoryContext,
	TemporalContext,
	SpatialContext,
	EmotionalContext,
	DeclarativeMemory,
	EpisodicMemory,
	ProceduralMemory,
	SemanticMemory,
	SemanticRelation,
	SemanticRelationType,
	ProcedureStep,
	Task,
	TaskStatus,
	TaskPriority,
	TaskPrerequisite,
	TaskExecutor,
	TaskResult,
	RetryPolicy,
	ResourceRequirement,
	AIProviderType,
	AICapability,
	AIProviderConfig,
	AIModelConfig,
	RateLimitConfig,
	AIRequestContext,
	AIRequestParameters,
	AIResponse,
	AIUsage,
	HealthStatus,
	OptimizationTarget,
	OptimizationSuggestion,
	OptimizationImpact,
	SystemMetrics,
	MemoryMetrics,
	TaskMetrics,
	AIMetrics,
	PerformanceMetrics,
	MOSESIndividual,
	MOSESGenome,
	MOSESFitness,
	MOSESConfig,
	MOSESStatistics,
	Gene,
	GrammarStructure,
	GrammarRule,
	FitnessObjective,
	TerminationCriteria,
	HypergraphNode,
	Hyperedge,
	HyperedgeType,
	TruthValue,
	AttentionValue,
	NeuralEncoding,
	ArchonAgent,
	AgentCapability,
	AgentTool,
	ToolParameter,
	AgentConfiguration,
	AgentStatus,
	AgentMetrics,
	CognitiveEvent,
	CognitiveEventListener,
} from './types';

// Memory System
export {
	MemorySystem,
	BaseMemoryStore,
	DeclarativeMemoryStore,
	EpisodicMemoryStore,
	ProceduralMemoryStore,
	SemanticMemoryStore,
} from './memory';
export type {
	MemoryQuery,
	MemorySearchResult,
	MemoryStatistics,
	AccessPattern,
} from './memory';

// Task Management System
export {
	TaskManager,
	TaskPriorityQueue,
	DeferredTaskHandler,
} from './task';
export type {
	CreateTaskOptions,
	TaskExecutionContext,
	TaskHandler,
} from './task';

// AI Coordination System
export {
	AICoordinator,
	ContextManager,
	RateLimiter,
} from './ai';
export type {
	AIProvider,
	AIRequest,
	AIMessage,
	AITool,
	AIToolCall,
	RateLimitStatus,
	ConversationContext,
} from './ai';

// Autonomy System
export {
	AutonomyCoordinator,
	MetricsCollector,
	HealthMonitor,
	OptimizationAnalyzer,
} from './autonomy';
export type {
	HealthCheck,
} from './autonomy';

// MOSES (Meta-Optimizing Semantic Evolutionary Search)
export {
	MOSESEngine,
	PopulationManager,
	FitnessEvaluator,
	GeneticOperators,
} from './moses';
export type {
	MutationStrategy,
	CrossoverStrategy,
	SelectionStrategy,
} from './moses';

// Neural-Symbolic Integration
export {
	HypergraphCognitiveNetwork,
	NeuralEncoder,
	AttentionSystem,
	TruthValueSystem,
} from './neural';

// Archon AI Agent Builder
export {
	ArchonSystem,
	AgentBuilder,
	AgentRefiner,
	ToolLibrary,
	AgentTemplateLibrary,
} from './archon';
export type {
	AgentBlueprint,
	RefinementRequest,
	ToolDefinition,
	AgentTemplate,
} from './archon';

// ============================================================================
// Unified Cognitive Architecture
// ============================================================================

import { MemorySystem } from './memory';
import { TaskManager } from './task';
import { AICoordinator } from './ai';
import { AutonomyCoordinator } from './autonomy';
import { MOSESEngine } from './moses';
import { HypergraphCognitiveNetwork } from './neural';
import { ArchonSystem } from './archon';
import type { MOSESConfig, CognitiveEvent, CognitiveEventListener } from './types';

/**
 * Configuration for the Marduk cognitive architecture.
 */
export interface MardukConfig {
	/** Neural encoding dimensions */
	neuralDimensions?: number;
	/** MOSES evolution configuration */
	mosesConfig?: MOSESConfig;
	/** Enable autonomy system */
	autonomyEnabled?: boolean;
	/** Enable Archon agent builder */
	archonEnabled?: boolean;
}

/**
 * Marduk - Unified Cognitive Architecture
 *
 * Integrates all cognitive subsystems into a coherent whole that
 * exhibits emergent intelligence through sophisticated interactions.
 */
export class Marduk {
	/** Memory subsystem for knowledge storage and retrieval */
	readonly memory: MemorySystem;

	/** Task management for intelligent scheduling and execution */
	readonly tasks: TaskManager;

	/** AI coordination for multi-provider integration */
	readonly ai: AICoordinator;

	/** Autonomy system for self-optimization */
	readonly autonomy: AutonomyCoordinator;

	/** Neural-symbolic integration via hypergraph cognitive network */
	readonly cognitive: HypergraphCognitiveNetwork;

	/** MOSES evolutionary optimization engine */
	private mosesEngine?: MOSESEngine;

	/** Archon AI agent builder */
	readonly archon: ArchonSystem;

	/** Event listeners */
	private eventListeners: Map<string, Set<CognitiveEventListener>> = new Map();

	/** Configuration */
	private config: MardukConfig;

	constructor(config: MardukConfig = {}) {
		this.config = config;

		// Initialize core subsystems
		this.memory = new MemorySystem();
		this.tasks = new TaskManager();
		this.ai = new AICoordinator();
		this.autonomy = new AutonomyCoordinator();
		this.cognitive = new HypergraphCognitiveNetwork(config.neuralDimensions ?? 128);
		this.archon = new ArchonSystem();

		// Initialize MOSES if configured
		if (config.mosesConfig) {
			this.mosesEngine = new MOSESEngine(config.mosesConfig);
		}

		// Register built-in task handlers
		this.registerBuiltinHandlers();

		// Register health checks
		this.registerHealthChecks();
	}

	/**
	 * Get the MOSES evolutionary engine.
	 * Creates one with default config if not already initialized.
	 */
	getMOSES(config?: MOSESConfig): MOSESEngine {
		if (!this.mosesEngine && config) {
			this.mosesEngine = new MOSESEngine(config);
		} else if (!this.mosesEngine) {
			this.mosesEngine = new MOSESEngine({
				populationSize: 100,
				generations: 100,
				mutationRate: 0.1,
				crossoverRate: 0.7,
				eliteRatio: 0.1,
				tournamentSize: 5,
				objectives: [
					{ name: 'performance', value: 0, weight: 1, direction: 'maximize' },
				],
				terminationCriteria: { maxGenerations: 100 },
			});
		}
		return this.mosesEngine;
	}

	/**
	 * Register built-in task handlers.
	 */
	private registerBuiltinHandlers(): void {
		// Memory operations
		this.tasks.registerHandler('memory.store', async (ctx, params) => {
			const { type, content, options } = params as {
				type: 'declarative' | 'episodic' | 'procedural' | 'semantic';
				content: Record<string, unknown>;
				options?: Record<string, unknown>;
			};

			switch (type) {
				case 'declarative':
					return this.memory.declarative.storeFact(
						ctx.taskId,
						content.fact as string,
						options
					);
				case 'episodic':
					return this.memory.episodic.storeEpisode(
						ctx.taskId,
						content.event as string,
						options
					);
				case 'procedural':
					return this.memory.procedural.storeProcedure(
						ctx.taskId,
						content.procedure as string,
						content.steps as Array<{ order: number; action: string }>,
						options
					);
				case 'semantic':
					return this.memory.semantic.storeConcept(
						ctx.taskId,
						content.concept as string,
						content.category as string,
						content.properties as Record<string, unknown>,
						options
					);
				default:
					throw new Error(`Unknown memory type: ${type}`);
			}
		});

		// AI operations
		this.tasks.registerHandler('ai.complete', async (_ctx, params) => {
			const { prompt, options } = params as {
				prompt: string;
				options?: Record<string, unknown>;
			};

			return this.ai.complete(prompt, options);
		});

		// Cognitive operations
		this.tasks.registerHandler('cognitive.addNode', async (_ctx, params) => {
			const { type, content, options } = params as {
				type: 'concept' | 'memory' | 'pattern' | 'goal' | 'action' | 'context';
				content: string;
				options?: Record<string, unknown>;
			};

			return this.cognitive.addNode(type, content, options);
		});

		// Autonomy operations
		this.tasks.registerHandler('autonomy.analyze', async () => {
			return this.autonomy.analyze();
		});
	}

	/**
	 * Register health checks for all subsystems.
	 */
	private registerHealthChecks(): void {
		const healthMonitor = this.autonomy.getHealthMonitor();

		healthMonitor.registerCheck('memory', async () => {
			const stats = this.memory.getStatistics();
			return {
				name: 'memory',
				status: stats.totalItems > 0 ? 'healthy' : 'degraded',
				message: `${stats.totalItems} items stored`,
				lastChecked: Date.now(),
				duration: 0,
			};
		});

		healthMonitor.registerCheck('tasks', async () => {
			const status = this.tasks.getQueueStatus();
			const isHealthy = status.failed < status.completed * 0.1;
			return {
				name: 'tasks',
				status: isHealthy ? 'healthy' : 'degraded',
				message: `${status.completed} completed, ${status.failed} failed`,
				lastChecked: Date.now(),
				duration: 0,
			};
		});

		healthMonitor.registerCheck('ai', async () => {
			const providers = this.ai.getProviders();
			return {
				name: 'ai',
				status: providers.length > 0 ? 'healthy' : 'degraded',
				message: `${providers.length} providers registered`,
				lastChecked: Date.now(),
				duration: 0,
			};
		});

		healthMonitor.registerCheck('cognitive', async () => {
			const stats = this.cognitive.getStatistics();
			return {
				name: 'cognitive',
				status: 'healthy',
				message: `${stats.nodeCount} nodes, ${stats.edgeCount} edges`,
				lastChecked: Date.now(),
				duration: 0,
			};
		});
	}

	/**
	 * Emit a cognitive event.
	 */
	emit(event: CognitiveEvent): void {
		const listeners = this.eventListeners.get(event.type);
		if (listeners) {
			for (const listener of listeners) {
				try {
					listener(event);
				} catch (error) {
					console.error(`Event listener error for ${event.type}:`, error);
				}
			}
		}
	}

	/**
	 * Subscribe to cognitive events.
	 */
	on(eventType: string, listener: CognitiveEventListener): () => void {
		if (!this.eventListeners.has(eventType)) {
			this.eventListeners.set(eventType, new Set());
		}
		this.eventListeners.get(eventType)!.add(listener);

		return () => {
			this.eventListeners.get(eventType)?.delete(listener);
		};
	}

	/**
	 * Get system health status.
	 */
	async getHealth(): Promise<{
		status: 'healthy' | 'degraded' | 'critical' | 'unknown';
		checks: Record<string, { status: string; message?: string }>;
	}> {
		const results = await this.autonomy.getHealthMonitor().runAllChecks();
		const checks: Record<string, { status: string; message?: string }> = {};

		for (const [name, check] of results) {
			checks[name] = { status: check.status, message: check.message };
		}

		return {
			status: this.autonomy.getHealthMonitor().getOverallHealth(),
			checks,
		};
	}

	/**
	 * Get optimization suggestions.
	 */
	analyze(): {
		suggestions: Array<{ description: string; impact: string; risk: string }>;
		metrics: Record<string, unknown> | undefined;
	} {
		const suggestions = this.autonomy.analyze();
		const status = this.autonomy.getStatus();

		return {
			suggestions: suggestions.map((s) => ({
				description: s.description,
				impact: `${s.impact.metric}: ${s.impact.currentValue} → ${s.impact.expectedValue}`,
				risk: s.risk,
			})),
			metrics: status.latestMetrics,
		};
	}

	/**
	 * Reset all subsystems.
	 */
	reset(): void {
		this.memory.clear();
		this.tasks.clear();
		this.ai.clearCache();
		this.autonomy.clear();
		this.cognitive.clear();
		this.archon.clear();
		this.eventListeners.clear();
	}
}

/**
 * Create a new Marduk cognitive architecture instance.
 */
export function createMarduk(config?: MardukConfig): Marduk {
	return new Marduk(config);
}
