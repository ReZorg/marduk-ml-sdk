/**
 * Marduk Task Management System
 *
 * Provides intelligent task prioritization, scheduling, and execution
 * capabilities with support for complex dependencies and conditional execution.
 */

import type {
	CognitiveEntityId,
	Task,
	TaskStatus,
	TaskPriority,
	TaskPrerequisite,
	TaskExecutor,
	TaskResult,
	RetryPolicy,
	ResourceRequirement,
	Timestamp,
} from '../types';

// ============================================================================
// Task Creation Types
// ============================================================================

/**
 * Options for creating a new task.
 */
export interface CreateTaskOptions {
	name: string;
	description?: string;
	priority?: TaskPriority;
	urgency?: number;
	dependencies?: CognitiveEntityId[];
	prerequisites?: TaskPrerequisite[];
	resources?: ResourceRequirement[];
	deadline?: Timestamp;
	executor: TaskExecutor;
	metadata?: Record<string, unknown>;
}

/**
 * Task execution context.
 */
export interface TaskExecutionContext {
	taskId: CognitiveEntityId;
	startedAt: Timestamp;
	attempt: number;
	abortSignal?: AbortSignal;
	resources: Map<string, number>;
}

/**
 * Task handler function signature.
 */
export type TaskHandler = (
	context: TaskExecutionContext,
	parameters: Record<string, unknown>
) => Promise<unknown>;

// ============================================================================
// Priority Queue Implementation
// ============================================================================

/**
 * Priority queue for task scheduling.
 */
export class TaskPriorityQueue {
	private tasks: Task[] = [];

	/**
	 * Add a task to the queue.
	 */
	enqueue(task: Task): void {
		this.tasks.push(task);
		this.tasks.sort((a, b) => this.compareTaskPriority(b, a));
	}

	/**
	 * Remove and return the highest priority task.
	 */
	dequeue(): Task | undefined {
		return this.tasks.shift();
	}

	/**
	 * Peek at the highest priority task without removing.
	 */
	peek(): Task | undefined {
		return this.tasks[0];
	}

	/**
	 * Remove a specific task from the queue.
	 */
	remove(taskId: CognitiveEntityId): boolean {
		const index = this.tasks.findIndex((t) => t.id === taskId);
		if (index >= 0) {
			this.tasks.splice(index, 1);
			return true;
		}
		return false;
	}

	/**
	 * Get all tasks in priority order.
	 */
	all(): Task[] {
		return [...this.tasks];
	}

	/**
	 * Check if queue is empty.
	 */
	isEmpty(): boolean {
		return this.tasks.length === 0;
	}

	/**
	 * Get queue size.
	 */
	size(): number {
		return this.tasks.length;
	}

	/**
	 * Clear the queue.
	 */
	clear(): void {
		this.tasks = [];
	}

	/**
	 * Compare task priorities for sorting.
	 */
	private compareTaskPriority(a: Task, b: Task): number {
		const priorityOrder: Record<TaskPriority, number> = {
			critical: 5,
			high: 4,
			medium: 3,
			low: 2,
			background: 1,
		};

		const aPriority = priorityOrder[a.priority];
		const bPriority = priorityOrder[b.priority];

		if (aPriority !== bPriority) {
			return aPriority - bPriority;
		}

		if (a.urgency !== b.urgency) {
			return a.urgency - b.urgency;
		}

		if (a.deadline && b.deadline) {
			return b.deadline - a.deadline;
		}

		if (a.deadline) return 1;
		if (b.deadline) return -1;

		return b.createdAt - a.createdAt;
	}
}

// ============================================================================
// Deferred Task Handler
// ============================================================================

/**
 * Handles tasks with prerequisites and conditions.
 */
export class DeferredTaskHandler {
	private deferredTasks: Map<CognitiveEntityId, Task> = new Map();
	private systemState: Map<string, unknown> = new Map();

	/**
	 * Add a deferred task.
	 */
	defer(task: Task): void {
		task.status = 'deferred';
		this.deferredTasks.set(task.id, task);
	}

	/**
	 * Update system state for condition evaluation.
	 */
	updateState(key: string, value: unknown): void {
		this.systemState.set(key, value);
	}

	/**
	 * Check which deferred tasks are now ready.
	 */
	checkReady(completedTaskIds: Set<CognitiveEntityId>): Task[] {
		const readyTasks: Task[] = [];

		for (const task of this.deferredTasks.values()) {
			if (this.arePrerequisitesMet(task, completedTaskIds)) {
				task.status = 'ready';
				readyTasks.push(task);
				this.deferredTasks.delete(task.id);
			}
		}

		return readyTasks;
	}

