/**
 * MOSES (Meta-Optimizing Semantic Evolutionary Search)
 *
 * Implements sophisticated evolutionary algorithms for optimizing
 * agentic grammar modules with comprehensive transparency and
 * emergent insight generation.
 */

import type {
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
	Timestamp,
} from '../types';

// ============================================================================
// Genetic Operators
// ============================================================================

/**
 * Mutation strategy types.
 */
export type MutationStrategy = 'gaussian' | 'uniform' | 'cauchy';

/**
 * Crossover strategy types.
 */
export type CrossoverStrategy = 'single-point' | 'two-point' | 'uniform';

/**
 * Selection strategy types.
 */
export type SelectionStrategy = 'tournament' | 'roulette' | 'rank' | 'elite';

/**
 * Genetic operators for evolution.
 */
export class GeneticOperators {
	/**
	 * Apply mutation to a genome.
	 */
	static mutate(
		genome: MOSESGenome,
		mutationRate: number,
		strategy: MutationStrategy = 'gaussian'
	): MOSESGenome {
		const mutatedGenes = genome.genes.map((gene) => {
			if (!gene.mutable || Math.random() > mutationRate) {
				return gene;
			}

			return this.mutateGene(gene, strategy);
		});

		return {
			...genome,
			genes: mutatedGenes,
			complexity: this.calculateComplexity(mutatedGenes),
		};
	}

	/**
	 * Mutate a single gene.
	 */
	private static mutateGene(gene: Gene, strategy: MutationStrategy): Gene {
		const newGene = { ...gene };

		if (typeof gene.value === 'number') {
			switch (strategy) {
				case 'gaussian':
					newGene.value = gene.value + this.gaussianRandom() * gene.weight;
					break;
				case 'uniform':
					newGene.value = gene.value + (Math.random() - 0.5) * 2 * gene.weight;
					break;
				case 'cauchy':
					newGene.value = gene.value + this.cauchyRandom() * gene.weight;
					break;
			}
		} else if (typeof gene.value === 'boolean') {
			newGene.value = !gene.value;
		} else if (typeof gene.value === 'string') {
			const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
			const index = Math.floor(Math.random() * gene.value.length);
			const newChar = chars[Math.floor(Math.random() * chars.length)];
			newGene.value = gene.value.slice(0, index) + newChar + gene.value.slice(index + 1);
		}

		return newGene;
	}

	/**
	 * Perform crossover between two genomes.
	 */
	static crossover(
		parent1: MOSESGenome,
		parent2: MOSESGenome,
		strategy: CrossoverStrategy = 'uniform'
	): [MOSESGenome, MOSESGenome] {
		const minLength = Math.min(parent1.genes.length, parent2.genes.length);

		switch (strategy) {
			case 'single-point': {
				const point = Math.floor(Math.random() * minLength);
				return this.singlePointCrossover(parent1, parent2, point);
			}
			case 'two-point': {
				const point1 = Math.floor(Math.random() * minLength);
				const point2 = Math.floor(Math.random() * minLength);
				return this.twoPointCrossover(parent1, parent2, Math.min(point1, point2), Math.max(point1, point2));
			}
			case 'uniform':
			default:
				return this.uniformCrossover(parent1, parent2);
		}
	}

	private static singlePointCrossover(
		p1: MOSESGenome,
		p2: MOSESGenome,
		point: number
	): [MOSESGenome, MOSESGenome] {
		const child1Genes = [...p1.genes.slice(0, point), ...p2.genes.slice(point)];
		const child2Genes = [...p2.genes.slice(0, point), ...p1.genes.slice(point)];

		return [
			{ ...p1, genes: child1Genes, complexity: this.calculateComplexity(child1Genes) },
			{ ...p2, genes: child2Genes, complexity: this.calculateComplexity(child2Genes) },
		];
	}

	private static twoPointCrossover(
		p1: MOSESGenome,
		p2: MOSESGenome,
		point1: number,
		point2: number
	): [MOSESGenome, MOSESGenome] {
		const child1Genes = [
			...p1.genes.slice(0, point1),
			...p2.genes.slice(point1, point2),
			...p1.genes.slice(point2),
		];
		const child2Genes = [
			...p2.genes.slice(0, point1),
			...p1.genes.slice(point1, point2),
			...p2.genes.slice(point2),
		];

		return [
			{ ...p1, genes: child1Genes, complexity: this.calculateComplexity(child1Genes) },
			{ ...p2, genes: child2Genes, complexity: this.calculateComplexity(child2Genes) },
		];
	}

