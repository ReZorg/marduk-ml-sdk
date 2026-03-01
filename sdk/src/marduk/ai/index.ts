/**
 * Marduk AI Coordination System
 *
 * Provides a unified interface for multiple AI providers with
 * sophisticated context management and error handling.
 */

import type {
	AIProviderConfig,
	AIModelConfig,
	AIRequestContext,
	AIRequestParameters,
	AIResponse,
	AIUsage,
	AICapability,
	AIProviderType,
	RateLimitConfig,
} from '../types';

// ============================================================================
// AI Provider Interface
// ============================================================================

/**
 * Interface for AI provider implementations.
 */
export interface AIProvider {
	id: string;
	type: AIProviderType;
	name: string;
	capabilities: AICapability[];

	/**
	 * Generate a completion.
	 */
	complete(request: AIRequest): Promise<AIResponse>;

	/**
	 * Generate embeddings.
	 */
	embed?(texts: string[]): Promise<number[][]>;

	/**
	 * Check if provider is available.
	 */
	isAvailable(): Promise<boolean>;

	/**
	 * Get current rate limit status.
	 */
	getRateLimitStatus(): RateLimitStatus;
}

/**
 * AI request structure.
 */
export interface AIRequest {
	requestId: string;
	modelId: string;
	messages: AIMessage[];
	parameters: AIRequestParameters;
	tools?: AITool[];
}

/**
 * Message in an AI conversation.
 */
export interface AIMessage {
	role: 'system' | 'user' | 'assistant' | 'function';
	content: string;
	name?: string;
	toolCalls?: AIToolCall[];
}

/**
 * Tool definition for function calling.
 */
export interface AITool {
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
}

/**
 * Tool call from the AI.
 */
export interface AIToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

/**
 * Rate limit status.
 */
export interface RateLimitStatus {
	requestsRemaining: number;
	tokensRemaining: number;
	resetAt: number;
	isLimited: boolean;
}

// ============================================================================
// Context Management
// ============================================================================

/**
 * Conversation context for maintaining state.
 */
export interface ConversationContext {
	id: string;
	messages: AIMessage[];
	systemPrompt?: string;
	metadata: Record<string, unknown>;
	createdAt: number;
	updatedAt: number;
	tokenCount: number;
	maxTokens: number;
}

/**
 * Context manager for conversation state.
 */
export class ContextManager {
	private contexts: Map<string, ConversationContext> = new Map();
	private contextIdCounter: number = 0;

	/**
	 * Create a new conversation context.
	 */
	create(options: {
		systemPrompt?: string;
		maxTokens?: number;
		metadata?: Record<string, unknown>;
	} = {}): ConversationContext {
		const now = Date.now();
		const id = `ctx-${++this.contextIdCounter}`;

		const context: ConversationContext = {
			id,
			messages: [],
			systemPrompt: options.systemPrompt,
			metadata: options.metadata ?? {},
			createdAt: now,
			updatedAt: now,
			tokenCount: 0,
			maxTokens: options.maxTokens ?? 128000,
		};

		if (options.systemPrompt) {
			context.messages.push({
				role: 'system',
				content: options.systemPrompt,
			});
			context.tokenCount += this.estimateTokens(options.systemPrompt);
		}

		this.contexts.set(id, context);
		return context;
	}

	/**
	 * Add a message to a context.
	 */
	addMessage(contextId: string, message: AIMessage): void {
		const context = this.contexts.get(contextId);
		if (!context) {
			throw new Error(`Context not found: ${contextId}`);
		}

		const messageTokens = this.estimateTokens(message.content);
		context.messages.push(message);
		context.tokenCount += messageTokens;
		context.updatedAt = Date.now();

		if (context.tokenCount > context.maxTokens * 0.9) {
			this.truncateContext(context);
		}
	}

	/**
	 * Get a context by ID.
	 */
	get(contextId: string): ConversationContext | undefined {
		return this.contexts.get(contextId);
	}

	/**
	 * Clear a context.
	 */
	clear(contextId: string): void {
		const context = this.contexts.get(contextId);
		if (context) {
			const systemMessages = context.messages.filter((m) => m.role === 'system');
			context.messages = systemMessages;
			context.tokenCount = systemMessages.reduce(
				(sum, m) => sum + this.estimateTokens(m.content),
				0
			);
			context.updatedAt = Date.now();
		}
	}

	/**
	 * Delete a context.
	 */
	delete(contextId: string): boolean {
		return this.contexts.delete(contextId);
	}

	/**
	 * Truncate context to fit within token limit.
	 */
	private truncateContext(context: ConversationContext): void {
		const systemMessages = context.messages.filter((m) => m.role === 'system');
		const otherMessages = context.messages.filter((m) => m.role !== 'system');

		const keepCount = Math.max(4, Math.floor(otherMessages.length / 2));
		const keptMessages = otherMessages.slice(-keepCount);

		context.messages = [...systemMessages, ...keptMessages];
		context.tokenCount = context.messages.reduce(
			(sum, m) => sum + this.estimateTokens(m.content),
			0
		);
	}

