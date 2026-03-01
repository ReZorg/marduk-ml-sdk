/**
 * Marduk Memory System
 *
 * Implements four distinct memory types optimized for different types
 * of information storage and retrieval:
 * - Declarative: Explicit facts and knowledge
 * - Episodic: Experiential information with temporal context
 * - Procedural: Skills and behavioral patterns
 * - Semantic: Conceptual relationships and abstract knowledge
 */

import type {
	CognitiveEntityId,
	MemoryItem,
	MemoryType,
	MemoryContext,
	DeclarativeMemory,
	EpisodicMemory,
	ProceduralMemory,
	SemanticMemory,
	SemanticRelation,
	SemanticRelationType,
	Timestamp,
} from '../types';

// ============================================================================
// Memory Store Interface
// ============================================================================

/**
 * Query options for memory retrieval.
 */
export interface MemoryQuery {
	memoryType?: MemoryType;
	tags?: string[];
	minStrength?: number;
	minImportance?: number;
	since?: Timestamp;
	limit?: number;
	orderBy?: 'strength' | 'importance' | 'lastAccessed' | 'createdAt';
	order?: 'asc' | 'desc';
}

/**
 * Result of a memory search operation.
 */
export interface MemorySearchResult {
	item: MemoryItem;
	relevance: number;
	matchedTerms: string[];
}

/**
 * Statistics about the memory store.
 */
export interface MemoryStatistics {
	totalItems: number;
	byType: Record<MemoryType, number>;
	averageStrength: number;
	averageImportance: number;
	accessPatterns: AccessPattern[];
}

/**
 * Detected access pattern for optimization.
 */
export interface AccessPattern {
	type: 'frequent' | 'recent' | 'clustered' | 'sequential';
	itemIds: CognitiveEntityId[];
	frequency: number;
}

// ============================================================================
// Base Memory Store Implementation
// ============================================================================

/**
 * Base memory store providing common functionality for all memory types.
 */
export class BaseMemoryStore<T extends MemoryItem> {
	protected items: Map<CognitiveEntityId, T> = new Map();
	protected accessLog: Array<{ id: CognitiveEntityId; timestamp: Timestamp }> = [];

	/**
	 * Store a memory item.
	 */
	store(item: T): void {
		item.lastAccessed = Date.now();
		this.items.set(item.id, item);
	}

	/**
	 * Retrieve a memory item by ID.
	 */
	retrieve(id: CognitiveEntityId): T | undefined {
		const item = this.items.get(id);
		if (item) {
			item.accessCount++;
			item.lastAccessed = Date.now();
			this.accessLog.push({ id, timestamp: Date.now() });
		}
		return item;
	}

	/**
	 * Remove a memory item.
	 */
	remove(id: CognitiveEntityId): boolean {
		return this.items.delete(id);
	}

	/**
	 * Query memories based on criteria.
	 */
	query(options: MemoryQuery): T[] {
		let results = Array.from(this.items.values());

		if (options.minStrength !== undefined) {
			results = results.filter((item) => item.strength >= options.minStrength!);
		}

		if (options.minImportance !== undefined) {
			results = results.filter((item) => item.importance >= options.minImportance!);
		}

		if (options.since !== undefined) {
			results = results.filter((item) => item.createdAt >= options.since!);
		}

		if (options.tags && options.tags.length > 0) {
			results = results.filter((item) =>
				options.tags!.some((tag) => item.context.tags.includes(tag))
			);
		}

		const orderBy = options.orderBy || 'lastAccessed';
		const order = options.order || 'desc';
		results.sort((a, b) => {
			const aVal = a[orderBy] as number;
			const bVal = b[orderBy] as number;
			return order === 'asc' ? aVal - bVal : bVal - aVal;
		});

		if (options.limit !== undefined) {
			results = results.slice(0, options.limit);
		}

		return results;
	}

	/**
	 * Get statistics about the memory store.
	 */
	getStatistics(): { totalItems: number; averageStrength: number; averageImportance: number } {
		const items = Array.from(this.items.values());
		const totalItems = items.length;

		if (totalItems === 0) {
			return { totalItems: 0, averageStrength: 0, averageImportance: 0 };
		}

		const averageStrength = items.reduce((sum, item) => sum + item.strength, 0) / totalItems;
		const averageImportance = items.reduce((sum, item) => sum + item.importance, 0) / totalItems;

		return { totalItems, averageStrength, averageImportance };
	}