	private static uniformCrossover(
		p1: MOSESGenome,
		p2: MOSESGenome
	): [MOSESGenome, MOSESGenome] {
		const child1Genes: Gene[] = [];
		const child2Genes: Gene[] = [];

		const maxLength = Math.max(p1.genes.length, p2.genes.length);
		for (let i = 0; i < maxLength; i++) {
			const gene1 = p1.genes[i] ?? p2.genes[i];
			const gene2 = p2.genes[i] ?? p1.genes[i];

			if (Math.random() < 0.5) {
				child1Genes.push(gene1);
				child2Genes.push(gene2);
			} else {
				child1Genes.push(gene2);
				child2Genes.push(gene1);
			}
		}

		return [
			{ ...p1, genes: child1Genes, complexity: this.calculateComplexity(child1Genes) },
			{ ...p2, genes: child2Genes, complexity: this.calculateComplexity(child2Genes) },
		];
	}

	/**
	 * Calculate genome complexity.
	 */
	static calculateComplexity(genes: Gene[]): number {
		let complexity = 0;
		for (const gene of genes) {
			switch (gene.type) {
				case 'terminal':
					complexity += 1;
					break;
				case 'nonterminal':
					complexity += 2;
					break;
				case 'function':
					complexity += 3;
					break;
				case 'constant':
					complexity += 0.5;
					break;
			}
		}
		return complexity;
	}

	/**
	 * Generate Gaussian random number.
	 */
	private static gaussianRandom(): number {
		let u = 0, v = 0;
		while (u === 0) u = Math.random();
		while (v === 0) v = Math.random();
		return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	}

	/**
	 * Generate Cauchy random number.
	 */
	private static cauchyRandom(): number {
		return Math.tan(Math.PI * (Math.random() - 0.5));
	}
}

// ============================================================================
// Fitness Evaluation
// ============================================================================

/**
 * Fitness evaluator for multi-objective optimization.
 */
export class FitnessEvaluator {
	constructor(private objectives: FitnessObjective[]) {}

	/**
	 * Evaluate fitness for an individual.
	 */
	evaluate(genome: MOSESGenome, evaluationFn: (genome: MOSESGenome) => Map<string, number>): MOSESFitness {
		const values = evaluationFn(genome);
		const objectives: FitnessObjective[] = [];

		let weightedSum = 0;
		let totalWeight = 0;

		for (const objective of this.objectives) {
			const value = values.get(objective.name) ?? 0;
			const normalizedValue = objective.direction === 'maximize' ? value : -value;

			objectives.push({
				...objective,
				value,
			});

			weightedSum += normalizedValue * objective.weight;
			totalWeight += objective.weight;
		}

		const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;

		return {
			overall,
			objectives,
			normalized: overall,
			rank: 0,
			crowdingDistance: 0,
		};
	}

	/**
	 * Perform non-dominated sorting for Pareto ranking.
	 */
	nonDominatedSort(individuals: MOSESIndividual[]): MOSESIndividual[][] {
		const fronts: MOSESIndividual[][] = [];
		const dominatedBy: Map<string, Set<string>> = new Map();
		const dominationCount: Map<string, number> = new Map();

		for (const p of individuals) {
			dominatedBy.set(p.id, new Set());
			dominationCount.set(p.id, 0);
		}

		for (const p of individuals) {
			for (const q of individuals) {
				if (p.id === q.id) continue;

				if (this.dominates(p.fitness, q.fitness)) {
					dominatedBy.get(p.id)!.add(q.id);
				} else if (this.dominates(q.fitness, p.fitness)) {
					dominationCount.set(p.id, dominationCount.get(p.id)! + 1);
				}
			}
		}

		let currentFront: MOSESIndividual[] = [];
		for (const p of individuals) {
			if (dominationCount.get(p.id) === 0) {
				p.fitness.rank = 0;
				currentFront.push(p);
			}
		}

		let frontIndex = 0;
		while (currentFront.length > 0) {
			fronts.push(currentFront);
			const nextFront: MOSESIndividual[] = [];

			for (const p of currentFront) {
				for (const qId of dominatedBy.get(p.id)!) {
					const newCount = dominationCount.get(qId)! - 1;
					dominationCount.set(qId, newCount);

					if (newCount === 0) {
						const q = individuals.find((i) => i.id === qId)!;
						q.fitness.rank = frontIndex + 1;
						nextFront.push(q);
					}
				}
			}

			frontIndex++;
			currentFront = nextFront;
		}

		return fronts;
	}

