/**
 * Marduk Autonomy System
 *
 * Implements continuous self-analysis, optimization, and adaptive control
 * mechanisms that enable the system to improve its own performance over time.
 */

import type {
	SystemMetrics,
	MemoryMetrics,
	TaskMetrics,
	AIMetrics,
	PerformanceMetrics,
	OptimizationTarget,
	OptimizationSuggestion,
	OptimizationImpact,
	HealthStatus,
	Timestamp,
} from '../types';

// ============================================================================
// Metrics Collection
// ============================================================================

/**
 * Metrics collector for system monitoring.
 */
export class MetricsCollector {
	private history: SystemMetrics[] = [];
	private maxHistorySize: number = 1000;
	private collectionInterval: number | null = null;

	/**
	 * Record current system metrics.
	 */
	record(metrics: SystemMetrics): void {
		this.history.push(metrics);
		if (this.history.length > this.maxHistorySize) {
			this.history.shift();
		}
	}

	/**
	 * Create a metrics snapshot.
	 */
	createSnapshot(
		memory: MemoryMetrics,
		task: TaskMetrics,
		ai: AIMetrics,
		performance: PerformanceMetrics
	): SystemMetrics {
		return {
			timestamp: Date.now(),
			memory,
			task,
			ai,
			performance,
		};
	}

	/**
	 * Get the latest metrics.
	 */
	getLatest(): SystemMetrics | undefined {
		return this.history[this.history.length - 1];
	}

	/**
	 * Get metrics history.
	 */
	getHistory(since?: Timestamp, limit?: number): SystemMetrics[] {
		let result = this.history;

		if (since !== undefined) {
			result = result.filter((m) => m.timestamp >= since);
		}

		if (limit !== undefined) {
			result = result.slice(-limit);
		}

		return result;
	}

	/**
	 * Calculate metric averages over a time period.
	 */
	calculateAverages(since: Timestamp): {
		memory: Partial<MemoryMetrics>;
		task: Partial<TaskMetrics>;
		ai: Partial<AIMetrics>;
		performance: Partial<PerformanceMetrics>;
	} {
		const relevant = this.history.filter((m) => m.timestamp >= since);
		if (relevant.length === 0) {
			return { memory: {}, task: {}, ai: {}, performance: {} };
		}

		return {
			memory: {
				totalItems: this.avg(relevant.map((m) => m.memory.totalItems)),
				averageAccessFrequency: this.avg(relevant.map((m) => m.memory.averageAccessFrequency)),
				cacheHitRate: this.avg(relevant.map((m) => m.memory.cacheHitRate)),
			},
			task: {
				pendingTasks: this.avg(relevant.map((m) => m.task.pendingTasks)),
				runningTasks: this.avg(relevant.map((m) => m.task.runningTasks)),
				averageExecutionTime: this.avg(relevant.map((m) => m.task.averageExecutionTime)),
			},
			ai: {
				totalRequests: this.sum(relevant.map((m) => m.ai.totalRequests)),
				successRate: this.avg(relevant.map((m) => m.ai.successRate)),
				averageLatency: this.avg(relevant.map((m) => m.ai.averageLatency)),
				cacheHitRate: this.avg(relevant.map((m) => m.ai.cacheHitRate)),
			},
			performance: {
				cpuUsage: this.avg(relevant.map((m) => m.performance.cpuUsage)),
				memoryUsage: this.avg(relevant.map((m) => m.performance.memoryUsage)),
				throughput: this.avg(relevant.map((m) => m.performance.throughput)),
				errorRate: this.avg(relevant.map((m) => m.performance.errorRate)),
			},
		};
	}

	/**
	 * Clear history.
	 */
	clear(): void {
		this.history = [];
	}

	private avg(values: number[]): number {
		if (values.length === 0) return 0;
		return values.reduce((a, b) => a + b, 0) / values.length;
	}

	private sum(values: number[]): number {
		return values.reduce((a, b) => a + b, 0);
	}
}

