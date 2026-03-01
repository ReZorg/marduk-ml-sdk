/**
 * Marduk Neural-Symbolic Integration
 *
 * Implements hypergraph cognitive networks that bridge the gap between
 * connectionist and symbolic AI approaches through neural pattern
 * recognition and symbolic reasoning within a unified framework.
 */

import type {
	CognitiveEntityId,
	CognitiveEntityType,
	HypergraphNode,
	Hyperedge,
	HyperedgeType,
	TruthValue,
	AttentionValue,
	NeuralEncoding,
	Timestamp,
} from '../types';

// ============================================================================
// Neural Encoding
// ============================================================================

/**
 * Neural encoder for symbol grounding.
 */
export class NeuralEncoder {
	private dimensions: number;
	private encodings: Map<CognitiveEntityId, NeuralEncoding> = new Map();

	constructor(dimensions: number = 128) {
		this.dimensions = dimensions;
	}

	/**
	 * Encode a symbol to a neural representation.
	 */
	encode(symbolId: CognitiveEntityId, content: string): NeuralEncoding {
		const embedding = this.textToEmbedding(content);

		const encoding: NeuralEncoding = {
			symbolId,
			embedding,
			dimensions: this.dimensions,
			encoder: 'default',
			confidence: 0.9,
		};

		this.encodings.set(symbolId, encoding);
		return encoding;
	}

	/**
	 * Convert text to embedding vector.
	 */
	private textToEmbedding(text: string): number[] {
		const embedding = new Array(this.dimensions).fill(0);

		for (let i = 0; i < text.length; i++) {
			const charCode = text.charCodeAt(i);
			const index = (i * 7 + charCode) % this.dimensions;
			embedding[index] += charCode / 256;
		}

		const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
		return norm > 0 ? embedding.map((x) => x / norm) : embedding;
	}

	/**
	 * Calculate similarity between two encodings.
	 */
	similarity(id1: CognitiveEntityId, id2: CognitiveEntityId): number {
		const enc1 = this.encodings.get(id1);
		const enc2 = this.encodings.get(id2);

		if (!enc1 || !enc2) return 0;

		return this.cosineSimilarity(enc1.embedding, enc2.embedding);
	}

	/**
	 * Cosine similarity between two vectors.
	 */
	private cosineSimilarity(a: number[], b: number[]): number {
		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < a.length; i++) {
			dotProduct += a[i] * b[i];
			normA += a[i] * a[i];
			normB += b[i] * b[i];
		}

		const denominator = Math.sqrt(normA) * Math.sqrt(normB);
		return denominator > 0 ? dotProduct / denominator : 0;
	}

	/**
	 * Find similar symbols.
	 */
	findSimilar(symbolId: CognitiveEntityId, topK: number = 5): Array<{ id: CognitiveEntityId; similarity: number }> {
		const results: Array<{ id: CognitiveEntityId; similarity: number }> = [];

		for (const otherId of this.encodings.keys()) {
			if (otherId !== symbolId) {
				const sim = this.similarity(symbolId, otherId);
				results.push({ id: otherId, similarity: sim });
			}
		}

		return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
	}

	/**
	 * Get encoding for a symbol.
	 */
	getEncoding(symbolId: CognitiveEntityId): NeuralEncoding | undefined {
		return this.encodings.get(symbolId);
	}

	/**
	 * Clear all encodings.
	 */
	clear(): void {
		this.encodings.clear();
	}
}

// ============================================================================
// Attention System (ECAN-inspired)
// ============================================================================

/**
 * Economic Attention Network for attention allocation.
 */
export class AttentionSystem {
	private attentionValues: Map<CognitiveEntityId, AttentionValue> = new Map();
	private totalBudget: number = 1000;
	private attentionFocusThreshold: number = 0.5;

	/**
	 * Initialize attention for an entity.
	 */
	initialize(entityId: CognitiveEntityId, sti: number = 0, lti: number = 0): AttentionValue {
		const av: AttentionValue = {
			shortTermImportance: sti,
			longTermImportance: lti,
			vlti: lti > 0.8,
		};

		this.attentionValues.set(entityId, av);
		return av;
	}

	/**
	 * Stimulate an entity's attention.
	 */
	stimulate(entityId: CognitiveEntityId, amount: number): void {
		const av = this.attentionValues.get(entityId);
		if (av) {
			av.shortTermImportance = Math.min(1, av.shortTermImportance + amount);
		}
	}