	/**
	 * Check if fitness a dominates fitness b.
	 */
	private dominates(a: MOSESFitness, b: MOSESFitness): boolean {
		let dominated = false;

		for (let i = 0; i < a.objectives.length; i++) {
			const aVal = a.objectives[i].direction === 'maximize'
				? a.objectives[i].value
				: -a.objectives[i].value;
			const bVal = b.objectives[i].direction === 'maximize'
				? b.objectives[i].value
				: -b.objectives[i].value;

			if (aVal < bVal) return false;
			if (aVal > bVal) dominated = true;
		}

		return dominated;
	}

	/**
	 * Calculate crowding distance for diversity preservation.
	 */
	calculateCrowdingDistance(front: MOSESIndividual[]): void {
		const n = front.length;
		if (n === 0) return;

		for (const ind of front) {
			ind.fitness.crowdingDistance = 0;
		}

		for (let m = 0; m < this.objectives.length; m++) {
			front.sort((a, b) => a.fitness.objectives[m].value - b.fitness.objectives[m].value);

			front[0].fitness.crowdingDistance = Infinity;
			front[n - 1].fitness.crowdingDistance = Infinity;

			const minVal = front[0].fitness.objectives[m].value;
			const maxVal = front[n - 1].fitness.objectives[m].value;
			const range = maxVal - minVal;

			if (range === 0) continue;

			for (let i = 1; i < n - 1; i++) {
				const distance =
					(front[i + 1].fitness.objectives[m].value - front[i - 1].fitness.objectives[m].value) / range;
				front[i].fitness.crowdingDistance += distance;
			}
		}
	}
}

// ============================================================================
// Population Manager
// ============================================================================

/**
 * Population manager for evolutionary search.
 */
export class PopulationManager {
	private population: MOSESIndividual[] = [];
	private generation: number = 0;
	private individualIdCounter: number = 0;

	constructor(private config: MOSESConfig) {}

	/**
	 * Initialize population with random individuals.
	 */
	initialize(
		genomeFactory: () => MOSESGenome,
		fitnessEvaluator: FitnessEvaluator,
		evaluationFn: (genome: MOSESGenome) => Map<string, number>
	): void {
		this.population = [];
		this.generation = 0;

		for (let i = 0; i < this.config.populationSize; i++) {
			const genome = genomeFactory();
			const fitness = fitnessEvaluator.evaluate(genome, evaluationFn);

			const individual: MOSESIndividual = {
				id: `ind-${++this.individualIdCounter}`,
				genome,
				fitness,
				generation: 0,
				parentIds: [],
				createdAt: Date.now(),
				metadata: {},
			};

			this.population.push(individual);
		}
	}

	/**
	 * Get current population.
	 */
	getPopulation(): MOSESIndividual[] {
		return [...this.population];
	}

	/**
	 * Get current generation.
	 */
	getGeneration(): number {
		return this.generation;
	}

	/**
	 * Select individuals for reproduction.
	 */
	select(strategy: SelectionStrategy = 'tournament'): MOSESIndividual[] {
		const selected: MOSESIndividual[] = [];
		const selectionSize = Math.floor(this.population.length * (1 - this.config.eliteRatio));

		switch (strategy) {
			case 'tournament':
				for (let i = 0; i < selectionSize; i++) {
					selected.push(this.tournamentSelect());
				}
				break;
			case 'roulette':
				for (let i = 0; i < selectionSize; i++) {
					selected.push(this.rouletteSelect());
				}
				break;
			case 'rank':
				selected.push(...this.rankSelect(selectionSize));
				break;
			case 'elite':
				selected.push(...this.eliteSelect(selectionSize));
				break;
		}

		return selected;
	}

	private tournamentSelect(): MOSESIndividual {
		const contestants: MOSESIndividual[] = [];
		for (let i = 0; i < this.config.tournamentSize; i++) {
			const randomIndex = Math.floor(Math.random() * this.population.length);
			contestants.push(this.population[randomIndex]);
		}

		return contestants.reduce((best, current) =>
			current.fitness.overall > best.fitness.overall ? current : best
		);
	}

