/**
 * Marduk Cognitive Architecture - Core Types
 *
 * This module defines the foundational types for the Marduk ML SDK's
 * cognitive architecture framework, implementing a sophisticated system
 * inspired by biological intelligence patterns.
 */

// ============================================================================
// Cognitive Entity Types
// ============================================================================

/**
 * Unique identifier for cognitive entities within the system.
 */
export type CognitiveEntityId = string;

/**
 * Timestamp in milliseconds since epoch.
 */
export type Timestamp = number;

/**
 * Types of cognitive entities that can exist within the hypergraph.
 */
export type CognitiveEntityType =
	| 'concept'
	| 'memory'
	| 'pattern'
	| 'goal'
	| 'action'
	| 'context';

/**
 * Base cognitive entity that all subsystems work with.
 */
export interface CognitiveEntity {
	id: CognitiveEntityId;
	type: CognitiveEntityType;
	data: Record<string, unknown>;
	confidence: number;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	accessCount: number;
	lastAccessedAt: Timestamp;
	metadata: Record<string, unknown>;
}

// ============================================================================
// Memory System Types
// ============================================================================

/**
 * Types of memory supported by the cognitive architecture.
 */
export type MemoryType = 'declarative' | 'episodic' | 'procedural' | 'semantic';

/**
 * Base memory item interface.
 */
export interface MemoryItem {
	id: CognitiveEntityId;
	memoryType: MemoryType;
	content: unknown;
	strength: number;
	importance: number;
	createdAt: Timestamp;
	lastAccessed: Timestamp;
	accessCount: number;
	associations: CognitiveEntityId[];
	context: MemoryContext;
}

/**
 * Contextual information for memory storage and retrieval.
 */
export interface MemoryContext {
	temporal: TemporalContext;
	spatial?: SpatialContext;
	emotional?: EmotionalContext;
	tags: string[];
}

/**
 * Temporal context for episodic memories.
 */
export interface TemporalContext {
	timestamp: Timestamp;
	duration?: number;
	sequence?: number;
}

/**
 * Spatial context for memories with location information.
 */
export interface SpatialContext {
	location: string;
	coordinates?: { x: number; y: number; z?: number };
}

/**
 * Emotional context affecting memory strength.
 */
export interface EmotionalContext {
	valence: number;
	arousal: number;
	dominance: number;
}

/**
 * Declarative memory for explicit facts and knowledge.
 */
export interface DeclarativeMemory extends MemoryItem {
	memoryType: 'declarative';
	content: {
		fact: string;
		source?: string;
		confidence: number;
		verifiedAt?: Timestamp;
	};
}

/**
 * Episodic memory for experiential information.
 */
export interface EpisodicMemory extends MemoryItem {
	memoryType: 'episodic';
	content: {
		event: string;
		participants?: string[];
		outcome?: string;
		emotions?: EmotionalContext;
	};
}

/**
 * Procedural memory for skills and behavioral patterns.
 */
export interface ProceduralMemory extends MemoryItem {
	memoryType: 'procedural';
	content: {
		procedure: string;
		steps: ProcedureStep[];
		successRate: number;
		executionTime: number;
	};
}

/**
 * A single step in a procedural memory.
 */
export interface ProcedureStep {
	order: number;
	action: string;
	parameters?: Record<string, unknown>;
	preconditions?: string[];
	postconditions?: string[];
}

/**
 * Semantic memory for conceptual relationships.
 */
export interface SemanticMemory extends MemoryItem {
	memoryType: 'semantic';
	content: {
		concept: string;
		category: string;
		properties: Record<string, unknown>;
		relationships: SemanticRelation[];
	};
}

/**
 * Relationship between semantic concepts.
 */
export interface SemanticRelation {
	targetId: CognitiveEntityId;
	relationType: SemanticRelationType;
	strength: number;
	bidirectional: boolean;
}

/**
 * Types of semantic relationships.
 */