	/**
	 * Check if all prerequisites for a task are met.
	 */
	private arePrerequisitesMet(
		task: Task,
		completedTaskIds: Set<CognitiveEntityId>
	): boolean {
		for (const dep of task.dependencies) {
			if (!completedTaskIds.has(dep)) {
				return false;
			}
		}

		for (const prereq of task.prerequisites) {
			if (!this.evaluatePrerequisite(prereq, completedTaskIds)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Evaluate a single prerequisite condition.
	 */
	private evaluatePrerequisite(
		prereq: TaskPrerequisite,
		completedTaskIds: Set<CognitiveEntityId>
	): boolean {
		switch (prereq.type) {
			case 'task':
				return completedTaskIds.has(prereq.reference);

			case 'condition': {
				const currentValue = this.systemState.get(prereq.reference);
				return this.evaluateCondition(currentValue, prereq.operator, prereq.value);
			}

			case 'time': {
				const now = Date.now();
				return this.evaluateCondition(now, prereq.operator, prereq.value);
			}

			case 'resource': {
				const resourceValue = this.systemState.get(`resource:${prereq.reference}`);
				return this.evaluateCondition(resourceValue, prereq.operator, prereq.value);
			}

			default:
				return false;
		}
	}

	/**
	 * Evaluate a condition with operator.
	 */
	private evaluateCondition(
		current: unknown,
		operator: TaskPrerequisite['operator'],
		expected: unknown
	): boolean {
		switch (operator) {
			case 'equals':
				return current === expected;
			case 'greater':
				return (current as number) > (expected as number);
			case 'less':
				return (current as number) < (expected as number);
			case 'contains':
				if (Array.isArray(current)) {
					return current.includes(expected);
				}
				if (typeof current === 'string') {
					return current.includes(expected as string);
				}
				return false;
			case 'exists':
				return current !== undefined && current !== null;
			default:
				return false;
		}
	}

	/**
	 * Get all deferred tasks.
	 */
	getDeferred(): Task[] {
		return Array.from(this.deferredTasks.values());
	}

	/**
	 * Get deferred task count.
	 */
	size(): number {
		return this.deferredTasks.size;
	}

	/**
	 * Clear all deferred tasks.
	 */
	clear(): void {
		this.deferredTasks.clear();
	}
}

// ============================================================================
// Task Manager Implementation
// ============================================================================

/**
 * Main task management system.
 */
export class TaskManager {
	private tasks: Map<CognitiveEntityId, Task> = new Map();
	private queue: TaskPriorityQueue = new TaskPriorityQueue();
	private deferred: DeferredTaskHandler = new DeferredTaskHandler();
	private completedTasks: Set<CognitiveEntityId> = new Set();
	private runningTasks: Map<CognitiveEntityId, AbortController> = new Map();
	private handlers: Map<string, TaskHandler> = new Map();
	private taskIdCounter: number = 0;

	/**
	 * Register a task handler.
	 */
	registerHandler(name: string, handler: TaskHandler): void {
		this.handlers.set(name, handler);
	}

	/**
	 * Create a new task.
	 */
	createTask(options: CreateTaskOptions): Task {
		const now = Date.now();
		const id = `task-${++this.taskIdCounter}`;

		const task: Task = {
			id,
			name: options.name,
			description: options.description,
			status: 'pending',
			priority: options.priority ?? 'medium',
			urgency: options.urgency ?? 0.5,
			dependencies: options.dependencies ?? [],
			prerequisites: options.prerequisites ?? [],
			resources: options.resources ?? [],
			createdAt: now,
			deadline: options.deadline,
			executor: options.executor,
			metadata: options.metadata ?? {},
		};

		this.tasks.set(id, task);
		return task;
	}

	/**
	 * Schedule a task for execution.
	 */
	schedule(task: Task): void {
		if (task.dependencies.length > 0 || task.prerequisites.length > 0) {
			const dependenciesMet = task.dependencies.every((dep) =>
				this.completedTasks.has(dep)
			);

			if (!dependenciesMet) {
				this.deferred.defer(task);
				return;
			}
		}

		task.status = 'ready';
		this.queue.enqueue(task);
	}

	/**
	 * Execute the next task in the queue.
	 */
	async executeNext(): Promise<TaskResult | null> {
		const task = this.queue.dequeue();
		if (!task) return null;

		return this.executeTask(task);
	}

	/**
	 * Execute a specific task.
	 */
	async executeTask(task: Task): Promise<TaskResult> {
		const handler = this.handlers.get(task.executor.handler);
		if (!handler) {
			const result: TaskResult = {
				success: false,
				error: `Handler not found: ${task.executor.handler}`,
				duration: 0,
				resourcesUsed: {},
			};
			task.result = result;
			task.status = 'failed';
			return result;
		}

		const abortController = new AbortController();
		this.runningTasks.set(task.id, abortController);

		task.status = 'running';
		task.startedAt = Date.now();

		const context: TaskExecutionContext = {
			taskId: task.id,
			startedAt: task.startedAt,
			attempt: 1,
			abortSignal: abortController.signal,
			resources: new Map(),
		};

		try {
			const output = await this.executeWithRetry(
				handler,
				context,
				task.executor.parameters,
				task.executor.retryPolicy
			);

			const duration = Date.now() - task.startedAt;
			const result: TaskResult = {
				success: true,
				output,
				duration,
				resourcesUsed: Object.fromEntries(context.resources),
			};

			task.result = result;
			task.status = 'completed';
			task.completedAt = Date.now();
			this.completedTasks.add(task.id);

			this.processDeferredTasks();

			return result;
		} catch (error) {
			const duration = Date.now() - task.startedAt;
			const result: TaskResult = {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				duration,
				resourcesUsed: Object.fromEntries(context.resources),
			};

			task.result = result;
			task.status = 'failed';
			task.completedAt = Date.now();

			return result;
		} finally {
			this.runningTasks.delete(task.id);
		}
	}

	/**
	 * Execute handler with retry policy.
	 */
	private async executeWithRetry(
		handler: TaskHandler,
		context: TaskExecutionContext,
		parameters: Record<string, unknown>,
		retryPolicy?: RetryPolicy
	): Promise<unknown> {
		const maxRetries = retryPolicy?.maxRetries ?? 0;
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
			context.attempt = attempt;

			try {
				return await handler(context, parameters);
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				if (attempt <= maxRetries && retryPolicy) {
					const delay = Math.min(
						retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attempt - 1),
						retryPolicy.maxDelay
					);
					await this.sleep(delay);
				}
			}
		}

		throw lastError;
	}

	/**
	 * Process deferred tasks that may now be ready.
	 */
	private processDeferredTasks(): void {
		const readyTasks = this.deferred.checkReady(this.completedTasks);
		for (const task of readyTasks) {
			this.queue.enqueue(task);
		}
	}

	/**
	 * Cancel a task.
	 */
	cancel(taskId: CognitiveEntityId): boolean {
		const task = this.tasks.get(taskId);
		if (!task) return false;

		if (task.status === 'running') {
			const controller = this.runningTasks.get(taskId);
			if (controller) {
				controller.abort();
			}
		}

		task.status = 'cancelled';
		this.queue.remove(taskId);
		return true;
	}

	/**
	 * Get a task by ID.
	 */
	getTask(taskId: CognitiveEntityId): Task | undefined {
		return this.tasks.get(taskId);
	}

	/**
	 * Get tasks by status.
	 */
	getTasksByStatus(status: TaskStatus): Task[] {
		return Array.from(this.tasks.values()).filter((t) => t.status === status);
	}

	/**
	 * Get queue status.
	 */
	getQueueStatus(): {
		pending: number;
		ready: number;
		running: number;
		deferred: number;
		completed: number;
		failed: number;
	} {
		const tasks = Array.from(this.tasks.values());
		return {
			pending: tasks.filter((t) => t.status === 'pending').length,
			ready: this.queue.size(),
			running: this.runningTasks.size,
			deferred: this.deferred.size(),
			completed: tasks.filter((t) => t.status === 'completed').length,
			failed: tasks.filter((t) => t.status === 'failed').length,
		};
	}

	/**
	 * Update deferred task state.
	 */
	updateState(key: string, value: unknown): void {
		this.deferred.updateState(key, value);
		this.processDeferredTasks();
	}

	/**
	 * Clear all tasks.
	 */
	clear(): void {
		for (const controller of this.runningTasks.values()) {
			controller.abort();
		}

		this.tasks.clear();
		this.queue.clear();
		this.deferred.clear();
		this.completedTasks.clear();
		this.runningTasks.clear();
	}

	/**
	 * Sleep utility.
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