	/**
	 * Apply attention decay.
	 */
	decay(decayRate: number = 0.01): void {
		for (const av of this.attentionValues.values()) {
			av.shortTermImportance = Math.max(0, av.shortTermImportance - decayRate);
		}
	}

	/**
	 * Spread attention from one entity to connected entities.
	 */
	spread(
		sourceId: CognitiveEntityId,
		targetIds: CognitiveEntityId[],
		spreadFactor: number = 0.1
	): void {
		const sourceAv = this.attentionValues.get(sourceId);
		if (!sourceAv || sourceAv.shortTermImportance <= 0) return;

		const spreadAmount = sourceAv.shortTermImportance * spreadFactor / targetIds.length;

		for (const targetId of targetIds) {
			this.stimulate(targetId, spreadAmount);
		}

		sourceAv.shortTermImportance *= (1 - spreadFactor);
	}

	/**
	 * Get entities in attentional focus.
	 */
	getAttentionalFocus(): CognitiveEntityId[] {
		const focused: CognitiveEntityId[] = [];

		for (const [id, av] of this.attentionValues) {
			if (av.shortTermImportance >= this.attentionFocusThreshold) {
				focused.push(id);
			}
		}

		return focused.sort((a, b) => {
			const avA = this.attentionValues.get(a)!;
			const avB = this.attentionValues.get(b)!;
			return avB.shortTermImportance - avA.shortTermImportance;
		});
	}

	/**
	 * Get attention value for an entity.
	 */
	getAttention(entityId: CognitiveEntityId): AttentionValue | undefined {
		return this.attentionValues.get(entityId);
	}

	/**
	 * Update long-term importance based on sustained attention.
	 */
	updateLongTermImportance(entityId: CognitiveEntityId, factor: number = 0.1): void {
		const av = this.attentionValues.get(entityId);
		if (av) {
			av.longTermImportance = av.longTermImportance + factor * (av.shortTermImportance - av.longTermImportance);
			av.vlti = av.longTermImportance > 0.8;
		}
	}

	/**
	 * Clear all attention values.
	 */
	clear(): void {
		this.attentionValues.clear();
	}
}

// ============================================================================
// Truth Value System
// ============================================================================

/**
 * Probabilistic truth value for uncertain reasoning.
 */
export class TruthValueSystem {
	/**
	 * Create a truth value.
	 */
	static create(strength: number, confidence: number): TruthValue {
		return {
			strength: Math.max(0, Math.min(1, strength)),
			confidence: Math.max(0, Math.min(1, confidence)),
		};
	}

	/**
	 * Combine two truth values using revision.
	 */
	static revision(tv1: TruthValue, tv2: TruthValue): TruthValue {
		const k1 = tv1.confidence * (1 - tv2.confidence);
		const k2 = tv2.confidence * (1 - tv1.confidence);
		const k12 = tv1.confidence * tv2.confidence;

		const totalK = k1 + k2 + k12;

		if (totalK === 0) {
			return this.create(0.5, 0);
		}

		const strength = (k1 * tv1.strength + k2 * tv2.strength + k12 * (tv1.strength + tv2.strength) / 2) / totalK;
		const confidence = totalK;

		return this.create(strength, confidence);
	}

	/**
	 * AND operation on truth values.
	 */
	static and(tv1: TruthValue, tv2: TruthValue): TruthValue {
		const strength = tv1.strength * tv2.strength;
		const confidence = Math.min(tv1.confidence, tv2.confidence);
		return this.create(strength, confidence);
	}

	/**
	 * OR operation on truth values.
	 */
	static or(tv1: TruthValue, tv2: TruthValue): TruthValue {
		const strength = 1 - (1 - tv1.strength) * (1 - tv2.strength);
		const confidence = Math.min(tv1.confidence, tv2.confidence);
		return this.create(strength, confidence);
	}

	/**
	 * NOT operation on a truth value.
	 */
	static not(tv: TruthValue): TruthValue {
		return this.create(1 - tv.strength, tv.confidence);
	}

	/**
	 * Deduction inference.
	 */
	static deduction(tvAB: TruthValue, tvBC: TruthValue): TruthValue {
		const strength = tvAB.strength * tvBC.strength;
		const confidence = tvAB.confidence * tvBC.confidence * strength;
		return this.create(strength, confidence);
	}

	/**
	 * Induction inference.
	 */
	static induction(tvAB: TruthValue, tvAC: TruthValue): TruthValue {
		const strength = tvAB.strength * tvAC.strength;
		const confidence = tvAB.confidence * tvAC.confidence * strength * 0.9;
		return this.create(strength, confidence);
	}
}