export type SemanticRelationType =
	| 'is-a'
	| 'has-a'
	| 'part-of'
	| 'similar-to'
	| 'opposite-of'
	| 'causes'
	| 'enables'
	| 'requires'
	| 'temporal-before'
	| 'temporal-after';

// ============================================================================
// Task Management Types
// ============================================================================

/**
 * Task status within the management system.
 */
export type TaskStatus =
	| 'pending'
	| 'ready'
	| 'running'
	| 'completed'
	| 'failed'
	| 'cancelled'
	| 'deferred';

/**
 * Task priority levels.
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

/**
 * Task definition for the management system.
 */
export interface Task {
	id: CognitiveEntityId;
	name: string;
	description?: string;
	status: TaskStatus;
	priority: TaskPriority;
	urgency: number;
	dependencies: CognitiveEntityId[];
	prerequisites: TaskPrerequisite[];
	resources: ResourceRequirement[];
	createdAt: Timestamp;
	scheduledAt?: Timestamp;
	startedAt?: Timestamp;
	completedAt?: Timestamp;
	deadline?: Timestamp;
	executor: TaskExecutor;
	result?: TaskResult;
	metadata: Record<string, unknown>;
}

/**
 * Prerequisites for task activation.
 */
export interface TaskPrerequisite {
	type: 'task' | 'condition' | 'resource' | 'time';
	reference: string;
	operator: 'equals' | 'greater' | 'less' | 'contains' | 'exists';
	value: unknown;
}

/**
 * Resource requirements for task execution.
 */
export interface ResourceRequirement {
	resourceType: string;
	amount: number;
	exclusive: boolean;
}

/**
 * Task executor definition.
 */
export interface TaskExecutor {
	type: 'function' | 'operation' | 'agent' | 'external';
	handler: string;
	parameters: Record<string, unknown>;
	timeout?: number;
	retryPolicy?: RetryPolicy;
}

/**
 * Retry policy for failed tasks.
 */
export interface RetryPolicy {
	maxRetries: number;
	initialDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
}

/**
 * Result of task execution.
 */
export interface TaskResult {
	success: boolean;
	output?: unknown;
	error?: string;
	duration: number;
	resourcesUsed: Record<string, number>;
}

// ============================================================================
// AI Coordination Types
// ============================================================================

/**
 * AI provider types supported by the coordination system.
 */
export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'local' | 'custom';

/**
 * AI model capability types.
 */
export type AICapability =
	| 'text-generation'
	| 'code-generation'
	| 'reasoning'
	| 'vision'
	| 'embedding'
	| 'function-calling';

/**
 * Configuration for an AI provider.
 */
export interface AIProviderConfig {
	id: string;
	type: AIProviderType;
	name: string;
	endpoint: string;
	apiKey?: string;
	models: AIModelConfig[];
	capabilities: AICapability[];
	rateLimits: RateLimitConfig;
	priority: number;
	fallbackTo?: string;
}

/**
 * Configuration for a specific AI model.
 */
export interface AIModelConfig {
	id: string;
	name: string;
	contextWindow: number;
	maxOutputTokens: number;
	capabilities: AICapability[];
	costPerInputToken: number;
	costPerOutputToken: number;
	latencyMs: number;
}

/**
 * Rate limiting configuration.
 */
export interface RateLimitConfig {
	requestsPerMinute: number;
	tokensPerMinute: number;
	concurrentRequests: number;
}

/**
 * AI request context for coordination.
 */
export interface AIRequestContext {
	requestId: string;
	providerId: string;
	modelId: string;
	prompt: string;
	systemPrompt?: string;
	parameters: AIRequestParameters;
	metadata: Record<string, unknown>;
}

/**
 * Parameters for AI requests.
 */
export interface AIRequestParameters {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	topK?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	stopSequences?: string[];
}

/**
 * Response from AI provider.
 */
export interface AIResponse {
	requestId: string;
	providerId: string;
	modelId: string;
	content: string;
	finishReason: 'stop' | 'length' | 'content_filter' | 'error';
	usage: AIUsage;
	latencyMs: number;
	cached: boolean;
}