	/**
	 * Strengthen a memory item.
	 */
	strengthen(id: CognitiveEntityId, amount: number): void {
		const item = this.items.get(id);
		if (item) {
			item.strength = Math.min(1, item.strength + amount);
		}
	}

	/**
	 * Weaken a memory item (decay).
	 */
	weaken(id: CognitiveEntityId, amount: number): void {
		const item = this.items.get(id);
		if (item) {
			item.strength = Math.max(0, item.strength - amount);
		}
	}

	/**
	 * Apply decay to all memories based on time.
	 */
	applyDecay(decayRate: number): void {
		const now = Date.now();
		for (const item of this.items.values()) {
			const timeSinceAccess = now - item.lastAccessed;
			const decayFactor = Math.exp(-decayRate * timeSinceAccess / (1000 * 60 * 60)); // Hours
			item.strength *= decayFactor;
		}
	}

	/**
	 * Get all items.
	 */
	all(): T[] {
		return Array.from(this.items.values());
	}

	/**
	 * Clear all items.
	 */
	clear(): void {
		this.items.clear();
		this.accessLog = [];
	}

	/**
	 * Get item count.
	 */
	size(): number {
		return this.items.size;
	}
}

// ============================================================================
// Specialized Memory Stores
// ============================================================================

/**
 * Declarative memory store for explicit facts and knowledge.
 */
export class DeclarativeMemoryStore extends BaseMemoryStore<DeclarativeMemory> {
	/**
	 * Store a fact in declarative memory.
	 */
	storeFact(
		id: CognitiveEntityId,
		fact: string,
		options: {
			source?: string;
			confidence?: number;
			importance?: number;
			tags?: string[];
		} = {}
	): DeclarativeMemory {
		const now = Date.now();
		const memory: DeclarativeMemory = {
			id,
			memoryType: 'declarative',
			content: {
				fact,
				source: options.source,
				confidence: options.confidence ?? 0.8,
				verifiedAt: now,
			},
			strength: 1.0,
			importance: options.importance ?? 0.5,
			createdAt: now,
			lastAccessed: now,
			accessCount: 0,
			associations: [],
			context: {
				temporal: { timestamp: now },
				tags: options.tags ?? [],
			},
		};
		this.store(memory);
		return memory;
	}

	/**
	 * Search facts by content.
	 */
	searchFacts(query: string): MemorySearchResult[] {
		const results: MemorySearchResult[] = [];
		const queryTerms = query.toLowerCase().split(/\s+/);

		for (const item of this.items.values()) {
			const factLower = item.content.fact.toLowerCase();
			const matchedTerms = queryTerms.filter((term) => factLower.includes(term));

			if (matchedTerms.length > 0) {
				const relevance = (matchedTerms.length / queryTerms.length) * item.strength;
				results.push({ item, relevance, matchedTerms });
			}
		}

		return results.sort((a, b) => b.relevance - a.relevance);
	}
}

/**
 * Episodic memory store for experiential information.
 */
export class EpisodicMemoryStore extends BaseMemoryStore<EpisodicMemory> {
	/**
	 * Store an episode in memory.
	 */
	storeEpisode(
		id: CognitiveEntityId,
		event: string,
		options: {
			participants?: string[];
			outcome?: string;
			emotions?: { valence: number; arousal: number; dominance: number };
			importance?: number;
			tags?: string[];
		} = {}
	): EpisodicMemory {
		const now = Date.now();
		const memory: EpisodicMemory = {
			id,
			memoryType: 'episodic',
			content: {
				event,
				participants: options.participants,
				outcome: options.outcome,
				emotions: options.emotions,
			},
			strength: 1.0,
			importance: options.importance ?? this.calculateEmotionalImportance(options.emotions),
			createdAt: now,
			lastAccessed: now,
			accessCount: 0,
			associations: [],
			context: {
				temporal: { timestamp: now },
				emotional: options.emotions,
				tags: options.tags ?? [],
			},
		};
		this.store(memory);
		return memory;
	}

	/**
	 * Calculate importance based on emotional intensity.
	 */
	private calculateEmotionalImportance(
		emotions?: { valence: number; arousal: number; dominance: number }
	): number {
		if (!emotions) return 0.5;
		return (Math.abs(emotions.valence) + emotions.arousal) / 2;
	}