// ============================================================================
// Hypergraph Cognitive Network
// ============================================================================

/**
 * Hypergraph-based cognitive network for neural-symbolic integration.
 */
export class HypergraphCognitiveNetwork {
	private nodes: Map<CognitiveEntityId, HypergraphNode> = new Map();
	private edges: Map<string, Hyperedge> = new Map();
	private neuralEncoder: NeuralEncoder;
	private attentionSystem: AttentionSystem;
	private nodeIdCounter: number = 0;
	private edgeIdCounter: number = 0;

	constructor(dimensions: number = 128) {
		this.neuralEncoder = new NeuralEncoder(dimensions);
		this.attentionSystem = new AttentionSystem();
	}

	/**
	 * Add a node to the hypergraph.
	 */
	addNode(
		type: CognitiveEntityType,
		content: string,
		options: {
			truthValue?: TruthValue;
			attentionValue?: AttentionValue;
		} = {}
	): HypergraphNode {
		const id = `node-${++this.nodeIdCounter}`;

		const encoding = this.neuralEncoder.encode(id, content);

		const truthValue = options.truthValue ?? TruthValueSystem.create(1, 0.9);
		const attentionValue = options.attentionValue ?? this.attentionSystem.initialize(id, 0.5, 0.1);

		const node: HypergraphNode = {
			id,
			type,
			embedding: encoding.embedding,
			activationLevel: attentionValue.shortTermImportance,
			shortTermImportance: attentionValue.shortTermImportance,
			longTermImportance: attentionValue.longTermImportance,
			truthValue,
			attentionValue,
		};

		this.nodes.set(id, node);
		return node;
	}

	/**
	 * Add a hyperedge connecting multiple nodes.
	 */
	addEdge(
		type: HyperedgeType,
		nodeIds: CognitiveEntityId[],
		options: {
			weight?: number;
			truthValue?: TruthValue;
			metadata?: Record<string, unknown>;
		} = {}
	): Hyperedge {
		for (const nodeId of nodeIds) {
			if (!this.nodes.has(nodeId)) {
				throw new Error(`Node not found: ${nodeId}`);
			}
		}

		const id = `edge-${++this.edgeIdCounter}`;

		const edge: Hyperedge = {
			id,
			type,
			nodes: nodeIds,
			weight: options.weight ?? 1.0,
			truthValue: options.truthValue ?? TruthValueSystem.create(1, 0.9),
			metadata: options.metadata ?? {},
		};

		this.edges.set(id, edge);
		return edge;
	}

	/**
	 * Get a node by ID.
	 */
	getNode(nodeId: CognitiveEntityId): HypergraphNode | undefined {
		return this.nodes.get(nodeId);
	}

	/**
	 * Get an edge by ID.
	 */
	getEdge(edgeId: string): Hyperedge | undefined {
		return this.edges.get(edgeId);
	}

	/**
	 * Get all edges containing a node.
	 */
	getEdgesContaining(nodeId: CognitiveEntityId): Hyperedge[] {
		return Array.from(this.edges.values()).filter((edge) =>
			edge.nodes.includes(nodeId)
		);
	}

	/**
	 * Get connected nodes through edges.
	 */
	getConnectedNodes(
		nodeId: CognitiveEntityId,
		edgeType?: HyperedgeType
	): HypergraphNode[] {
		const connectedIds = new Set<CognitiveEntityId>();

		for (const edge of this.edges.values()) {
			if (edgeType && edge.type !== edgeType) continue;

			if (edge.nodes.includes(nodeId)) {
				for (const id of edge.nodes) {
					if (id !== nodeId) {
						connectedIds.add(id);
					}
				}
			}
		}

		return Array.from(connectedIds)
			.map((id) => this.nodes.get(id)!)
			.filter(Boolean);
	}

	/**
	 * Spread activation through the network.
	 */
	spreadActivation(sourceId: CognitiveEntityId, decayFactor: number = 0.7): void {
		const visited = new Set<CognitiveEntityId>();
		const queue: Array<{ id: CognitiveEntityId; activation: number }> = [];

		const sourceNode = this.nodes.get(sourceId);
		if (!sourceNode) return;

		queue.push({ id: sourceId, activation: sourceNode.activationLevel });

		while (queue.length > 0) {
			const { id, activation } = queue.shift()!;

			if (visited.has(id) || activation < 0.01) continue;
			visited.add(id);

			const connected = this.getConnectedNodes(id);
			const spreadActivation = activation * decayFactor / connected.length;

			for (const connectedNode of connected) {
				if (!visited.has(connectedNode.id)) {
					connectedNode.activationLevel += spreadActivation;
					this.attentionSystem.stimulate(connectedNode.id, spreadActivation);
					queue.push({ id: connectedNode.id, activation: spreadActivation });
				}
			}
		}
	}