/**
 * Token usage statistics.
 */
export interface AIUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cost: number;
}

// ============================================================================
// Autonomy System Types
// ============================================================================

/**
 * System health status.
 */
export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

/**
 * Optimization target for the autonomy system.
 */
export interface OptimizationTarget {
	metric: string;
	direction: 'maximize' | 'minimize';
	weight: number;
	threshold?: number;
	currentValue: number;
	targetValue: number;
}

/**
 * System metrics for self-analysis.
 */
export interface SystemMetrics {
	timestamp: Timestamp;
	memory: MemoryMetrics;
	task: TaskMetrics;
	ai: AIMetrics;
	performance: PerformanceMetrics;
}

/**
 * Memory subsystem metrics.
 */
export interface MemoryMetrics {
	totalItems: number;
	itemsByType: Record<MemoryType, number>;
	averageAccessFrequency: number;
	cacheHitRate: number;
	compressionRatio: number;
}

/**
 * Task subsystem metrics.
 */
export interface TaskMetrics {
	pendingTasks: number;
	runningTasks: number;
	completedTasks: number;
	failedTasks: number;
	averageExecutionTime: number;
	queueDepth: number;
}

/**
 * AI subsystem metrics.
 */
export interface AIMetrics {
	totalRequests: number;
	successRate: number;
	averageLatency: number;
	tokenUsage: number;
	cost: number;
	cacheHitRate: number;
}

/**
 * Overall performance metrics.
 */
export interface PerformanceMetrics {
	cpuUsage: number;
	memoryUsage: number;
	networkLatency: number;
	throughput: number;
	errorRate: number;
}

/**
 * Optimization suggestion from autonomy analysis.
 */
export interface OptimizationSuggestion {
	id: string;
	subsystem: 'memory' | 'task' | 'ai' | 'autonomy';
	type: 'configuration' | 'resource' | 'algorithm' | 'architecture';
	description: string;
	impact: OptimizationImpact;
	risk: 'low' | 'medium' | 'high';
	autoApply: boolean;
	parameters: Record<string, unknown>;
}

/**
 * Expected impact of an optimization.
 */
export interface OptimizationImpact {
	metric: string;
	currentValue: number;
	expectedValue: number;
	confidence: number;
}

// ============================================================================
// MOSES (Meta-Optimizing Semantic Evolutionary Search) Types
// ============================================================================

/**
 * Individual in the MOSES population.
 */
export interface MOSESIndividual {
	id: string;
	genome: MOSESGenome;
	fitness: MOSESFitness;
	generation: number;
	parentIds: string[];
	createdAt: Timestamp;
	metadata: Record<string, unknown>;
}

/**
 * Genome representation for evolutionary search.
 */
export interface MOSESGenome {
	genes: Gene[];
	structure: GrammarStructure;
	size: number;
	complexity: number;
}

/**
 * Individual gene in the genome.
 */
export interface Gene {
	id: string;
	type: 'terminal' | 'nonterminal' | 'function' | 'constant';
	value: unknown;
	weight: number;
	mutable: boolean;
}

/**
 * Grammar structure for evolutionary search.
 */
export interface GrammarStructure {
	root: string;
	rules: GrammarRule[];
	terminals: string[];
	nonterminals: string[];
}

/**
 * Production rule in the grammar.
 */
export interface GrammarRule {
	lhs: string;
	rhs: string[];
	probability: number;
}

/**
 * Multi-objective fitness evaluation.
 */
export interface MOSESFitness {
	overall: number;
	objectives: FitnessObjective[];
	normalized: number;
	rank: number;
	crowdingDistance: number;
}

/**
 * Individual fitness objective.
 */
export interface FitnessObjective {
	name: string;
	value: number;
	weight: number;
	direction: 'maximize' | 'minimize';
}

/**
 * Evolution configuration.
 */