// ============================================================================
// Health Monitor
// ============================================================================

/**
 * Health check result.
 */
export interface HealthCheck {
	name: string;
	status: HealthStatus;
	message?: string;
	lastChecked: Timestamp;
	duration: number;
}

/**
 * Health monitor for system components.
 */
export class HealthMonitor {
	private checks: Map<string, () => Promise<HealthCheck>> = new Map();
	private results: Map<string, HealthCheck> = new Map();
	private checkInterval: number | null = null;

	/**
	 * Register a health check.
	 */
	registerCheck(name: string, check: () => Promise<HealthCheck>): void {
		this.checks.set(name, check);
	}

	/**
	 * Run all health checks.
	 */
	async runAllChecks(): Promise<Map<string, HealthCheck>> {
		const results = new Map<string, HealthCheck>();

		for (const [name, checkFn] of this.checks) {
			const startTime = Date.now();
			try {
				const result = await checkFn();
				result.duration = Date.now() - startTime;
				results.set(name, result);
				this.results.set(name, result);
			} catch (error) {
				const errorResult: HealthCheck = {
					name,
					status: 'critical',
					message: error instanceof Error ? error.message : String(error),
					lastChecked: Date.now(),
					duration: Date.now() - startTime,
				};
				results.set(name, errorResult);
				this.results.set(name, errorResult);
			}
		}

		return results;
	}

	/**
	 * Get overall system health.
	 */
	getOverallHealth(): HealthStatus {
		const results = Array.from(this.results.values());
		if (results.length === 0) return 'unknown';

		if (results.some((r) => r.status === 'critical')) return 'critical';
		if (results.some((r) => r.status === 'degraded')) return 'degraded';
		return 'healthy';
	}

	/**
	 * Get all health check results.
	 */
	getResults(): Map<string, HealthCheck> {
		return new Map(this.results);
	}

	/**
	 * Clear registered checks.
	 */
	clear(): void {
		this.checks.clear();
		this.results.clear();
	}
}

// ============================================================================
// Optimization Engine
// ============================================================================

/**
 * Optimization analyzer for generating suggestions.
 */
export class OptimizationAnalyzer {
	private targets: OptimizationTarget[] = [];
	private suggestionIdCounter: number = 0;

	/**
	 * Set optimization targets.
	 */
	setTargets(targets: OptimizationTarget[]): void {
		this.targets = targets;
	}

	/**
	 * Add an optimization target.
	 */
	addTarget(target: OptimizationTarget): void {
		this.targets.push(target);
	}

	/**
	 * Analyze metrics and generate optimization suggestions.
	 */
	analyze(metrics: SystemMetrics): OptimizationSuggestion[] {
		const suggestions: OptimizationSuggestion[] = [];

		suggestions.push(...this.analyzeMemory(metrics.memory));
		suggestions.push(...this.analyzeTask(metrics.task));
		suggestions.push(...this.analyzeAI(metrics.ai));
		suggestions.push(...this.analyzePerformance(metrics.performance));

		return suggestions;
	}

	/**
	 * Analyze memory metrics.
	 */
	private analyzeMemory(metrics: MemoryMetrics): OptimizationSuggestion[] {
		const suggestions: OptimizationSuggestion[] = [];

		if (metrics.cacheHitRate < 0.5) {
			suggestions.push(this.createSuggestion({
				subsystem: 'memory',
				type: 'configuration',
				description: 'Increase cache size to improve hit rate',
				impact: {
					metric: 'cacheHitRate',
					currentValue: metrics.cacheHitRate,
					expectedValue: Math.min(0.8, metrics.cacheHitRate * 1.5),
					confidence: 0.7,
				},
				risk: 'low',
				autoApply: true,
				parameters: { cacheMultiplier: 1.5 },
			}));
		}

		if (metrics.compressionRatio < 0.3) {
			suggestions.push(this.createSuggestion({
				subsystem: 'memory',
				type: 'algorithm',
				description: 'Enable more aggressive memory compression',
				impact: {
					metric: 'compressionRatio',
					currentValue: metrics.compressionRatio,
					expectedValue: 0.5,
					confidence: 0.6,
				},
				risk: 'medium',
				autoApply: false,
				parameters: { compressionLevel: 'aggressive' },
			}));
		}

		return suggestions;
	}