	/**
	 * Estimate tokens in text (rough approximation).
	 */
	private estimateTokens(text: string): number {
		return Math.ceil(text.length / 4);
	}
}

// ============================================================================
// Rate Limiter
// ============================================================================

/**
 * Rate limiter for AI requests.
 */
export class RateLimiter {
	private requestCounts: Map<string, number[]> = new Map();
	private tokenCounts: Map<string, number[]> = new Map();

	constructor(private config: RateLimitConfig) {}

	/**
	 * Check if a request can be made.
	 */
	canRequest(providerId: string, estimatedTokens: number): boolean {
		const status = this.getStatus(providerId);
		return status.requestsRemaining > 0 && status.tokensRemaining >= estimatedTokens;
	}

	/**
	 * Record a request.
	 */
	recordRequest(providerId: string, tokens: number): void {
		const now = Date.now();

		if (!this.requestCounts.has(providerId)) {
			this.requestCounts.set(providerId, []);
		}
		if (!this.tokenCounts.has(providerId)) {
			this.tokenCounts.set(providerId, []);
		}

		this.requestCounts.get(providerId)!.push(now);
		this.tokenCounts.get(providerId)!.push(tokens);

		this.cleanup(providerId);
	}

	/**
	 * Get rate limit status for a provider.
	 */
	getStatus(providerId: string): RateLimitStatus {
		this.cleanup(providerId);

		const requests = this.requestCounts.get(providerId) ?? [];
		const tokens = this.tokenCounts.get(providerId) ?? [];

		const tokenSum = tokens.reduce((a, b) => a + b, 0);

		return {
			requestsRemaining: Math.max(0, this.config.requestsPerMinute - requests.length),
			tokensRemaining: Math.max(0, this.config.tokensPerMinute - tokenSum),
			resetAt: Date.now() + 60000,
			isLimited: requests.length >= this.config.requestsPerMinute || tokenSum >= this.config.tokensPerMinute,
		};
	}

	/**
	 * Clean up old entries.
	 */
	private cleanup(providerId: string): void {
		const cutoff = Date.now() - 60000;

		const requests = this.requestCounts.get(providerId);
		if (requests) {
			const filtered = requests.filter((t) => t > cutoff);
			this.requestCounts.set(providerId, filtered);
		}

		const tokens = this.tokenCounts.get(providerId);
		if (tokens) {
			const filtered = tokens.filter((_, i) => (requests?.[i] ?? 0) > cutoff);
			this.tokenCounts.set(providerId, filtered);
		}
	}
}

// ============================================================================
// AI Coordinator Implementation
// ============================================================================

/**
 * AI coordinator managing multiple providers.
 */
export class AICoordinator {
	private providers: Map<string, AIProviderConfig> = new Map();
	private contextManager: ContextManager;
	private rateLimiters: Map<string, RateLimiter> = new Map();
	private requestIdCounter: number = 0;
	private cache: Map<string, AIResponse> = new Map();
	private cacheEnabled: boolean = true;

	constructor() {
		this.contextManager = new ContextManager();
	}

	/**
	 * Register an AI provider.
	 */
	registerProvider(config: AIProviderConfig): void {
		this.providers.set(config.id, config);
		this.rateLimiters.set(config.id, new RateLimiter(config.rateLimits));
	}

	/**
	 * Get a provider by ID.
	 */
	getProvider(providerId: string): AIProviderConfig | undefined {
		return this.providers.get(providerId);
	}

	/**
	 * Get all registered providers.
	 */
	getProviders(): AIProviderConfig[] {
		return Array.from(this.providers.values());
	}

	/**
	 * Select the best provider for a capability.
	 */
	selectProvider(
		capability: AICapability,
		preferredProviderId?: string
	): AIProviderConfig | undefined {
		if (preferredProviderId) {
			const preferred = this.providers.get(preferredProviderId);
			if (preferred?.capabilities.includes(capability)) {
				const limiter = this.rateLimiters.get(preferredProviderId);
				if (!limiter?.getStatus(preferredProviderId).isLimited) {
					return preferred;
				}
			}
		}

		const providers = Array.from(this.providers.values())
			.filter((p) => p.capabilities.includes(capability))
			.sort((a, b) => b.priority - a.priority);

		for (const provider of providers) {
			const limiter = this.rateLimiters.get(provider.id);
			if (!limiter?.getStatus(provider.id).isLimited) {
				return provider;
			}
		}

		return providers[0];
	}

