export { VibeClient } from './client';
export { AgenticClient } from './agentic';
export { PhasicClient } from './phasic';
export { BuildSession } from './session';
export { WorkspaceStore } from './workspace';
export { SessionStateStore } from './state';

export { blueprintToMarkdown, BlueprintStreamParser } from './blueprint';
export type { Blueprint } from './blueprint';

export { isRecord, withTimeout, TimeoutError } from './utils';

export type {
	AgentConnection,
	AgentConnectionOptions,
	AgentEventMap,
	AgentWebSocketMessage,
	ApiResponse,
	App,
	AppDetails,
	AppListItem,
	AppStarToggleData,
	AppVisibility,
	AppWithFavoriteStatus,
	BehaviorType,
	BuildOptions,
	BuildStartEvent,
	CodeGenArgs,
	Credentials,
	DeleteResult,
	EnhancedAppData,
	FavoriteToggleResult,
	FileTreeNode,
	GitCloneTokenData,
	PaginationInfo,
	PhaseEventType,
	PhaseFile,
	PhaseFileStatus,
	PhaseInfo,
	PhaseStatus,
	PhaseTimelineChangeType,
	PhaseTimelineEvent,
	ProjectType,
	PublicAppsQuery,
	SessionDeployable,
	SessionFiles,
	SessionPhases,
	ToggleResult,
	UrlProvider,
	VibeClientOptions,
	VisibilityUpdateResult,
	WaitForPhaseOptions,
	WaitOptions,
} from './types';

export type { SessionState, ConnectionState, GenerationState, PhaseState } from './state';

export type {
	AgentState,
	AgentConnectionData,
	AgentPreviewResponse,
	WebSocketMessage,
	WebSocketMessageData,
} from './protocol';

// ============================================================================
// Marduk Cognitive Architecture
// ============================================================================

export { Marduk, createMarduk } from './marduk';
export type { MardukConfig } from './marduk';

// Memory System
export {
	MemorySystem,
	BaseMemoryStore,
	DeclarativeMemoryStore,
	EpisodicMemoryStore,
	ProceduralMemoryStore,
	SemanticMemoryStore,
} from './marduk';
export type {
	MemoryQuery,
	MemorySearchResult,
	MemoryStatistics,
	AccessPattern,
} from './marduk';

// Task Management System
export { TaskManager, TaskPriorityQueue, DeferredTaskHandler } from './marduk';
export type { CreateTaskOptions, TaskExecutionContext, TaskHandler } from './marduk';

// AI Coordination System
export { AICoordinator, ContextManager, RateLimiter } from './marduk';
export type {
	AIProvider,
	AIRequest,
	AIMessage,
	AITool as MardukAITool,
	AIToolCall,
	RateLimitStatus,
	ConversationContext,
} from './marduk';

// Autonomy System
export { AutonomyCoordinator, MetricsCollector, HealthMonitor, OptimizationAnalyzer } from './marduk';
export type { HealthCheck } from './marduk';

// MOSES (Meta-Optimizing Semantic Evolutionary Search)
export { MOSESEngine, PopulationManager, FitnessEvaluator, GeneticOperators } from './marduk';
export type { MutationStrategy, CrossoverStrategy, SelectionStrategy } from './marduk';

// Neural-Symbolic Integration
export { HypergraphCognitiveNetwork, NeuralEncoder, AttentionSystem, TruthValueSystem } from './marduk';

// Archon AI Agent Builder
export { ArchonSystem, AgentBuilder, AgentRefiner, ToolLibrary, AgentTemplateLibrary } from './marduk';
export type { AgentBlueprint, RefinementRequest, ToolDefinition, AgentTemplate } from './marduk';

// Core Cognitive Types
export type {
	CognitiveEntityId,
	CognitiveEntityType,
	CognitiveEntity,
	MemoryType,
	MemoryItem,
	MemoryContext,
	DeclarativeMemory,
	EpisodicMemory,
	ProceduralMemory,
	SemanticMemory,
	SemanticRelation,
	SemanticRelationType,
	Task,
	TaskStatus,
	TaskPriority,
	TaskPrerequisite,
	TaskExecutor,
	TaskResult,
	AIProviderType,
	AICapability,
	AIProviderConfig,
	AIModelConfig,
	AIRequestContext,
	AIRequestParameters,
	AIResponse,
	AIUsage,
	HealthStatus,
	OptimizationTarget,
	OptimizationSuggestion,
	SystemMetrics,
	MOSESIndividual,
	MOSESGenome,
	MOSESFitness,
	MOSESConfig,
	MOSESStatistics,
	Gene,
	FitnessObjective,
	HypergraphNode,
	Hyperedge,
	HyperedgeType,
	TruthValue,
	AttentionValue,
	NeuralEncoding,
	ArchonAgent,
	AgentCapability,
	AgentConfiguration,
	AgentStatus,
	AgentMetrics as MardukAgentMetrics,
	CognitiveEvent,
	CognitiveEventListener,
} from './marduk';