	/**
	 * Find nodes by pattern (content similarity).
	 */
	findByPattern(pattern: string, topK: number = 10): HypergraphNode[] {
		const patternId = `pattern-temp-${Date.now()}`;
		this.neuralEncoder.encode(patternId, pattern);

		const similarities: Array<{ node: HypergraphNode; similarity: number }> = [];

		for (const node of this.nodes.values()) {
			const similarity = this.neuralEncoder.similarity(patternId, node.id);
			similarities.push({ node, similarity });
		}

		return similarities
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, topK)
			.map((s) => s.node);
	}

	/**
	 * Perform symbolic inference.
	 */
	infer(
		sourceIds: CognitiveEntityId[],
		inferenceType: 'deduction' | 'induction'
	): TruthValue | undefined {
		if (sourceIds.length < 2) return undefined;

		const truthValues = sourceIds
			.map((id) => this.nodes.get(id)?.truthValue)
			.filter((tv): tv is TruthValue => tv !== undefined);

		if (truthValues.length < 2) return undefined;

		let result = truthValues[0];
		for (let i = 1; i < truthValues.length; i++) {
			result = inferenceType === 'deduction'
				? TruthValueSystem.deduction(result, truthValues[i])
				: TruthValueSystem.induction(result, truthValues[i]);
		}

		return result;
	}

	/**
	 * Get nodes in attentional focus.
	 */
	getAttentionalFocus(): HypergraphNode[] {
		const focusedIds = this.attentionSystem.getAttentionalFocus();
		return focusedIds
			.map((id) => this.nodes.get(id)!)
			.filter(Boolean);
	}

	/**
	 * Apply attention decay to all nodes.
	 */
	applyAttentionDecay(decayRate: number = 0.01): void {
		this.attentionSystem.decay(decayRate);

		for (const node of this.nodes.values()) {
			const av = this.attentionSystem.getAttention(node.id);
			if (av) {
				node.activationLevel = av.shortTermImportance;
				node.shortTermImportance = av.shortTermImportance;
			}
		}
	}

	/**
	 * Get network statistics.
	 */
	getStatistics(): {
		nodeCount: number;
		edgeCount: number;
		nodesByType: Record<CognitiveEntityType, number>;
		edgesByType: Record<HyperedgeType, number>;
		averageActivation: number;
		averageDegree: number;
	} {
		const nodesByType: Partial<Record<CognitiveEntityType, number>> = {};
		const edgesByType: Partial<Record<HyperedgeType, number>> = {};

		let totalActivation = 0;
		for (const node of this.nodes.values()) {
			nodesByType[node.type] = (nodesByType[node.type] ?? 0) + 1;
			totalActivation += node.activationLevel;
		}

		for (const edge of this.edges.values()) {
			edgesByType[edge.type] = (edgesByType[edge.type] ?? 0) + 1;
		}

		const nodeDegrees = new Map<CognitiveEntityId, number>();
		for (const edge of this.edges.values()) {
			for (const nodeId of edge.nodes) {
				nodeDegrees.set(nodeId, (nodeDegrees.get(nodeId) ?? 0) + 1);
			}
		}

		const totalDegree = Array.from(nodeDegrees.values()).reduce((sum, d) => sum + d, 0);

		return {
			nodeCount: this.nodes.size,
			edgeCount: this.edges.size,
			nodesByType: nodesByType as Record<CognitiveEntityType, number>,
			edgesByType: edgesByType as Record<HyperedgeType, number>,
			averageActivation: this.nodes.size > 0 ? totalActivation / this.nodes.size : 0,
			averageDegree: this.nodes.size > 0 ? totalDegree / this.nodes.size : 0,
		};
	}

	/**
	 * Get all nodes.
	 */
	getAllNodes(): HypergraphNode[] {
		return Array.from(this.nodes.values());
	}

	/**
	 * Get all edges.
	 */
	getAllEdges(): Hyperedge[] {
		return Array.from(this.edges.values());
	}

	/**
	 * Clear the network.
	 */
	clear(): void {
		this.nodes.clear();
		this.edges.clear();
		this.neuralEncoder.clear();
		this.attentionSystem.clear();
	}
}