	/**
	 * Analyze task metrics.
	 */
	private analyzeTask(metrics: TaskMetrics): OptimizationSuggestion[] {
		const suggestions: OptimizationSuggestion[] = [];

		if (metrics.queueDepth > 100) {
			suggestions.push(this.createSuggestion({
				subsystem: 'task',
				type: 'resource',
				description: 'Increase concurrent task execution capacity',
				impact: {
					metric: 'queueDepth',
					currentValue: metrics.queueDepth,
					expectedValue: metrics.queueDepth * 0.5,
					confidence: 0.8,
				},
				risk: 'medium',
				autoApply: false,
				parameters: { concurrencyIncrease: 2 },
			}));
		}

		if (metrics.failedTasks > metrics.completedTasks * 0.1) {
			suggestions.push(this.createSuggestion({
				subsystem: 'task',
				type: 'configuration',
				description: 'Increase task retry attempts and backoff',
				impact: {
					metric: 'failureRate',
					currentValue: metrics.failedTasks / (metrics.completedTasks + metrics.failedTasks),
					expectedValue: 0.05,
					confidence: 0.6,
				},
				risk: 'low',
				autoApply: true,
				parameters: { maxRetries: 5, backoffMultiplier: 2 },
			}));
		}

		return suggestions;
	}

	/**
	 * Analyze AI metrics.
	 */
	private analyzeAI(metrics: AIMetrics): OptimizationSuggestion[] {
		const suggestions: OptimizationSuggestion[] = [];

		if (metrics.cacheHitRate < 0.3) {
			suggestions.push(this.createSuggestion({
				subsystem: 'ai',
				type: 'configuration',
				description: 'Enable semantic caching for similar prompts',
				impact: {
					metric: 'cacheHitRate',
					currentValue: metrics.cacheHitRate,
					expectedValue: 0.5,
					confidence: 0.7,
				},
				risk: 'low',
				autoApply: true,
				parameters: { semanticCaching: true, similarityThreshold: 0.9 },
			}));
		}

		if (metrics.averageLatency > 2000) {
			suggestions.push(this.createSuggestion({
				subsystem: 'ai',
				type: 'resource',
				description: 'Switch to lower-latency AI provider or model',
				impact: {
					metric: 'averageLatency',
					currentValue: metrics.averageLatency,
					expectedValue: metrics.averageLatency * 0.5,
					confidence: 0.8,
				},
				risk: 'medium',
				autoApply: false,
				parameters: { preferLowLatency: true },
			}));
		}

		return suggestions;
	}

	/**
	 * Analyze performance metrics.
	 */
	private analyzePerformance(metrics: PerformanceMetrics): OptimizationSuggestion[] {
		const suggestions: OptimizationSuggestion[] = [];

		if (metrics.cpuUsage > 0.8) {
			suggestions.push(this.createSuggestion({
				subsystem: 'autonomy',
				type: 'resource',
				description: 'Reduce background task frequency to lower CPU usage',
				impact: {
					metric: 'cpuUsage',
					currentValue: metrics.cpuUsage,
					expectedValue: 0.6,
					confidence: 0.7,
				},
				risk: 'medium',
				autoApply: false,
				parameters: { taskFrequencyMultiplier: 0.5 },
			}));
		}

		if (metrics.memoryUsage > 0.85) {
			suggestions.push(this.createSuggestion({
				subsystem: 'memory',
				type: 'algorithm',
				description: 'Trigger memory garbage collection and pruning',
				impact: {
					metric: 'memoryUsage',
					currentValue: metrics.memoryUsage,
					expectedValue: 0.6,
					confidence: 0.8,
				},
				risk: 'low',
				autoApply: true,
				parameters: { pruneThreshold: 0.3, decayMultiplier: 2 },
			}));
		}

		if (metrics.errorRate > 0.05) {
			suggestions.push(this.createSuggestion({
				subsystem: 'autonomy',
				type: 'architecture',
				description: 'Enable circuit breaker for failing components',
				impact: {
					metric: 'errorRate',
					currentValue: metrics.errorRate,
					expectedValue: 0.01,
					confidence: 0.6,
				},
				risk: 'medium',
				autoApply: false,
				parameters: { circuitBreakerThreshold: 5, resetTimeout: 30000 },
			}));
		}

		return suggestions;
	}

