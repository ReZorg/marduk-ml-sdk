/**
 * Archon AI Agent Builder
 *
 * The world's first "Agenteer" - an AI agent specifically designed to
 * autonomously build, refine, and optimize other AI agents.
 */

import type {
	ArchonAgent,
	AgentCapability,
	AgentTool,
	ToolParameter,
	AgentConfiguration,
	AgentStatus,
	AgentMetrics,
	Timestamp,
} from '../types';

// ============================================================================
// Agent Definition Types
// ============================================================================

/**
 * Blueprint for creating a new agent.
 */
export interface AgentBlueprint {
	name: string;
	description: string;
	capabilities: string[];
	tools: string[];
	systemPrompt?: string;
	configuration?: Partial<AgentConfiguration>;
}

/**
 * Agent refinement request.
 */
export interface RefinementRequest {
	agentId: string;
	aspect: 'prompt' | 'tools' | 'configuration';
	feedback: string;
	suggestions?: string[];
}

/**
 * Tool definition for agent capabilities.
 */
export interface ToolDefinition {
	name: string;
	description: string;
	parameters: ToolParameter[];
	implementation?: string;
}

// ============================================================================
// Tool Library
// ============================================================================

/**
 * Library of prebuilt tools for agents.
 */
export class ToolLibrary {
	private tools: Map<string, ToolDefinition> = new Map();
	private categories: Map<string, Set<string>> = new Map();

	constructor() {
		this.initializeBuiltinTools();
	}

	/**
	 * Initialize built-in tools.
	 */
	private initializeBuiltinTools(): void {
		this.register({
			name: 'web_search',
			description: 'Search the web for information',
			parameters: [
				{ name: 'query', type: 'string', description: 'Search query', required: true },
				{ name: 'limit', type: 'number', description: 'Maximum results', required: false, default: 10 },
			],
		}, 'search');

		this.register({
			name: 'read_file',
			description: 'Read contents of a file',
			parameters: [
				{ name: 'path', type: 'string', description: 'File path', required: true },
				{ name: 'encoding', type: 'string', description: 'File encoding', required: false, default: 'utf-8' },
			],
		}, 'file');

		this.register({
			name: 'write_file',
			description: 'Write contents to a file',
			parameters: [
				{ name: 'path', type: 'string', description: 'File path', required: true },
				{ name: 'content', type: 'string', description: 'File content', required: true },
			],
		}, 'file');

		this.register({
			name: 'execute_code',
			description: 'Execute code in a sandboxed environment',
			parameters: [
				{ name: 'language', type: 'string', description: 'Programming language', required: true },
				{ name: 'code', type: 'string', description: 'Code to execute', required: true },
				{ name: 'timeout', type: 'number', description: 'Execution timeout in ms', required: false, default: 30000 },
			],
		}, 'execution');

		this.register({
			name: 'http_request',
			description: 'Make an HTTP request',
			parameters: [
				{ name: 'url', type: 'string', description: 'Request URL', required: true },
				{ name: 'method', type: 'string', description: 'HTTP method', required: false, default: 'GET' },
				{ name: 'headers', type: 'object', description: 'Request headers', required: false },
				{ name: 'body', type: 'string', description: 'Request body', required: false },
			],
		}, 'http');

		this.register({
			name: 'database_query',
			description: 'Execute a database query',
			parameters: [
				{ name: 'query', type: 'string', description: 'SQL query', required: true },
				{ name: 'parameters', type: 'array', description: 'Query parameters', required: false },
			],
		}, 'database');

		this.register({
			name: 'send_message',
			description: 'Send a message to a channel or user',
			parameters: [
				{ name: 'target', type: 'string', description: 'Message target', required: true },
				{ name: 'message', type: 'string', description: 'Message content', required: true },
			],
		}, 'communication');

		this.register({
			name: 'schedule_task',
			description: 'Schedule a task for later execution',
			parameters: [
				{ name: 'task', type: 'string', description: 'Task description', required: true },
				{ name: 'when', type: 'string', description: 'When to execute (ISO date or duration)', required: true },
			],
		}, 'scheduling');

		this.register({
			name: 'memory_store',
			description: 'Store information in agent memory',
			parameters: [
				{ name: 'key', type: 'string', description: 'Memory key', required: true },
				{ name: 'value', type: 'string', description: 'Value to store', required: true },
				{ name: 'type', type: 'string', description: 'Memory type', required: false, default: 'declarative' },
			],
		}, 'memory');

		this.register({
			name: 'memory_recall',
			description: 'Recall information from agent memory',
			parameters: [
				{ name: 'query', type: 'string', description: 'Search query', required: true },
				{ name: 'limit', type: 'number', description: 'Maximum results', required: false, default: 5 },
			],
		}, 'memory');
	}