	/**
	 * Retrieve episodes in a time range.
	 */
	getEpisodesInRange(start: Timestamp, end: Timestamp): EpisodicMemory[] {
		return this.query({ since: start }).filter(
			(item) => item.createdAt >= start && item.createdAt <= end
		);
	}

	/**
	 * Find similar episodes.
	 */
	findSimilarEpisodes(event: string, limit: number = 5): EpisodicMemory[] {
		const eventWords = new Set(event.toLowerCase().split(/\s+/));
		const scored: Array<{ item: EpisodicMemory; score: number }> = [];

		for (const item of this.items.values()) {
			const itemWords = new Set(item.content.event.toLowerCase().split(/\s+/));
			const intersection = [...eventWords].filter((word) => itemWords.has(word));
			const score = intersection.length / Math.max(eventWords.size, itemWords.size);
			if (score > 0) {
				scored.push({ item, score });
			}
		}

		return scored
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map((s) => s.item);
	}
}

/**
 * Procedural memory store for skills and behavioral patterns.
 */
export class ProceduralMemoryStore extends BaseMemoryStore<ProceduralMemory> {
	/**
	 * Store a procedure in memory.
	 */
	storeProcedure(
		id: CognitiveEntityId,
		procedure: string,
		steps: Array<{
			order: number;
			action: string;
			parameters?: Record<string, unknown>;
			preconditions?: string[];
			postconditions?: string[];
		}>,
		options: {
			importance?: number;
			tags?: string[];
		} = {}
	): ProceduralMemory {
		const now = Date.now();
		const memory: ProceduralMemory = {
			id,
			memoryType: 'procedural',
			content: {
				procedure,
				steps,
				successRate: 1.0,
				executionTime: 0,
			},
			strength: 1.0,
			importance: options.importance ?? 0.5,
			createdAt: now,
			lastAccessed: now,
			accessCount: 0,
			associations: [],
			context: {
				temporal: { timestamp: now },
				tags: options.tags ?? [],
			},
		};
		this.store(memory);
		return memory;
	}

	/**
	 * Record an execution of a procedure.
	 */
	recordExecution(
		id: CognitiveEntityId,
		success: boolean,
		executionTime: number
	): void {
		const item = this.items.get(id);
		if (item) {
			const execCount = item.accessCount + 1;
			item.content.successRate =
				(item.content.successRate * item.accessCount + (success ? 1 : 0)) / execCount;
			item.content.executionTime =
				(item.content.executionTime * item.accessCount + executionTime) / execCount;
			item.strength = success
				? Math.min(1, item.strength + 0.1)
				: Math.max(0, item.strength - 0.05);
		}
	}

	/**
	 * Get most reliable procedures.
	 */
	getMostReliable(limit: number = 10): ProceduralMemory[] {
		return Array.from(this.items.values())
			.sort((a, b) => b.content.successRate - a.content.successRate)
			.slice(0, limit);
	}
}

/**
 * Semantic memory store for conceptual relationships.
 */
export class SemanticMemoryStore extends BaseMemoryStore<SemanticMemory> {
	/**
	 * Store a concept in semantic memory.
	 */
	storeConcept(
		id: CognitiveEntityId,
		concept: string,
		category: string,
		properties: Record<string, unknown> = {},
		options: {
			importance?: number;
			tags?: string[];
		} = {}
	): SemanticMemory {
		const now = Date.now();
		const memory: SemanticMemory = {
			id,
			memoryType: 'semantic',
			content: {
				concept,
				category,
				properties,
				relationships: [],
			},
			strength: 1.0,
			importance: options.importance ?? 0.5,
			createdAt: now,
			lastAccessed: now,
			accessCount: 0,
			associations: [],
			context: {
				temporal: { timestamp: now },
				tags: options.tags ?? [],
			},
		};
		this.store(memory);
		return memory;
	}

	/**
	 * Add a relationship between concepts.
	 */
	addRelationship(
		sourceId: CognitiveEntityId,
		targetId: CognitiveEntityId,
		relationType: SemanticRelationType,
		strength: number = 1.0,
		bidirectional: boolean = false
	): void {
		const source = this.items.get(sourceId);
		if (source) {
			const relation: SemanticRelation = {
				targetId,
				relationType,
				strength,
				bidirectional,
			};
			source.content.relationships.push(relation);

			if (bidirectional) {
				const target = this.items.get(targetId);
				if (target) {
					const reverseRelation: SemanticRelation = {
						targetId: sourceId,
						relationType: this.getReverseRelationType(relationType),
						strength,
						bidirectional: true,
					};
					target.content.relationships.push(reverseRelation);
				}
			}
		}
	}