	private rouletteSelect(): MOSESIndividual {
		const totalFitness = this.population.reduce((sum, ind) => sum + Math.max(0, ind.fitness.overall), 0);
		let random = Math.random() * totalFitness;

		for (const ind of this.population) {
			random -= Math.max(0, ind.fitness.overall);
			if (random <= 0) return ind;
		}

		return this.population[this.population.length - 1];
	}

	private rankSelect(count: number): MOSESIndividual[] {
		const sorted = [...this.population].sort((a, b) => b.fitness.overall - a.fitness.overall);
		return sorted.slice(0, count);
	}

	private eliteSelect(count: number): MOSESIndividual[] {
		return this.rankSelect(count);
	}

	/**
	 * Get elite individuals.
	 */
	getElite(): MOSESIndividual[] {
		const eliteCount = Math.ceil(this.population.length * this.config.eliteRatio);
		return [...this.population]
			.sort((a, b) => b.fitness.overall - a.fitness.overall)
			.slice(0, eliteCount);
	}

	/**
	 * Replace population with new generation.
	 */
	replacePopulation(newIndividuals: MOSESIndividual[]): void {
		const elite = this.getElite();
		this.population = [...elite, ...newIndividuals.slice(0, this.config.populationSize - elite.length)];
		this.generation++;
	}

	/**
	 * Get best individual.
	 */
	getBest(): MOSESIndividual | undefined {
		return [...this.population].sort((a, b) => b.fitness.overall - a.fitness.overall)[0];
	}

	/**
	 * Calculate population diversity.
	 */
	calculateDiversity(): number {
		if (this.population.length < 2) return 0;

		let totalDistance = 0;
		let comparisons = 0;

		for (let i = 0; i < this.population.length; i++) {
			for (let j = i + 1; j < this.population.length; j++) {
				totalDistance += this.genomeDistance(
					this.population[i].genome,
					this.population[j].genome
				);
				comparisons++;
			}
		}

		return comparisons > 0 ? totalDistance / comparisons : 0;
	}

	private genomeDistance(g1: MOSESGenome, g2: MOSESGenome): number {
		const minLength = Math.min(g1.genes.length, g2.genes.length);
		let distance = Math.abs(g1.genes.length - g2.genes.length);

		for (let i = 0; i < minLength; i++) {
			if (typeof g1.genes[i].value === 'number' && typeof g2.genes[i].value === 'number') {
				distance += Math.abs(g1.genes[i].value - g2.genes[i].value);
			} else if (g1.genes[i].value !== g2.genes[i].value) {
				distance += 1;
			}
		}

		return distance;
	}
}

// ============================================================================
// MOSES Engine
// ============================================================================

/**
 * Main MOSES evolutionary search engine.
 */
export class MOSESEngine {
	private populationManager: PopulationManager;
	private fitnessEvaluator: FitnessEvaluator;
	private statistics: MOSESStatistics[] = [];
	private isRunning: boolean = false;
	private startTime: Timestamp = 0;

	constructor(private config: MOSESConfig) {
		this.populationManager = new PopulationManager(config);
		this.fitnessEvaluator = new FitnessEvaluator(config.objectives);
	}

	/**
	 * Initialize the engine with a genome factory.
	 */
	initialize(
		genomeFactory: () => MOSESGenome,
		evaluationFn: (genome: MOSESGenome) => Map<string, number>
	): void {
		this.populationManager.initialize(genomeFactory, this.fitnessEvaluator, evaluationFn);
		this.statistics = [];
	}