	/**
	 * Register a tool in the library.
	 */
	register(tool: ToolDefinition, category?: string): void {
		this.tools.set(tool.name, tool);

		if (category) {
			if (!this.categories.has(category)) {
				this.categories.set(category, new Set());
			}
			this.categories.get(category)!.add(tool.name);
		}
	}

	/**
	 * Get a tool by name.
	 */
	get(name: string): ToolDefinition | undefined {
		return this.tools.get(name);
	}

	/**
	 * Get tools by category.
	 */
	getByCategory(category: string): ToolDefinition[] {
		const names = this.categories.get(category);
		if (!names) return [];

		return Array.from(names)
			.map((name) => this.tools.get(name)!)
			.filter(Boolean);
	}

	/**
	 * Get all categories.
	 */
	getCategories(): string[] {
		return Array.from(this.categories.keys());
	}

	/**
	 * Search tools by keyword.
	 */
	search(keyword: string): ToolDefinition[] {
		const lowerKeyword = keyword.toLowerCase();
		return Array.from(this.tools.values()).filter((tool) =>
			tool.name.toLowerCase().includes(lowerKeyword) ||
			tool.description.toLowerCase().includes(lowerKeyword)
		);
	}

	/**
	 * Get all tools.
	 */
	all(): ToolDefinition[] {
		return Array.from(this.tools.values());
	}
}

// ============================================================================
// Agent Templates
// ============================================================================

/**
 * Template for common agent patterns.
 */
export interface AgentTemplate {
	name: string;
	description: string;
	blueprint: AgentBlueprint;
	examples: string[];
}

/**
 * Library of agent templates.
 */
export class AgentTemplateLibrary {
	private templates: Map<string, AgentTemplate> = new Map();

	constructor() {
		this.initializeTemplates();
	}

	/**
	 * Initialize built-in templates.
	 */
	private initializeTemplates(): void {
		this.register({
			name: 'research-assistant',
			description: 'Agent for conducting research and gathering information',
			blueprint: {
				name: 'Research Assistant',
				description: 'Helps with research tasks by searching, analyzing, and summarizing information',
				capabilities: ['search', 'analysis', 'summarization'],
				tools: ['web_search', 'read_file', 'memory_store', 'memory_recall'],
				systemPrompt: 'You are a research assistant. Your role is to help users find, analyze, and understand information. Be thorough in your research, cite sources when possible, and present information clearly.',
				configuration: {
					model: 'gpt-4',
					temperature: 0.3,
					maxTokens: 4096,
					memoryEnabled: true,
					autonomyLevel: 'semi-autonomous',
					learningEnabled: true,
				},
			},
			examples: [
				'Research the latest trends in renewable energy',
				'Find and summarize papers about machine learning',
				'Gather information about competitors in the market',
			],
		});

		this.register({
			name: 'code-assistant',
			description: 'Agent for writing and reviewing code',
			blueprint: {
				name: 'Code Assistant',
				description: 'Helps with coding tasks including writing, reviewing, and debugging code',
				capabilities: ['code-generation', 'code-review', 'debugging'],
				tools: ['read_file', 'write_file', 'execute_code'],
				systemPrompt: 'You are a code assistant. Your role is to help users write, review, and debug code. Follow best practices, write clean and maintainable code, and explain your reasoning.',
				configuration: {
					model: 'gpt-4',
					temperature: 0.1,
					maxTokens: 8192,
					memoryEnabled: true,
					autonomyLevel: 'supervised',
					learningEnabled: true,
				},
			},
			examples: [
				'Write a function to sort an array',
				'Review this code for potential bugs',
				'Help me debug this error',
			],
		});

		this.register({
			name: 'task-automation',
			description: 'Agent for automating repetitive tasks',
			blueprint: {
				name: 'Task Automation Agent',
				description: 'Automates repetitive tasks and workflows',
				capabilities: ['task-execution', 'scheduling', 'workflow-management'],
				tools: ['execute_code', 'http_request', 'schedule_task', 'send_message'],
				systemPrompt: 'You are a task automation agent. Your role is to help users automate repetitive tasks and workflows. Be efficient, handle errors gracefully, and provide clear status updates.',
				configuration: {
					model: 'gpt-4',
					temperature: 0.2,
					maxTokens: 2048,
					memoryEnabled: true,
					autonomyLevel: 'autonomous',
					learningEnabled: true,
				},
			},
			examples: [
				'Set up a daily report generation',
				'Automate data backups',
				'Create a workflow for processing new orders',
			],
		});
	}

	/**
	 * Register a template.
	 */
	register(template: AgentTemplate): void {
		this.templates.set(template.name, template);
	}

	/**
	 * Get a template by name.
	 */
	get(name: string): AgentTemplate | undefined {
		return this.templates.get(name);
	}