	/**
	 * Select the best model for a capability.
	 */
	selectModel(
		provider: AIProviderConfig,
		capability: AICapability,
		constraints?: { maxCost?: number; maxLatency?: number }
	): AIModelConfig | undefined {
		let models = provider.models.filter((m) => m.capabilities.includes(capability));

		if (constraints?.maxCost) {
			models = models.filter((m) => m.costPerInputToken <= constraints.maxCost);
		}

		if (constraints?.maxLatency) {
			models = models.filter((m) => m.latencyMs <= constraints.maxLatency);
		}

		return models.sort((a, b) => {
			const aScore = (1 / a.costPerInputToken) * (1 / a.latencyMs);
			const bScore = (1 / b.costPerInputToken) * (1 / b.latencyMs);
			return bScore - aScore;
		})[0];
	}

	/**
	 * Create a request context.
	 */
	createRequestContext(
		providerId: string,
		modelId: string,
		prompt: string,
		options: {
			systemPrompt?: string;
			parameters?: AIRequestParameters;
			metadata?: Record<string, unknown>;
		} = {}
	): AIRequestContext {
		return {
			requestId: `req-${++this.requestIdCounter}`,
			providerId,
			modelId,
			prompt,
			systemPrompt: options.systemPrompt,
			parameters: options.parameters ?? {},
			metadata: options.metadata ?? {},
		};
	}

	/**
	 * Generate a completion using the coordinator.
	 */
	async complete(
		prompt: string,
		options: {
			capability?: AICapability;
			providerId?: string;
			modelId?: string;
			systemPrompt?: string;
			parameters?: AIRequestParameters;
			useCache?: boolean;
		} = {}
	): Promise<AIResponse> {
		const capability = options.capability ?? 'text-generation';
		const provider = this.selectProvider(capability, options.providerId);

		if (!provider) {
			throw new Error(`No provider available for capability: ${capability}`);
		}

		const model = options.modelId
			? provider.models.find((m) => m.id === options.modelId)
			: this.selectModel(provider, capability);

		if (!model) {
			throw new Error(`No model available for capability: ${capability}`);
		}

		const cacheKey = this.generateCacheKey(prompt, options);
		if (this.cacheEnabled && options.useCache !== false) {
			const cached = this.cache.get(cacheKey);
			if (cached) {
				return { ...cached, cached: true };
			}
		}

		const requestId = `req-${++this.requestIdCounter}`;
		const startTime = Date.now();

		const response = await this.simulateCompletion(
			requestId,
			provider,
			model,
			prompt,
			options
		);

		const latencyMs = Date.now() - startTime;
		const finalResponse: AIResponse = {
			...response,
			latencyMs,
		};

		const limiter = this.rateLimiters.get(provider.id);
		if (limiter) {
			limiter.recordRequest(provider.id, response.usage.totalTokens);
		}

		if (this.cacheEnabled && options.useCache !== false) {
			this.cache.set(cacheKey, finalResponse);
		}

		return finalResponse;
	}

	/**
	 * Simulate completion for demonstration purposes.
	 */
	private async simulateCompletion(
		requestId: string,
		provider: AIProviderConfig,
		model: AIModelConfig,
		prompt: string,
		options: {
			systemPrompt?: string;
			parameters?: AIRequestParameters;
		}
	): Promise<AIResponse> {
		const inputTokens = Math.ceil(prompt.length / 4) + Math.ceil((options.systemPrompt?.length ?? 0) / 4);
		const outputTokens = Math.min(
			options.parameters?.maxTokens ?? 1000,
			Math.ceil(inputTokens * 0.5)
		);

		const usage: AIUsage = {
			inputTokens,
			outputTokens,
			totalTokens: inputTokens + outputTokens,
			cost:
				inputTokens * model.costPerInputToken + outputTokens * model.costPerOutputToken,
		};

		return {
			requestId,
			providerId: provider.id,
			modelId: model.id,
			content: `[Simulated response for: "${prompt.substring(0, 50)}..."]`,
			finishReason: 'stop',
			usage,
			latencyMs: model.latencyMs,
			cached: false,
		};
	}

	/**
	 * Generate a cache key for a request.
	 */
	private generateCacheKey(
		prompt: string,
		options: {
			systemPrompt?: string;
			parameters?: AIRequestParameters;
		}
	): string {
		const key = JSON.stringify({
			prompt,
			systemPrompt: options.systemPrompt,
			parameters: options.parameters,
		});
		return btoa(key).substring(0, 64);
	}

	/**
	 * Get the context manager.
	 */
	getContextManager(): ContextManager {
		return this.contextManager;
	}

	/**
	 * Enable or disable caching.
	 */
	setCacheEnabled(enabled: boolean): void {
		this.cacheEnabled = enabled;
	}

	/**
	 * Clear the cache.
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Get cache statistics.
	 */
	getCacheStats(): { size: number; enabled: boolean } {
		return {
			size: this.cache.size,
			enabled: this.cacheEnabled,
		};
	}
}