	/**
	 * Get reverse relation type for bidirectional relationships.
	 */
	private getReverseRelationType(type: SemanticRelationType): SemanticRelationType {
		const reverseMap: Record<SemanticRelationType, SemanticRelationType> = {
			'is-a': 'has-a',
			'has-a': 'is-a',
			'part-of': 'has-a',
			'similar-to': 'similar-to',
			'opposite-of': 'opposite-of',
			causes: 'requires',
			enables: 'requires',
			requires: 'enables',
			'temporal-before': 'temporal-after',
			'temporal-after': 'temporal-before',
		};
		return reverseMap[type];
	}

	/**
	 * Find related concepts.
	 */
	findRelated(
		id: CognitiveEntityId,
		relationType?: SemanticRelationType,
		depth: number = 1
	): SemanticMemory[] {
		const visited = new Set<CognitiveEntityId>();
		const results: SemanticMemory[] = [];

		const traverse = (currentId: CognitiveEntityId, currentDepth: number): void => {
			if (currentDepth > depth || visited.has(currentId)) return;
			visited.add(currentId);

			const item = this.items.get(currentId);
			if (!item) return;

			const relationships = relationType
				? item.content.relationships.filter((r) => r.relationType === relationType)
				: item.content.relationships;

			for (const rel of relationships) {
				const related = this.items.get(rel.targetId);
				if (related && !visited.has(rel.targetId)) {
					results.push(related);
					traverse(rel.targetId, currentDepth + 1);
				}
			}
		};

		traverse(id, 0);
		return results;
	}

	/**
	 * Get concepts by category.
	 */
	getByCategory(category: string): SemanticMemory[] {
		return Array.from(this.items.values()).filter(
			(item) => item.content.category === category
		);
	}
}

// ============================================================================
// Unified Memory System
// ============================================================================

/**
 * Unified memory system integrating all memory types.
 */
export class MemorySystem {
	readonly declarative: DeclarativeMemoryStore;
	readonly episodic: EpisodicMemoryStore;
	readonly procedural: ProceduralMemoryStore;
	readonly semantic: SemanticMemoryStore;

	constructor() {
		this.declarative = new DeclarativeMemoryStore();
		this.episodic = new EpisodicMemoryStore();
		this.procedural = new ProceduralMemoryStore();
		this.semantic = new SemanticMemoryStore();
	}

	/**
	 * Get overall statistics for all memory types.
	 */
	getStatistics(): MemoryStatistics {
		const decStats = this.declarative.getStatistics();
		const epiStats = this.episodic.getStatistics();
		const proStats = this.procedural.getStatistics();
		const semStats = this.semantic.getStatistics();

		const totalItems = decStats.totalItems + epiStats.totalItems + proStats.totalItems + semStats.totalItems;
		const totalStrength =
			decStats.averageStrength * decStats.totalItems +
			epiStats.averageStrength * epiStats.totalItems +
			proStats.averageStrength * proStats.totalItems +
			semStats.averageStrength * semStats.totalItems;
		const totalImportance =
			decStats.averageImportance * decStats.totalItems +
			epiStats.averageImportance * epiStats.totalItems +
			proStats.averageImportance * proStats.totalItems +
			semStats.averageImportance * semStats.totalItems;

		return {
			totalItems,
			byType: {
				declarative: decStats.totalItems,
				episodic: epiStats.totalItems,
				procedural: proStats.totalItems,
				semantic: semStats.totalItems,
			},
			averageStrength: totalItems > 0 ? totalStrength / totalItems : 0,
			averageImportance: totalItems > 0 ? totalImportance / totalItems : 0,
			accessPatterns: [],
		};
	}

	/**
	 * Apply decay to all memory stores.
	 */
	applyDecay(decayRate: number): void {
		this.declarative.applyDecay(decayRate);
		this.episodic.applyDecay(decayRate);
		this.procedural.applyDecay(decayRate);
		this.semantic.applyDecay(decayRate);
	}

	/**
	 * Clear all memory stores.
	 */
	clear(): void {
		this.declarative.clear();
		this.episodic.clear();
		this.procedural.clear();
		this.semantic.clear();
	}
}