	/**
	 * Get all templates.
	 */
	all(): AgentTemplate[] {
		return Array.from(this.templates.values());
	}

	/**
	 * Search templates by keyword.
	 */
	search(keyword: string): AgentTemplate[] {
		const lowerKeyword = keyword.toLowerCase();
		return Array.from(this.templates.values()).filter((template) =>
			template.name.toLowerCase().includes(lowerKeyword) ||
			template.description.toLowerCase().includes(lowerKeyword)
		);
	}
}

// ============================================================================
// Agent Builder
// ============================================================================

/**
 * Builder for creating agents from blueprints.
 */
export class AgentBuilder {
	private toolLibrary: ToolLibrary;
	private agentIdCounter: number = 0;

	constructor(toolLibrary: ToolLibrary) {
		this.toolLibrary = toolLibrary;
	}

	/**
	 * Build an agent from a blueprint.
	 */
	build(blueprint: AgentBlueprint): ArchonAgent {
		const now = Date.now();
		const id = `agent-${++this.agentIdCounter}`;

		const tools = this.resolveTools(blueprint.tools);
		const capabilities = this.resolveCapabilities(blueprint.capabilities);

		const configuration: AgentConfiguration = {
			model: blueprint.configuration?.model ?? 'gpt-4',
			temperature: blueprint.configuration?.temperature ?? 0.7,
			maxTokens: blueprint.configuration?.maxTokens ?? 4096,
			memoryEnabled: blueprint.configuration?.memoryEnabled ?? true,
			autonomyLevel: blueprint.configuration?.autonomyLevel ?? 'semi-autonomous',
			learningEnabled: blueprint.configuration?.learningEnabled ?? false,
		};

		const agent: ArchonAgent = {
			id,
			name: blueprint.name,
			description: blueprint.description,
			version: '1.0.0',
			capabilities,
			tools,
			systemPrompt: blueprint.systemPrompt ?? this.generateSystemPrompt(blueprint),
			configuration,
			status: 'idle',
			metrics: this.initializeMetrics(),
			createdAt: now,
			updatedAt: now,
		};

		return agent;
	}

	/**
	 * Resolve tool names to tool definitions.
	 */
	private resolveTools(toolNames: string[]): AgentTool[] {
		return toolNames
			.map((name) => {
				const definition = this.toolLibrary.get(name);
				if (!definition) return null;

				return {
					name: definition.name,
					description: definition.description,
					parameters: definition.parameters,
					handler: definition.implementation ?? name,
					timeout: 30000,
				};
			})
			.filter((tool): tool is AgentTool => tool !== null);
	}

	/**
	 * Resolve capability names to capability definitions.
	 */
	private resolveCapabilities(capabilityNames: string[]): AgentCapability[] {
		return capabilityNames.map((name) => ({
			name,
			description: `Capability: ${name}`,
			inputSchema: {},
			outputSchema: {},
		}));
	}

	/**
	 * Generate a system prompt from blueprint.
	 */
	private generateSystemPrompt(blueprint: AgentBlueprint): string {
		const capabilities = blueprint.capabilities.join(', ');
		const tools = blueprint.tools.join(', ');

		return `You are ${blueprint.name}. ${blueprint.description} Your capabilities include: ${capabilities}. You have access to the following tools: ${tools}. Be helpful, accurate, and efficient in your responses.`;
	}

	/**
	 * Initialize agent metrics.
	 */
	private initializeMetrics(): AgentMetrics {
		return {
			totalExecutions: 0,
			successRate: 1.0,
			averageExecutionTime: 0,
			tokensUsed: 0,
			toolCalls: 0,
			learningIterations: 0,
		};
	}
}

// ============================================================================
// Agent Refiner
// ============================================================================

/**
 * Refiner for improving agents based on feedback.
 */
export class AgentRefiner {
	/**
	 * Refine an agent's system prompt.
	 */
	refinePrompt(agent: ArchonAgent, feedback: string): ArchonAgent {
		const refinedAgent = { ...agent };

		refinedAgent.systemPrompt = `${agent.systemPrompt}

Additional instructions based on feedback:
${feedback}`;

		refinedAgent.updatedAt = Date.now();
		refinedAgent.version = this.incrementVersion(agent.version);

		return refinedAgent;
	}

	/**
	 * Refine an agent's tools.
	 */
	refineTools(
		agent: ArchonAgent,
		addTools: AgentTool[],
		removeToolNames: string[]
	): ArchonAgent {
		const refinedAgent = { ...agent };

		refinedAgent.tools = [
			...agent.tools.filter((t) => !removeToolNames.includes(t.name)),
			...addTools,
		];

		refinedAgent.updatedAt = Date.now();
		refinedAgent.version = this.incrementVersion(agent.version);

		return refinedAgent;
	}

