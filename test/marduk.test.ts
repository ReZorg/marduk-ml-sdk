/**
 * Tests for Marduk Cognitive Architecture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	Marduk,
	createMarduk,
	MemorySystem,
	TaskManager,
	AICoordinator,
	AutonomyCoordinator,
	MOSESEngine,
	HypergraphCognitiveNetwork,
	ArchonSystem,
	TruthValueSystem,
	GeneticOperators,
} from '../sdk/src/marduk';
import type { MOSESConfig, MOSESGenome, Gene } from '../sdk/src/marduk';

describe('Marduk Cognitive Architecture', () => {
	describe('Marduk unified system', () => {
		let marduk: Marduk;

		beforeEach(() => {
			marduk = createMarduk();
		});

		it('should create all subsystems', () => {
			expect(marduk.memory).toBeInstanceOf(MemorySystem);
			expect(marduk.tasks).toBeInstanceOf(TaskManager);
			expect(marduk.ai).toBeInstanceOf(AICoordinator);
			expect(marduk.autonomy).toBeInstanceOf(AutonomyCoordinator);
			expect(marduk.cognitive).toBeInstanceOf(HypergraphCognitiveNetwork);
			expect(marduk.archon).toBeInstanceOf(ArchonSystem);
		});

		it('should get health status', async () => {
			const health = await marduk.getHealth();
			expect(health.status).toBeDefined();
			expect(health.checks).toBeDefined();
		});

		it('should reset all subsystems', () => {
			marduk.memory.declarative.storeFact('test-1', 'Test fact');
			expect(marduk.memory.getStatistics().totalItems).toBe(1);

			marduk.reset();
			expect(marduk.memory.getStatistics().totalItems).toBe(0);
		});

		it('should emit and receive events', () => {
			let receivedEvent = false;
			const unsubscribe = marduk.on('test-event', () => {
				receivedEvent = true;
			});

			marduk.emit({
				id: 'evt-1',
				type: 'test-event',
				source: 'test',
				timestamp: Date.now(),
				data: {},
				priority: 'medium',
			});

			expect(receivedEvent).toBe(true);
			unsubscribe();
		});
	});

	describe('Memory System', () => {
		let memory: MemorySystem;

		beforeEach(() => {
			memory = new MemorySystem();
		});

		it('should store and retrieve declarative memories', () => {
			const fact = memory.declarative.storeFact('fact-1', 'The sky is blue');
			expect(fact.id).toBe('fact-1');
			expect(fact.content.fact).toBe('The sky is blue');

			const retrieved = memory.declarative.retrieve('fact-1');
			expect(retrieved).toBeDefined();
			expect(retrieved!.content.fact).toBe('The sky is blue');
		});

		it('should store and retrieve episodic memories', () => {
			const episode = memory.episodic.storeEpisode('ep-1', 'Went to the park', {
				participants: ['Alice', 'Bob'],
				outcome: 'Had fun',
			});

			expect(episode.content.event).toBe('Went to the park');
			expect(episode.content.participants).toContain('Alice');
		});

		it('should store and retrieve procedural memories', () => {
			const procedure = memory.procedural.storeProcedure(
				'proc-1',
				'Make coffee',
				[
					{ order: 1, action: 'Boil water' },
					{ order: 2, action: 'Add coffee grounds' },
					{ order: 3, action: 'Pour water' },
				]
			);

			expect(procedure.content.steps).toHaveLength(3);
		});

		it('should store semantic memories with relationships', () => {
			const dog = memory.semantic.storeConcept('dog-1', 'Dog', 'Animal');
			const mammal = memory.semantic.storeConcept('mammal-1', 'Mammal', 'Animal');

			memory.semantic.addRelationship('dog-1', 'mammal-1', 'is-a', 0.9);

			const related = memory.semantic.findRelated('dog-1', 'is-a');
			expect(related).toHaveLength(1);
			expect(related[0].content.concept).toBe('Mammal');
		});

		it('should search declarative facts', () => {
			memory.declarative.storeFact('fact-1', 'The sky is blue');
			memory.declarative.storeFact('fact-2', 'Water is wet');
			memory.declarative.storeFact('fact-3', 'The sky has clouds');

			const results = memory.declarative.searchFacts('sky');
			expect(results).toHaveLength(2);
		});

		it('should get aggregate statistics', () => {
			memory.declarative.storeFact('f1', 'Fact 1');
			memory.episodic.storeEpisode('e1', 'Episode 1');
			memory.procedural.storeProcedure('p1', 'Procedure 1', []);
			memory.semantic.storeConcept('s1', 'Concept 1', 'Category');

			const stats = memory.getStatistics();
			expect(stats.totalItems).toBe(4);
			expect(stats.byType.declarative).toBe(1);
			expect(stats.byType.episodic).toBe(1);
			expect(stats.byType.procedural).toBe(1);
			expect(stats.byType.semantic).toBe(1);
		});
	});

	describe('Task Management System', () => {
		let tasks: TaskManager;

		beforeEach(() => {
			tasks = new TaskManager();
		});

		it('should create and schedule tasks', () => {
			const task = tasks.createTask({
				name: 'Test Task',
				executor: {
					type: 'function',
					handler: 'test-handler',
					parameters: {},
				},
			});

			expect(task.status).toBe('pending');
			expect(task.name).toBe('Test Task');
		});

		it('should execute tasks with handlers', async () => {
			let executed = false;

			tasks.registerHandler('my-handler', async () => {
				executed = true;
				return 'done';
			});

			const task = tasks.createTask({
				name: 'Executable Task',
				executor: {
					type: 'function',
					handler: 'my-handler',
					parameters: {},
				},
			});

			tasks.schedule(task);
			const result = await tasks.executeNext();

			expect(executed).toBe(true);
			expect(result?.success).toBe(true);
		});

		it('should handle task failures', async () => {
			tasks.registerHandler('failing-handler', async () => {
				throw new Error('Task failed');
			});

			const task = tasks.createTask({
				name: 'Failing Task',
				executor: {
					type: 'function',
					handler: 'failing-handler',
					parameters: {},
				},
			});

			tasks.schedule(task);
			const result = await tasks.executeNext();

			expect(result?.success).toBe(false);
			expect(result?.error).toContain('Task failed');
		});

		it('should cancel running tasks', () => {
			const task = tasks.createTask({
				name: 'Cancellable Task',
				executor: {
					type: 'function',
					handler: 'handler',
					parameters: {},
				},
			});

			tasks.schedule(task);
			const cancelled = tasks.cancel(task.id);

			expect(cancelled).toBe(true);
			expect(tasks.getTask(task.id)?.status).toBe('cancelled');
		});
	});

	describe('AI Coordination System', () => {
		let ai: AICoordinator;

		beforeEach(() => {
			ai = new AICoordinator();
		});

		it('should register providers', () => {
			ai.registerProvider({
				id: 'test-provider',
				type: 'openai',
				name: 'Test Provider',
				endpoint: 'https://api.test.com',
				models: [
					{
						id: 'test-model',
						name: 'Test Model',
						contextWindow: 8192,
						maxOutputTokens: 4096,
						capabilities: ['text-generation'],
						costPerInputToken: 0.001,
						costPerOutputToken: 0.002,
						latencyMs: 100,
					},
				],
				capabilities: ['text-generation'],
				rateLimits: {
					requestsPerMinute: 60,
					tokensPerMinute: 100000,
					concurrentRequests: 10,
				},
				priority: 1,
			});

			const provider = ai.getProvider('test-provider');
			expect(provider).toBeDefined();
			expect(provider!.name).toBe('Test Provider');
		});

		it('should manage conversation contexts', () => {
			const contextManager = ai.getContextManager();
			const context = contextManager.create({
				systemPrompt: 'You are a helpful assistant',
				maxTokens: 4096,
			});

			expect(context.messages).toHaveLength(1);
			expect(context.messages[0].role).toBe('system');

			contextManager.addMessage(context.id, {
				role: 'user',
				content: 'Hello!',
			});

			expect(context.messages).toHaveLength(2);
		});

		it('should manage cache', () => {
			expect(ai.getCacheStats().enabled).toBe(true);

			ai.setCacheEnabled(false);
			expect(ai.getCacheStats().enabled).toBe(false);

			ai.clearCache();
			expect(ai.getCacheStats().size).toBe(0);
		});
	});

	describe('Autonomy System', () => {
		let autonomy: AutonomyCoordinator;

		beforeEach(() => {
			autonomy = new AutonomyCoordinator();
		});

		it('should collect metrics', () => {
			const metrics = {
				timestamp: Date.now(),
				memory: {
					totalItems: 100,
					itemsByType: { declarative: 25, episodic: 25, procedural: 25, semantic: 25 },
					averageAccessFrequency: 0.5,
					cacheHitRate: 0.8,
					compressionRatio: 0.3,
				},
				task: {
					pendingTasks: 10,
					runningTasks: 5,
					completedTasks: 100,
					failedTasks: 2,
					averageExecutionTime: 150,
					queueDepth: 15,
				},
				ai: {
					totalRequests: 500,
					successRate: 0.98,
					averageLatency: 200,
					tokenUsage: 50000,
					cost: 5.0,
					cacheHitRate: 0.4,
				},
				performance: {
					cpuUsage: 0.6,
					memoryUsage: 0.7,
					networkLatency: 50,
					throughput: 100,
					errorRate: 0.02,
				},
			};

			autonomy.recordMetrics(metrics);
			const status = autonomy.getStatus();

			expect(status.latestMetrics).toBeDefined();
			expect(status.latestMetrics!.memory.totalItems).toBe(100);
		});

		it('should generate optimization suggestions', () => {
			const metrics = {
				timestamp: Date.now(),
				memory: {
					totalItems: 100,
					itemsByType: { declarative: 25, episodic: 25, procedural: 25, semantic: 25 },
					averageAccessFrequency: 0.5,
					cacheHitRate: 0.3,
					compressionRatio: 0.1,
				},
				task: {
					pendingTasks: 10,
					runningTasks: 5,
					completedTasks: 100,
					failedTasks: 20,
					averageExecutionTime: 150,
					queueDepth: 200,
				},
				ai: {
					totalRequests: 500,
					successRate: 0.98,
					averageLatency: 3000,
					tokenUsage: 50000,
					cost: 5.0,
					cacheHitRate: 0.1,
				},
				performance: {
					cpuUsage: 0.9,
					memoryUsage: 0.95,
					networkLatency: 50,
					throughput: 100,
					errorRate: 0.1,
				},
			};

			autonomy.recordMetrics(metrics);
			const suggestions = autonomy.analyze();

			expect(suggestions.length).toBeGreaterThan(0);
		});
	});

	describe('MOSES Evolution System', () => {
		let moses: MOSESEngine;

		const createTestConfig = (): MOSESConfig => ({
			populationSize: 20,
			generations: 10,
			mutationRate: 0.1,
			crossoverRate: 0.7,
			eliteRatio: 0.1,
			tournamentSize: 3,
			objectives: [
				{ name: 'fitness', value: 0, weight: 1, direction: 'maximize' },
			],
			terminationCriteria: { maxGenerations: 10 },
		});

		const createTestGenome = (): MOSESGenome => ({
			genes: [
				{ id: 'g1', type: 'constant', value: Math.random(), weight: 1, mutable: true },
				{ id: 'g2', type: 'constant', value: Math.random(), weight: 1, mutable: true },
				{ id: 'g3', type: 'constant', value: Math.random(), weight: 1, mutable: true },
			],
			structure: {
				root: 'S',
				rules: [],
				terminals: [],
				nonterminals: [],
			},
			size: 3,
			complexity: 1.5,
		});

		const testEvaluationFn = (genome: MOSESGenome): Map<string, number> => {
			const sum = genome.genes.reduce((acc, g) => acc + (typeof g.value === 'number' ? g.value : 0), 0);
			return new Map([['fitness', sum]]);
		};

		beforeEach(() => {
			moses = new MOSESEngine(createTestConfig());
		});

		it('should initialize population', () => {
			moses.initialize(createTestGenome, testEvaluationFn);
			const population = moses.getPopulation();

			expect(population.length).toBe(20);
		});

		it('should evolve one generation', () => {
			moses.initialize(createTestGenome, testEvaluationFn);
			const stats = moses.evolveGeneration(testEvaluationFn);

			expect(stats.generation).toBe(1);
			expect(stats.bestFitness).toBeGreaterThanOrEqual(0);
		});

		it('should get best individual', () => {
			moses.initialize(createTestGenome, testEvaluationFn);
			moses.evolveGeneration(testEvaluationFn);

			const best = moses.getBest();
			expect(best).toBeDefined();
			expect(best!.fitness.overall).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Genetic Operators', () => {
		const createGene = (value: number): Gene => ({
			id: `g-${value}`,
			type: 'constant',
			value,
			weight: 0.1,
			mutable: true,
		});

		const createGenome = (values: number[]): MOSESGenome => ({
			genes: values.map(createGene),
			structure: { root: 'S', rules: [], terminals: [], nonterminals: [] },
			size: values.length,
			complexity: values.length * 0.5,
		});

		it('should mutate genome', () => {
			const genome = createGenome([1, 2, 3]);
			const mutated = GeneticOperators.mutate(genome, 1.0, 'gaussian');

			const changed = genome.genes.some((g, i) => g.value !== mutated.genes[i].value);
			expect(changed).toBe(true);
		});

		it('should perform crossover', () => {
			const parent1 = createGenome([1, 2, 3, 4, 5]);
			const parent2 = createGenome([10, 20, 30, 40, 50]);

			const [child1, child2] = GeneticOperators.crossover(parent1, parent2, 'uniform');

			expect(child1.genes.length).toBe(5);
			expect(child2.genes.length).toBe(5);
		});
	});

	describe('Neural-Symbolic Integration', () => {
		let cognitive: HypergraphCognitiveNetwork;

		beforeEach(() => {
			cognitive = new HypergraphCognitiveNetwork(64);
		});

		it('should add nodes to the hypergraph', () => {
			const node = cognitive.addNode('concept', 'Machine Learning');

			expect(node.id).toBeDefined();
			expect(node.type).toBe('concept');
			expect(node.embedding.length).toBe(64);
		});

		it('should add edges between nodes', () => {
			const ml = cognitive.addNode('concept', 'Machine Learning');
			const ai = cognitive.addNode('concept', 'Artificial Intelligence');

			const edge = cognitive.addEdge('hierarchical', [ml.id, ai.id], {
				weight: 0.9,
			});

			expect(edge.nodes).toContain(ml.id);
			expect(edge.nodes).toContain(ai.id);
		});

		it('should find connected nodes', () => {
			const ml = cognitive.addNode('concept', 'Machine Learning');
			const dl = cognitive.addNode('concept', 'Deep Learning');
			const nn = cognitive.addNode('concept', 'Neural Networks');

			cognitive.addEdge('semantic', [ml.id, dl.id]);
			cognitive.addEdge('semantic', [dl.id, nn.id]);

			const connected = cognitive.getConnectedNodes(ml.id);
			expect(connected.length).toBeGreaterThan(0);
		});

		it('should perform pattern search', () => {
			cognitive.addNode('concept', 'Machine Learning');
			cognitive.addNode('concept', 'Deep Learning');
			cognitive.addNode('concept', 'Neural Networks');

			const results = cognitive.findByPattern('Learning', 5);
			expect(results.length).toBeGreaterThan(0);
		});

		it('should get network statistics', () => {
			cognitive.addNode('concept', 'Test 1');
			cognitive.addNode('memory', 'Test 2');

			const stats = cognitive.getStatistics();
			expect(stats.nodeCount).toBe(2);
		});
	});

	describe('Truth Value System', () => {
		it('should create valid truth values', () => {
			const tv = TruthValueSystem.create(0.8, 0.9);
			expect(tv.strength).toBe(0.8);
			expect(tv.confidence).toBe(0.9);
		});

		it('should clamp values to [0, 1]', () => {
			const tv = TruthValueSystem.create(1.5, -0.5);
			expect(tv.strength).toBe(1);
			expect(tv.confidence).toBe(0);
		});

		it('should perform AND operation', () => {
			const tv1 = TruthValueSystem.create(0.8, 0.9);
			const tv2 = TruthValueSystem.create(0.7, 0.8);

			const result = TruthValueSystem.and(tv1, tv2);
			expect(result.strength).toBeCloseTo(0.56);
			expect(result.confidence).toBe(0.8);
		});

		it('should perform OR operation', () => {
			const tv1 = TruthValueSystem.create(0.8, 0.9);
			const tv2 = TruthValueSystem.create(0.7, 0.8);

			const result = TruthValueSystem.or(tv1, tv2);
			expect(result.strength).toBeCloseTo(0.94);
		});

		it('should perform NOT operation', () => {
			const tv = TruthValueSystem.create(0.8, 0.9);
			const result = TruthValueSystem.not(tv);

			expect(result.strength).toBeCloseTo(0.2);
			expect(result.confidence).toBe(0.9);
		});
	});

	describe('Archon Agent Builder', () => {
		let archon: ArchonSystem;

		beforeEach(() => {
			archon = new ArchonSystem();
		});

		it('should create agents from blueprints', () => {
			const agent = archon.createAgent({
				name: 'Test Agent',
				description: 'A test agent',
				capabilities: ['search', 'analysis'],
				tools: ['web_search', 'read_file'],
			});

			expect(agent.name).toBe('Test Agent');
			expect(agent.capabilities.length).toBe(2);
			expect(agent.tools.length).toBe(2);
		});

		it('should create agents from templates', () => {
			const agent = archon.createFromTemplate('research-assistant');

			expect(agent).toBeDefined();
			expect(agent!.name).toBe('Research Assistant');
		});

		it('should recommend tools for use cases', () => {
			const tools = archon.recommendTools('search');
			expect(tools.length).toBeGreaterThan(0);
		});

		it('should recommend templates for use cases', () => {
			const templates = archon.recommendTemplates('research');
			expect(templates.length).toBeGreaterThan(0);
		});

		it('should refine agents', () => {
			const agent = archon.createAgent({
				name: 'Refinable Agent',
				description: 'An agent to refine',
				capabilities: [],
				tools: [],
			});

			const refined = archon.refineAgent({
				agentId: agent.id,
				aspect: 'prompt',
				feedback: 'Be more helpful',
			});

			expect(refined).toBeDefined();
			expect(refined!.systemPrompt).toContain('Be more helpful');
			expect(refined!.version).not.toBe(agent.version);
		});

		it('should update agent metrics', () => {
			const agent = archon.createAgent({
				name: 'Metrics Agent',
				description: 'An agent with metrics',
				capabilities: [],
				tools: [],
			});

			archon.updateMetrics(agent.id, {
				success: true,
				duration: 100,
				tokensUsed: 500,
				toolCalls: 3,
			});

			const updated = archon.getAgent(agent.id);
			expect(updated!.metrics.totalExecutions).toBe(1);
			expect(updated!.metrics.tokensUsed).toBe(500);
		});
	});
});