	/**
	 * Create an optimization suggestion.
	 */
	private createSuggestion(
		data: Omit<OptimizationSuggestion, 'id'>
	): OptimizationSuggestion {
		return {
			id: `opt-${++this.suggestionIdCounter}`,
			...data,
		};
	}
}

// ============================================================================
// Autonomy Coordinator
// ============================================================================

/**
 * Main autonomy coordinator managing self-optimization.
 */
export class AutonomyCoordinator {
	private metricsCollector: MetricsCollector;
	private healthMonitor: HealthMonitor;
	private optimizer: OptimizationAnalyzer;
	private appliedSuggestions: Set<string> = new Set();
	private isRunning: boolean = false;

	constructor() {
		this.metricsCollector = new MetricsCollector();
		this.healthMonitor = new HealthMonitor();
		this.optimizer = new OptimizationAnalyzer();
	}

	/**
	 * Get the metrics collector.
	 */
	getMetricsCollector(): MetricsCollector {
		return this.metricsCollector;
	}

	/**
	 * Get the health monitor.
	 */
	getHealthMonitor(): HealthMonitor {
		return this.healthMonitor;
	}

	/**
	 * Get the optimization analyzer.
	 */
	getOptimizer(): OptimizationAnalyzer {
		return this.optimizer;
	}

	/**
	 * Record system metrics.
	 */
	recordMetrics(metrics: SystemMetrics): void {
		this.metricsCollector.record(metrics);
	}

	/**
	 * Run health checks.
	 */
	async checkHealth(): Promise<HealthStatus> {
		await this.healthMonitor.runAllChecks();
		return this.healthMonitor.getOverallHealth();
	}

	/**
	 * Analyze and get optimization suggestions.
	 */
	analyze(): OptimizationSuggestion[] {
		const latest = this.metricsCollector.getLatest();
		if (!latest) return [];
		return this.optimizer.analyze(latest);
	}

	/**
	 * Apply an optimization suggestion.
	 */
	applySuggestion(suggestion: OptimizationSuggestion): boolean {
		if (this.appliedSuggestions.has(suggestion.id)) {
			return false;
		}

		this.appliedSuggestions.add(suggestion.id);
		return true;
	}

	/**
	 * Get applied suggestions.
	 */
	getAppliedSuggestions(): Set<string> {
		return new Set(this.appliedSuggestions);
	}

	/**
	 * Get system status summary.
	 */
	getStatus(): {
		health: HealthStatus;
		latestMetrics?: SystemMetrics;
		pendingSuggestions: number;
		appliedSuggestions: number;
	} {
		const suggestions = this.analyze();
		const pendingSuggestions = suggestions.filter(
			(s) => !this.appliedSuggestions.has(s.id)
		).length;

		return {
			health: this.healthMonitor.getOverallHealth(),
			latestMetrics: this.metricsCollector.getLatest(),
			pendingSuggestions,
			appliedSuggestions: this.appliedSuggestions.size,
		};
	}

	/**
	 * Clear all state.
	 */
	clear(): void {
		this.metricsCollector.clear();
		this.healthMonitor.clear();
		this.appliedSuggestions.clear();
	}
}