	/**
	 * Refine an agent's configuration.
	 */
	refineConfiguration(
		agent: ArchonAgent,
		configUpdates: Partial<AgentConfiguration>
	): ArchonAgent {
		const refinedAgent = { ...agent };

		refinedAgent.configuration = {
			...agent.configuration,
			...configUpdates,
		};

		refinedAgent.updatedAt = Date.now();
		refinedAgent.version = this.incrementVersion(agent.version);

		return refinedAgent;
	}

	/**
	 * Increment version string.
	 */
	private incrementVersion(version: string): string {
		const parts = version.split('.').map(Number);
		parts[2] = (parts[2] ?? 0) + 1;
		return parts.join('.');
	}
}

// ============================================================================
// Archon System
// ============================================================================

/**
 * Main Archon AI agent builder system.
 */
export class ArchonSystem {
	private toolLibrary: ToolLibrary;
	private templateLibrary: AgentTemplateLibrary;
	private agentBuilder: AgentBuilder;
	private agentRefiner: AgentRefiner;
	private agents: Map<string, ArchonAgent> = new Map();

	constructor() {
		this.toolLibrary = new ToolLibrary();
		this.templateLibrary = new AgentTemplateLibrary();
		this.agentBuilder = new AgentBuilder(this.toolLibrary);
		this.agentRefiner = new AgentRefiner();
	}

	/**
	 * Get the tool library.
	 */
	getToolLibrary(): ToolLibrary {
		return this.toolLibrary;
	}

	/**
	 * Get the template library.
	 */
	getTemplateLibrary(): AgentTemplateLibrary {
		return this.templateLibrary;
	}

	/**
	 * Create an agent from a blueprint.
	 */
	createAgent(blueprint: AgentBlueprint): ArchonAgent {
		const agent = this.agentBuilder.build(blueprint);
		this.agents.set(agent.id, agent);
		return agent;
	}

	/**
	 * Create an agent from a template.
	 */
	createFromTemplate(templateName: string, overrides?: Partial<AgentBlueprint>): ArchonAgent | undefined {
		const template = this.templateLibrary.get(templateName);
		if (!template) return undefined;

		const blueprint: AgentBlueprint = {
			...template.blueprint,
			...overrides,
		};

		return this.createAgent(blueprint);
	}

	/**
	 * Get an agent by ID.
	 */
	getAgent(agentId: string): ArchonAgent | undefined {
		return this.agents.get(agentId);
	}

	/**
	 * Get all agents.
	 */
	getAllAgents(): ArchonAgent[] {
		return Array.from(this.agents.values());
	}

	/**
	 * Refine an agent.
	 */
	refineAgent(request: RefinementRequest): ArchonAgent | undefined {
		const agent = this.agents.get(request.agentId);
		if (!agent) return undefined;

		let refinedAgent: ArchonAgent;

		switch (request.aspect) {
			case 'prompt':
				refinedAgent = this.agentRefiner.refinePrompt(agent, request.feedback);
				break;
			case 'tools':
				refinedAgent = this.agentRefiner.refineTools(agent, [], []);
				break;
			case 'configuration':
				refinedAgent = this.agentRefiner.refineConfiguration(agent, {});
				break;
			default:
				return agent;
		}

		this.agents.set(refinedAgent.id, refinedAgent);
		return refinedAgent;
	}

	/**
	 * Delete an agent.
	 */
	deleteAgent(agentId: string): boolean {
		return this.agents.delete(agentId);
	}

	/**
	 * Update agent metrics.
	 */
	updateMetrics(agentId: string, execution: {
		success: boolean;
		duration: number;
		tokensUsed: number;
		toolCalls: number;
	}): void {
		const agent = this.agents.get(agentId);
		if (!agent) return;

		const metrics = agent.metrics;
		const totalExecutions = metrics.totalExecutions + 1;

		metrics.totalExecutions = totalExecutions;
		metrics.successRate = (metrics.successRate * (totalExecutions - 1) + (execution.success ? 1 : 0)) / totalExecutions;
		metrics.averageExecutionTime = (metrics.averageExecutionTime * (totalExecutions - 1) + execution.duration) / totalExecutions;
		metrics.tokensUsed += execution.tokensUsed;
		metrics.toolCalls += execution.toolCalls;

		agent.updatedAt = Date.now();
	}

	/**
	 * Recommend tools for a use case.
	 */
	recommendTools(useCase: string): ToolDefinition[] {
		return this.toolLibrary.search(useCase).slice(0, 5);
	}

	/**
	 * Recommend templates for a use case.
	 */
	recommendTemplates(useCase: string): AgentTemplate[] {
		return this.templateLibrary.search(useCase).slice(0, 3);
	}

	/**
	 * Clear all agents.
	 */
	clear(): void {
		this.agents.clear();
	}
}