	/**
	 * Run evolution for a specified number of generations.
	 */
	async evolve(
		evaluationFn: (genome: MOSESGenome) => Map<string, number>,
		onGeneration?: (stats: MOSESStatistics) => void
	): Promise<MOSESIndividual | undefined> {
		this.isRunning = true;
		this.startTime = Date.now();

		while (this.isRunning && !this.shouldTerminate()) {
			const stats = this.evolveGeneration(evaluationFn);
			this.statistics.push(stats);

			if (onGeneration) {
				onGeneration(stats);
			}

			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		this.isRunning = false;
		return this.populationManager.getBest();
	}

	/**
	 * Evolve one generation.
	 */
	evolveGeneration(
		evaluationFn: (genome: MOSESGenome) => Map<string, number>
	): MOSESStatistics {
		const generation = this.populationManager.getGeneration();
		const previousBest = this.populationManager.getBest();
		const previousBestFitness = previousBest?.fitness.overall ?? 0;

		const selected = this.populationManager.select('tournament');
		const offspring: MOSESIndividual[] = [];

		for (let i = 0; i < selected.length - 1; i += 2) {
			const parent1 = selected[i];
			const parent2 = selected[i + 1];

			let child1Genome: MOSESGenome, child2Genome: MOSESGenome;

			if (Math.random() < this.config.crossoverRate) {
				[child1Genome, child2Genome] = GeneticOperators.crossover(
					parent1.genome,
					parent2.genome
				);
			} else {
				child1Genome = { ...parent1.genome, genes: [...parent1.genome.genes] };
				child2Genome = { ...parent2.genome, genes: [...parent2.genome.genes] };
			}

			child1Genome = GeneticOperators.mutate(child1Genome, this.config.mutationRate);
			child2Genome = GeneticOperators.mutate(child2Genome, this.config.mutationRate);

			offspring.push(this.createIndividual(child1Genome, [parent1.id, parent2.id], evaluationFn));
			offspring.push(this.createIndividual(child2Genome, [parent1.id, parent2.id], evaluationFn));
		}

		this.populationManager.replacePopulation(offspring);

		const currentBest = this.populationManager.getBest();
		const improvements = currentBest && currentBest.fitness.overall > previousBestFitness ? 1 : 0;

		return {
			generation: generation + 1,
			bestFitness: currentBest?.fitness.overall ?? 0,
			averageFitness: this.calculateAverageFitness(),
			diversity: this.populationManager.calculateDiversity(),
			convergenceRate: this.calculateConvergenceRate(),
			improvements,
			elapsedTime: Date.now() - this.startTime,
		};
	}

	private createIndividual(
		genome: MOSESGenome,
		parentIds: string[],
		evaluationFn: (genome: MOSESGenome) => Map<string, number>
	): MOSESIndividual {
		const fitness = this.fitnessEvaluator.evaluate(genome, evaluationFn);

		return {
			id: `ind-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			genome,
			fitness,
			generation: this.populationManager.getGeneration() + 1,
			parentIds,
			createdAt: Date.now(),
			metadata: {},
		};
	}

	private calculateAverageFitness(): number {
		const population = this.populationManager.getPopulation();
		if (population.length === 0) return 0;

		const total = population.reduce((sum, ind) => sum + ind.fitness.overall, 0);
		return total / population.length;
	}

	private calculateConvergenceRate(): number {
		if (this.statistics.length < 2) return 0;

		const recent = this.statistics.slice(-10);
		if (recent.length < 2) return 0;

		const improvements = recent.filter((s) => s.improvements > 0).length;
		return improvements / recent.length;
	}

	private shouldTerminate(): boolean {
		const gen = this.populationManager.getGeneration();
		const criteria = this.config.terminationCriteria;

		if (gen >= criteria.maxGenerations) return true;

		if (criteria.fitnessThreshold !== undefined) {
			const best = this.populationManager.getBest();
			if (best && best.fitness.overall >= criteria.fitnessThreshold) return true;
		}

		if (criteria.stagnationGenerations !== undefined && this.statistics.length >= criteria.stagnationGenerations) {
			const recent = this.statistics.slice(-criteria.stagnationGenerations);
			const noImprovement = recent.every((s) => s.improvements === 0);
			if (noImprovement) return true;
		}

		if (criteria.timeLimit !== undefined) {
			const elapsed = Date.now() - this.startTime;
			if (elapsed >= criteria.timeLimit) return true;
		}

		return false;
	}

	/**
	 * Stop the evolution.
	 */
	stop(): void {
		this.isRunning = false;
	}

	/**
	 * Get evolution statistics.
	 */
	getStatistics(): MOSESStatistics[] {
		return [...this.statistics];
	}

	/**
	 * Get current population.
	 */
	getPopulation(): MOSESIndividual[] {
		return this.populationManager.getPopulation();
	}

	/**
	 * Get best individual.
	 */
	getBest(): MOSESIndividual | undefined {
		return this.populationManager.getBest();
	}

	/**
	 * Get configuration.
	 */
	getConfig(): MOSESConfig {
		return { ...this.config };
	}
}