export interface MOSESConfig {
	populationSize: number;
	generations: number;
	mutationRate: number;
	crossoverRate: number;
	eliteRatio: number;
	tournamentSize: number;
	objectives: FitnessObjective[];
	terminationCriteria: TerminationCriteria;
}

/**
 * Criteria for terminating evolution.
 */
export interface TerminationCriteria {
	maxGenerations: number;
	fitnessThreshold?: number;
	stagnationGenerations?: number;
	timeLimit?: number;
}

/**
 * Statistics from an evolution run.
 */
export interface MOSESStatistics {
	generation: number;
	bestFitness: number;
	averageFitness: number;
	diversity: number;
	convergenceRate: number;
	improvements: number;
	elapsedTime: number;
}

// ============================================================================
// Neural-Symbolic Integration Types
// ============================================================================

/**
 * Node in the hypergraph cognitive network.
 */
export interface HypergraphNode {
	id: CognitiveEntityId;
	type: CognitiveEntityType;
	embedding: number[];
	activationLevel: number;
	shortTermImportance: number;
	longTermImportance: number;
	truthValue: TruthValue;
	attentionValue: AttentionValue;
}

/**
 * Probabilistic truth value for uncertain reasoning.
 */
export interface TruthValue {
	strength: number;
	confidence: number;
}

/**
 * Attention value for economic attention allocation.
 */
export interface AttentionValue {
	shortTermImportance: number;
	longTermImportance: number;
	vlti: boolean;
}

/**
 * Edge types in the hypergraph.
 */
export type HyperedgeType =
	| 'semantic'
	| 'temporal'
	| 'causal'
	| 'hierarchical'
	| 'associative'
	| 'meta';

/**
 * Hyperedge connecting multiple nodes.
 */
export interface Hyperedge {
	id: string;
	type: HyperedgeType;
	nodes: CognitiveEntityId[];
	weight: number;
	truthValue: TruthValue;
	metadata: Record<string, unknown>;
}

/**
 * Neural encoding of symbolic structures.
 */
export interface NeuralEncoding {
	symbolId: CognitiveEntityId;
	embedding: number[];
	dimensions: number;
	encoder: string;
	confidence: number;
}

// ============================================================================
// Archon AI Agent Builder Types
// ============================================================================

/**
 * Agent definition for the Archon builder.
 */
export interface ArchonAgent {
	id: string;
	name: string;
	description: string;
	version: string;
	capabilities: AgentCapability[];
	tools: AgentTool[];
	systemPrompt: string;
	configuration: AgentConfiguration;
	status: AgentStatus;
	metrics: AgentMetrics;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

/**
 * Agent capability definition.
 */
export interface AgentCapability {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	outputSchema: Record<string, unknown>;
}

/**
 * Tool available to an agent.
 */
export interface AgentTool {
	name: string;
	description: string;
	parameters: ToolParameter[];
	handler: string;
	timeout: number;
}

/**
 * Parameter for an agent tool.
 */
export interface ToolParameter {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'object' | 'array';
	description: string;
	required: boolean;
	default?: unknown;
}

/**
 * Agent configuration.
 */
export interface AgentConfiguration {
	model: string;
	temperature: number;
	maxTokens: number;
	memoryEnabled: boolean;
	autonomyLevel: 'supervised' | 'semi-autonomous' | 'autonomous';
	learningEnabled: boolean;
}

/**
 * Agent runtime status.
 */
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'terminated';

/**
 * Agent performance metrics.
 */
export interface AgentMetrics {
	totalExecutions: number;
	successRate: number;
	averageExecutionTime: number;
	tokensUsed: number;
	toolCalls: number;
	learningIterations: number;
}

// ============================================================================
// Event System Types
// ============================================================================

/**
 * Cognitive event for inter-subsystem communication.
 */
export interface CognitiveEvent {
	id: string;
	type: string;
	source: string;
	timestamp: Timestamp;
	data: unknown;
	priority: TaskPriority;
}

/**
 * Event listener for cognitive events.
 */
export type CognitiveEventListener = (event: CognitiveEvent) => void | Promise<void>;
