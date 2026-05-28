import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Schema enum arrays derived from config types  
const REASONING_EFFORT_VALUES = ['low', 'medium', 'high'] as const;
const PROVIDER_OVERRIDE_VALUES = ['cloudflare', 'direct'] as const;

// ========================================
// CORE USER AND IDENTITY MANAGEMENT
// ========================================

/**
 * Users table - Core user identity and profile information
 * Supports OAuth providers and user preferences
 */
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').unique(), // Optional username for public identity
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    
    // OAuth and Authentication
    provider: text('provider').notNull(), // 'github', 'google', 'email'
    providerId: text('provider_id').notNull(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
    passwordHash: text('password_hash'), // Only for provider: 'email'
    
    // Security enhancements
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    lockedUntil: integer('locked_until', { mode: 'timestamp' }),
    passwordChangedAt: integer('password_changed_at', { mode: 'timestamp' }),
    
    // User Preferences and Settings
    preferences: text('preferences', { mode: 'json' }).default('{}'),
    theme: text('theme', { enum: ['light', 'dark', 'system'] }).default('system'),
    timezone: text('timezone').default('UTC'),
    
    // Account Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    isSuspended: integer('is_suspended', { mode: 'boolean' }).default(false),
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastActiveAt: integer('last_active_at', { mode: 'timestamp' }),
    
    // Soft delete
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    providerIdx: uniqueIndex('users_provider_unique_idx').on(table.provider, table.providerId),
    usernameIdx: index('users_username_idx').on(table.username),
    failedLoginAttemptsIdx: index('users_failed_login_attempts_idx').on(table.failedLoginAttempts),
    lockedUntilIdx: index('users_locked_until_idx').on(table.lockedUntil),
    isActiveIdx: index('users_is_active_idx').on(table.isActive),
    lastActiveAtIdx: index('users_last_active_at_idx').on(table.lastActiveAt),
}));

/**
 * Sessions table - JWT session management with refresh token support
 */
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Session Details
    deviceInfo: text('device_info'),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    
    // Security metadata
    isRevoked: integer('is_revoked', { mode: 'boolean' }).default(false),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    revokedReason: text('revoked_reason'),
    
    // Token Management
    accessTokenHash: text('access_token_hash').notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    
    // Timing
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastActivity: integer('last_activity', { mode: 'timestamp' }),
}, (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
    accessTokenHashIdx: index('sessions_access_token_hash_idx').on(table.accessTokenHash),
    refreshTokenHashIdx: index('sessions_refresh_token_hash_idx').on(table.refreshTokenHash),
    lastActivityIdx: index('sessions_last_activity_idx').on(table.lastActivity),
    isRevokedIdx: index('sessions_is_revoked_idx').on(table.isRevoked),
}));

/**
 * API Keys table - Manage user API keys for programmatic access
 */
export const apiKeys = sqliteTable('api_keys', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Key Details
    name: text('name').notNull(), // User-friendly name for the API key
    keyHash: text('key_hash').notNull().unique(), // Hashed API key for security
    keyPreview: text('key_preview').notNull(), // First few characters for display (e.g., "sk_prod_1234...")
    
    // Security and Access Control
    scopes: text('scopes').notNull(), // JSON array of allowed scopes
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    
    // Usage Tracking
    lastUsed: integer('last_used', { mode: 'timestamp' }),
    requestCount: integer('request_count').default(0), // Track usage
    
    // Timing
    expiresAt: integer('expires_at', { mode: 'timestamp' }), // Optional expiration
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdIdx: index('api_keys_user_id_idx').on(table.userId),
    keyHashIdx: index('api_keys_key_hash_idx').on(table.keyHash),
    isActiveIdx: index('api_keys_is_active_idx').on(table.isActive),
    expiresAtIdx: index('api_keys_expires_at_idx').on(table.expiresAt),
}));

// ========================================
// CORE APP AND GENERATION SYSTEM
// ========================================

/**
 * Apps table - Generated applications with comprehensive metadata
 */
export const apps = sqliteTable('apps', {
    id: text('id').primaryKey(),
    
    // App Identity
    title: text('title').notNull(),
    description: text('description'),
    iconUrl: text('icon_url'), // App icon URL
    
    // Original Generation Data
    originalPrompt: text('original_prompt').notNull(), // The user's original request
    finalPrompt: text('final_prompt'), // The processed/refined prompt used for generation
    
    // Generated Content  
    framework: text('framework'), // 'react', 'vue', 'svelte', etc.
    
    // Ownership and Context
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // Null for anonymous
    sessionToken: text('session_token'), // For anonymous users
    
    // Visibility and Sharing
    visibility: text('visibility', { enum: ['private', 'public'] }).notNull().default('private'),
    
    // Status and State
    status: text('status', { enum: ['generating', 'completed'] }).notNull().default('generating'),
    
    // Deployment Information
    deploymentId: text('deployment_id'), // Deployment ID (extracted from deployment URL)
    
    // GitHub Repository Integration
    githubRepositoryUrl: text('github_repository_url'), // GitHub repository URL
    githubRepositoryVisibility: text('github_repository_visibility', { enum: ['public', 'private'] }), // Repository visibility
    
    // App Metadata
    isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
    isFeatured: integer('is_featured', { mode: 'boolean' }).default(false), // Featured by admins
    
    // Versioning (for future support)
    version: integer('version').default(1),
    parentAppId: text('parent_app_id'), // If forked from another app
    
    // Screenshot Information
    screenshotUrl: text('screenshot_url'), // URL to saved screenshot image
    screenshotCapturedAt: integer('screenshot_captured_at', { mode: 'timestamp' }), // When screenshot was last captured
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastDeployedAt: integer('last_deployed_at', { mode: 'timestamp' }),
}, (table) => ({
    userIdx: index('apps_user_idx').on(table.userId),
    statusIdx: index('apps_status_idx').on(table.status),
    visibilityIdx: index('apps_visibility_idx').on(table.visibility),
    sessionTokenIdx: index('apps_session_token_idx').on(table.sessionToken),
    parentAppIdx: index('apps_parent_app_idx').on(table.parentAppId),
    // Performance indexes for common queries
    searchIdx: index('apps_search_idx').on(table.title, table.description),
    frameworkStatusIdx: index('apps_framework_status_idx').on(table.framework, table.status),
    visibilityStatusIdx: index('apps_visibility_status_idx').on(table.visibility, table.status),
    createdAtIdx: index('apps_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('apps_updated_at_idx').on(table.updatedAt),
}));

/**
 * Favorites table - Track user favorite apps
 */
export const favorites = sqliteTable('favorites', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userAppIdx: uniqueIndex('favorites_user_app_idx').on(table.userId, table.appId),
    userIdx: index('favorites_user_idx').on(table.userId),
    appIdx: index('favorites_app_idx').on(table.appId),
}));

/**
 * Stars table - Track app stars (like GitHub stars)
 */
export const stars = sqliteTable('stars', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
    starredAt: integer('starred_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userAppIdx: uniqueIndex('stars_user_app_idx').on(table.userId, table.appId),
    userIdx: index('stars_user_idx').on(table.userId),
    appIdx: index('stars_app_idx').on(table.appId),
    appStarredAtIdx: index('stars_app_starred_at_idx').on(table.appId, table.starredAt),
}));

// ========================================
// MAD-LAB ML WORKBENCH
// ========================================

/**
 * ML Datasets table - Dataset metadata for Mad-Lab projects.
 * Dataset bytes and large manifests live in R2; D1 stores searchable metadata.
 */
export const mlDatasets = sqliteTable('ml_datasets', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    sourceType: text('source_type', { enum: ['upload', 'import', 'generated', 'external'] }).notNull().default('upload'),
    format: text('format'),
    status: text('status', { enum: ['registered', 'processing', 'ready', 'failed', 'archived'] }).notNull().default('registered'),
    currentVersionId: text('current_version_id'),
    storageKey: text('storage_key'),
    schemaJson: text('schema_json', { mode: 'json' }),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_datasets_user_idx').on(table.userId),
    appIdx: index('ml_datasets_app_idx').on(table.appId),
    statusIdx: index('ml_datasets_status_idx').on(table.status),
    userNameIdx: index('ml_datasets_user_name_idx').on(table.userId, table.name),
}));

/**
 * ML Dataset Versions table - Immutable dataset snapshots.
 */
export const mlDatasetVersions = sqliteTable('ml_dataset_versions', {
    id: text('id').primaryKey(),
    datasetId: text('dataset_id').notNull().references(() => mlDatasets.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    storageKey: text('storage_key'),
    checksum: text('checksum'),
    rowCount: integer('row_count'),
    byteSize: integer('byte_size'),
    schemaJson: text('schema_json', { mode: 'json' }),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    datasetIdx: index('ml_dataset_versions_dataset_idx').on(table.datasetId),
    datasetVersionIdx: uniqueIndex('ml_dataset_versions_dataset_version_idx').on(table.datasetId, table.version),
}));

/**
 * ML Experiments table - Experiment definitions and tracking metadata.
 */
export const mlExperiments = sqliteTable('ml_experiments', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    datasetId: text('dataset_id').references(() => mlDatasets.id, { onDelete: 'set null' }),
    datasetVersionId: text('dataset_version_id').references(() => mlDatasetVersions.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    targetMetric: text('target_metric'),
    goal: text('goal', { enum: ['maximize', 'minimize'] }).default('maximize'),
    status: text('status', { enum: ['draft', 'running', 'completed', 'failed', 'archived'] }).notNull().default('draft'),
    config: text('config', { mode: 'json' }).default('{}'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_experiments_user_idx').on(table.userId),
    appIdx: index('ml_experiments_app_idx').on(table.appId),
    datasetIdx: index('ml_experiments_dataset_idx').on(table.datasetId),
    statusIdx: index('ml_experiments_status_idx').on(table.status),
}));

/**
 * ML Runs table - Individual training/evaluation executions.
 */
export const mlRuns = sqliteTable('ml_runs', {
    id: text('id').primaryKey(),
    experimentId: text('experiment_id').notNull().references(() => mlExperiments.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    name: text('name'),
    status: text('status', { enum: ['queued', 'running', 'succeeded', 'failed', 'cancelled'] }).notNull().default('queued'),
    runType: text('run_type', { enum: ['training', 'evaluation', 'automl', 'inference'] }).notNull().default('training'),
    parameters: text('parameters', { mode: 'json' }).default('{}'),
    metrics: text('metrics', { mode: 'json' }).default('{}'),
    artifactRootKey: text('artifact_root_key'),
    logKey: text('log_key'),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    experimentIdx: index('ml_runs_experiment_idx').on(table.experimentId),
    userIdx: index('ml_runs_user_idx').on(table.userId),
    appIdx: index('ml_runs_app_idx').on(table.appId),
    statusIdx: index('ml_runs_status_idx').on(table.status),
    createdAtIdx: index('ml_runs_created_at_idx').on(table.createdAt),
}));

/**
 * ML Run Metrics table - Time-series metric observations.
 */
export const mlRunMetrics = sqliteTable('ml_run_metrics', {
    id: text('id').primaryKey(),
    runId: text('run_id').notNull().references(() => mlRuns.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    value: real('value').notNull(),
    step: integer('step'),
    epoch: integer('epoch'),
    timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    runIdx: index('ml_run_metrics_run_idx').on(table.runId),
    runNameIdx: index('ml_run_metrics_run_name_idx').on(table.runId, table.name),
}));

/**
 * ML Artifacts table - R2-backed artifacts produced by templates, runs, and evaluations.
 */
export const mlArtifacts = sqliteTable('ml_artifacts', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    runId: text('run_id').references(() => mlRuns.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['dataset', 'checkpoint', 'model', 'report', 'log', 'template', 'other'] }).notNull().default('other'),
    name: text('name').notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type'),
    byteSize: integer('byte_size'),
    checksum: text('checksum'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_artifacts_user_idx').on(table.userId),
    appIdx: index('ml_artifacts_app_idx').on(table.appId),
    runIdx: index('ml_artifacts_run_idx').on(table.runId),
    kindIdx: index('ml_artifacts_kind_idx').on(table.kind),
}));

/**
 * ML Models table - Registered model families.
 */
export const mlModels = sqliteTable('ml_models', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    taskType: text('task_type'),
    status: text('status', { enum: ['draft', 'training', 'ready', 'deployed', 'archived'] }).notNull().default('draft'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_models_user_idx').on(table.userId),
    appIdx: index('ml_models_app_idx').on(table.appId),
    statusIdx: index('ml_models_status_idx').on(table.status),
}));

/**
 * ML Model Versions table - Model artifacts promoted from runs.
 */
export const mlModelVersions = sqliteTable('ml_model_versions', {
    id: text('id').primaryKey(),
    modelId: text('model_id').notNull().references(() => mlModels.id, { onDelete: 'cascade' }),
    runId: text('run_id').references(() => mlRuns.id, { onDelete: 'set null' }),
    version: text('version').notNull(),
    artifactId: text('artifact_id').references(() => mlArtifacts.id, { onDelete: 'set null' }),
    metrics: text('metrics', { mode: 'json' }).default('{}'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    modelIdx: index('ml_model_versions_model_idx').on(table.modelId),
    modelVersionIdx: uniqueIndex('ml_model_versions_model_version_idx').on(table.modelId, table.version),
    runIdx: index('ml_model_versions_run_idx').on(table.runId),
}));

/**
 * ML Evaluations table - Evaluation reports and benchmarks.
 */
export const mlEvaluations = sqliteTable('ml_evaluations', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    modelId: text('model_id').references(() => mlModels.id, { onDelete: 'set null' }),
    modelVersionId: text('model_version_id').references(() => mlModelVersions.id, { onDelete: 'set null' }),
    runId: text('run_id').references(() => mlRuns.id, { onDelete: 'set null' }),
    datasetId: text('dataset_id').references(() => mlDatasets.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }).notNull().default('pending'),
    metrics: text('metrics', { mode: 'json' }).default('{}'),
    reportKey: text('report_key'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_evaluations_user_idx').on(table.userId),
    appIdx: index('ml_evaluations_app_idx').on(table.appId),
    modelIdx: index('ml_evaluations_model_idx').on(table.modelId),
    statusIdx: index('ml_evaluations_status_idx').on(table.status),
}));

/**
 * ML Training Jobs table - Training job orchestration and lifecycle.
 */
export const mlTrainingJobs = sqliteTable('ml_training_jobs', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    experimentId: text('experiment_id').references(() => mlExperiments.id, { onDelete: 'cascade' }),
    runId: text('run_id').references(() => mlRuns.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    status: text('status', { enum: ['queued', 'provisioning', 'running', 'succeeded', 'failed', 'cancelled'] }).notNull().default('queued'),
    config: text('config', { mode: 'json' }).default('{}'),
    resourceLimits: text('resource_limits', { mode: 'json' }).default('{}'),
    logKey: text('log_key'),
    checkpointKey: text('checkpoint_key'),
    exitCode: integer('exit_code'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0),
    maxRetries: integer('max_retries').default(3),
    queuedAt: integer('queued_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_training_jobs_user_idx').on(table.userId),
    appIdx: index('ml_training_jobs_app_idx').on(table.appId),
    experimentIdx: index('ml_training_jobs_experiment_idx').on(table.experimentId),
    statusIdx: index('ml_training_jobs_status_idx').on(table.status),
}));

/**
 * ML Serving Deployments table - Model serving endpoint lifecycle.
 */
export const mlServingDeployments = sqliteTable('ml_serving_deployments', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    modelId: text('model_id').references(() => mlModels.id, { onDelete: 'set null' }),
    modelVersionId: text('model_version_id').references(() => mlModelVersions.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    status: text('status', { enum: ['provisioning', 'running', 'stopped', 'failed', 'deleted'] }).notNull().default('provisioning'),
    endpointUrl: text('endpoint_url'),
    containerConfig: text('container_config', { mode: 'json' }).default('{}'),
    resourceLimits: text('resource_limits', { mode: 'json' }).default('{}'),
    replicas: integer('replicas').default(1),
    requestCount: integer('request_count').default(0),
    lastRequestAt: integer('last_request_at', { mode: 'timestamp' }),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_serving_deployments_user_idx').on(table.userId),
    appIdx: index('ml_serving_deployments_app_idx').on(table.appId),
    modelIdx: index('ml_serving_deployments_model_idx').on(table.modelId),
    statusIdx: index('ml_serving_deployments_status_idx').on(table.status),
}));

/**
 * ML AutoML Studies table - AutoML/MOSES search orchestration.
 */
export const mlAutomlStudies = sqliteTable('ml_automl_studies', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    experimentId: text('experiment_id').references(() => mlExperiments.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', { enum: ['draft', 'running', 'paused', 'completed', 'failed'] }).notNull().default('draft'),
    searchSpace: text('search_space', { mode: 'json' }).default('{}'),
    objectives: text('objectives', { mode: 'json' }).default('[]'),
    algorithm: text('algorithm', { enum: ['moses', 'optuna', 'grid', 'random'] }).default('moses'),
    maxTrials: integer('max_trials').default(100),
    completedTrials: integer('completed_trials').default(0),
    bestTrialId: text('best_trial_id'),
    bestScore: real('best_score'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_automl_studies_user_idx').on(table.userId),
    appIdx: index('ml_automl_studies_app_idx').on(table.appId),
    experimentIdx: index('ml_automl_studies_experiment_idx').on(table.experimentId),
    statusIdx: index('ml_automl_studies_status_idx').on(table.status),
}));

/**
 * ML AutoML Trials table - Individual AutoML search trials.
 */
export const mlAutomlTrials = sqliteTable('ml_automl_trials', {
    id: text('id').primaryKey(),
    studyId: text('study_id').notNull().references(() => mlAutomlStudies.id, { onDelete: 'cascade' }),
    runId: text('run_id').references(() => mlRuns.id, { onDelete: 'set null' }),
    trialNumber: integer('trial_number').notNull(),
    status: text('status', { enum: ['pending', 'running', 'completed', 'pruned', 'failed'] }).notNull().default('pending'),
    parameters: text('parameters', { mode: 'json' }).default('{}'),
    metrics: text('metrics', { mode: 'json' }).default('{}'),
    score: real('score'),
    isPruned: integer('is_pruned', { mode: 'boolean' }).default(false),
    isPromoted: integer('is_promoted', { mode: 'boolean' }).default(false),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    studyIdx: index('ml_automl_trials_study_idx').on(table.studyId),
    studyTrialIdx: uniqueIndex('ml_automl_trials_study_trial_idx').on(table.studyId, table.trialNumber),
    statusIdx: index('ml_automl_trials_status_idx').on(table.status),
}));

/**
 * ML Cognitive Memory Links table - Marduk memory associations for ML entities.
 */
export const mlCognitiveMemoryLinks = sqliteTable('ml_cognitive_memory_links', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    entityType: text('entity_type', { enum: ['dataset', 'experiment', 'run', 'model', 'evaluation', 'study'] }).notNull(),
    entityId: text('entity_id').notNull(),
    memoryType: text('memory_type', { enum: ['declarative', 'episodic', 'procedural', 'semantic'] }).notNull(),
    memoryKey: text('memory_key').notNull(),
    content: text('content'),
    embedding: text('embedding'),
    relevanceScore: real('relevance_score'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_cognitive_memory_links_user_idx').on(table.userId),
    appIdx: index('ml_cognitive_memory_links_app_idx').on(table.appId),
    entityIdx: index('ml_cognitive_memory_links_entity_idx').on(table.entityType, table.entityId),
    memoryTypeIdx: index('ml_cognitive_memory_links_memory_type_idx').on(table.memoryType),
}));

/**
 * ML Archon Agents table - Registered Archon specialist agents for ML tasks.
 */
export const mlArchonAgents = sqliteTable('ml_archon_agents', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    agentType: text('agent_type', { enum: ['dataset_profiler', 'feature_engineer', 'trainer', 'evaluator', 'hyperopt', 'serving', 'debugger', 'mlops', 'research'] }).notNull(),
    capabilities: text('capabilities', { mode: 'json' }).default('[]'),
    tools: text('tools', { mode: 'json' }).default('[]'),
    objectives: text('objectives', { mode: 'json' }).default('[]'),
    memoryScope: text('memory_scope', { enum: ['user', 'project', 'session'] }).default('project'),
    safetyLimits: text('safety_limits', { mode: 'json' }).default('{}'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    usageCount: integer('usage_count').default(0),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_archon_agents_user_idx').on(table.userId),
    appIdx: index('ml_archon_agents_app_idx').on(table.appId),
    agentTypeIdx: index('ml_archon_agents_type_idx').on(table.agentType),
    isActiveIdx: index('ml_archon_agents_is_active_idx').on(table.isActive),
}));

/**
 * ML Autonomy Reports table - System health and optimization recommendations.
 */
export const mlAutonomyReports = sqliteTable('ml_autonomy_reports', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    reportType: text('report_type', { enum: ['health', 'optimization', 'alert', 'recommendation'] }).notNull(),
    status: text('status', { enum: ['healthy', 'degraded', 'critical', 'unknown'] }).notNull().default('unknown'),
    summary: text('summary'),
    suggestions: text('suggestions', { mode: 'json' }).default('[]'),
    metrics: text('metrics', { mode: 'json' }).default('{}'),
    acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
    acknowledgedBy: text('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('ml_autonomy_reports_user_idx').on(table.userId),
    appIdx: index('ml_autonomy_reports_app_idx').on(table.appId),
    reportTypeIdx: index('ml_autonomy_reports_type_idx').on(table.reportType),
    statusIdx: index('ml_autonomy_reports_status_idx').on(table.status),
    createdAtIdx: index('ml_autonomy_reports_created_at_idx').on(table.createdAt),
}));

// ========================================
// COMMUNITY INTERACTIONS
// ========================================

/**
 * AppLikes table - User likes/reactions on apps
 */
export const appLikes = sqliteTable('app_likes', {
    id: text('id').primaryKey(),
    appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Reaction Details
    reactionType: text('reaction_type').notNull().default('like'), // 'like', 'love', 'helpful', etc.
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    appUserIdx: uniqueIndex('app_likes_app_user_idx').on(table.appId, table.userId),
    userIdx: index('app_likes_user_idx').on(table.userId),
}));

/**
 * CommentLikes table - User likes on comments
 */
export const commentLikes = sqliteTable('comment_likes', {
    id: text('id').primaryKey(),
    commentId: text('comment_id').notNull().references(() => appComments.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Reaction Details
    reactionType: text('reaction_type').notNull().default('like'), // 'like', 'love', 'helpful', etc.
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    commentUserIdx: uniqueIndex('comment_likes_comment_user_idx').on(table.commentId, table.userId),
    userIdx: index('comment_likes_user_idx').on(table.userId),
    commentIdx: index('comment_likes_comment_idx').on(table.commentId),
}));

/**
 * AppComments table - Comments and discussions on apps
 */
export const appComments = sqliteTable('app_comments', {
    id: text('id').primaryKey(),
    appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Comment Content
    content: text('content').notNull(),
    parentCommentId: text('parent_comment_id'), // For threaded comments
    
    // Moderation
    isEdited: integer('is_edited', { mode: 'boolean' }).default(false),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
    
    // Removed likeCount and replyCount - use COUNT() queries with proper indexes instead
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    appIdx: index('app_comments_app_idx').on(table.appId),
    userIdx: index('app_comments_user_idx').on(table.userId),
    parentIdx: index('app_comments_parent_idx').on(table.parentCommentId),
}));

// ========================================
// ANALYTICS AND TRACKING
// ========================================

/**
 * AppViews table - Track app views for analytics
 */
export const appViews = sqliteTable('app_views', {
    id: text('id').primaryKey(),
    appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
    
    // Viewer Information
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // Null for anonymous
    sessionToken: text('session_token'), // For anonymous tracking
    ipAddressHash: text('ip_address_hash'), // Hashed IP for privacy
    
    // View Context
    referrer: text('referrer'),
    userAgent: text('user_agent'),
    deviceType: text('device_type'), // 'desktop', 'mobile', 'tablet'
    
    // Timing
    viewedAt: integer('viewed_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    durationSeconds: integer('duration_seconds'), // How long they viewed
}, (table) => ({
    appIdx: index('app_views_app_idx').on(table.appId),
    userIdx: index('app_views_user_idx').on(table.userId),
    viewedAtIdx: index('app_views_viewed_at_idx').on(table.viewedAt),
    appViewedAtIdx: index('app_views_app_viewed_at_idx').on(table.appId, table.viewedAt),
}));

// ========================================
// OAUTH AND EXTERNAL INTEGRATIONS
// ========================================

/**
 * OAuthStates table - Manage OAuth flow states securely
 */
export const oauthStates = sqliteTable('oauth_states', {
    id: text('id').primaryKey(),
    state: text('state').notNull().unique(), // OAuth state parameter
    provider: text('provider').notNull(), // 'github', 'google', etc.
    
    // Flow Context
    redirectUri: text('redirect_uri'),
    scopes: text('scopes', { mode: 'json' }).default('[]'),
    userId: text('user_id').references(() => users.id), // If linking to existing account
    
    // Security
    codeVerifier: text('code_verifier'), // For PKCE
    nonce: text('nonce'),
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    isUsed: integer('is_used', { mode: 'boolean' }).default(false),
}, (table) => ({
    stateIdx: uniqueIndex('oauth_states_state_idx').on(table.state),
    expiresAtIdx: index('oauth_states_expires_at_idx').on(table.expiresAt),
}));

// ========================================
// NORMALIZED RELATIONSHIPS
// ========================================

/**
 * Auth Attempts table - Security monitoring and rate limiting
 */
export const authAttempts = sqliteTable('auth_attempts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    identifier: text('identifier').notNull(),
    attemptType: text('attempt_type', { 
        enum: ['login', 'register', 'oauth_google', 'oauth_github', 'refresh', 'reset_password'] 
    }).notNull(),
    success: integer('success', { mode: 'boolean' }).notNull(),
    ipAddress: text('ip_address').notNull(),
    userAgent: text('user_agent'),
    attemptedAt: integer('attempted_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    lookupIdx: index('auth_attempts_lookup_idx').on(table.identifier, table.attemptedAt),
    ipIdx: index('auth_attempts_ip_idx').on(table.ipAddress, table.attemptedAt),
    successIdx: index('auth_attempts_success_idx').on(table.success, table.attemptedAt),
    attemptTypeIdx: index('auth_attempts_type_idx').on(table.attemptType, table.attemptedAt),
}));

/**
 * Password Reset Tokens table - Secure password reset functionality
 */
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    used: integer('used', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    lookupIdx: index('password_reset_tokens_lookup_idx').on(table.tokenHash),
    expiryIdx: index('password_reset_tokens_expiry_idx').on(table.expiresAt),
}));

/**
 * Email Verification Tokens table - Email verification functionality
 */
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    email: text('email').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    used: integer('used', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    lookupIdx: index('email_verification_tokens_lookup_idx').on(table.tokenHash),
    expiryIdx: index('email_verification_tokens_expiry_idx').on(table.expiresAt),
}));

/**
 * Verification OTPs table - Store OTP codes for email verification
 */
export const verificationOtps = sqliteTable('verification_otps', {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    otp: text('otp').notNull(), // Hashed OTP code
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    used: integer('used', { mode: 'boolean' }).default(false),
    usedAt: integer('used_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    emailIdx: index('verification_otps_email_idx').on(table.email),
    expiresAtIdx: index('verification_otps_expires_at_idx').on(table.expiresAt),
    usedIdx: index('verification_otps_used_idx').on(table.used),
}));

/**
 * AuditLogs table - Track important changes for compliance
 */
export const auditLogs = sqliteTable('audit_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action').notNull(),
    oldValues: text('old_values', { mode: 'json' }),
    newValues: text('new_values', { mode: 'json' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('audit_logs_user_idx').on(table.userId),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// ========================================
// USER MODEL CONFIGURATIONS
// ========================================

/**
 * User Model Configurations table - User-specific AI model settings that override defaults
 */
export const userModelConfigs = sqliteTable('user_model_configs', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Configuration Details
    agentActionName: text('agent_action_name').notNull(), // Maps to AgentActionKey from config.ts
    modelName: text('model_name'), // Override for AIModels - null means use default
    maxTokens: integer('max_tokens'), // Override max tokens - null means use default
    temperature: real('temperature'), // Override temperature - null means use default
    reasoningEffort: text('reasoning_effort', { enum: REASONING_EFFORT_VALUES }), // Override reasoning effort  
    providerOverride: text('provider_override', { enum: PROVIDER_OVERRIDE_VALUES }), // Override provider
    fallbackModel: text('fallback_model'), // Override fallback model
    
    // Status and Metadata
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userAgentIdx: uniqueIndex('user_model_configs_user_agent_idx').on(table.userId, table.agentActionName),
    userIdx: index('user_model_configs_user_idx').on(table.userId),
    isActiveIdx: index('user_model_configs_is_active_idx').on(table.isActive),
}));

/**
 * User Model Providers table - Custom OpenAI-compatible providers
 */
export const userModelProviders = sqliteTable('user_model_providers', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Provider Details
    name: text('name').notNull(), // User-friendly name (e.g., "My Local Ollama")
    baseUrl: text('base_url').notNull(), // OpenAI-compatible API base URL
    secretId: text('secret_id'),
    
    // Status and Metadata
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userNameIdx: uniqueIndex('user_model_providers_user_name_idx').on(table.userId, table.name),
    userIdx: index('user_model_providers_user_idx').on(table.userId),
    isActiveIdx: index('user_model_providers_is_active_idx').on(table.isActive),
}));

// ========================================
// SYSTEM CONFIGURATION
// ========================================

/**
 * SystemSettings table - Global system configuration
 */
export const systemSettings = sqliteTable('system_settings', {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    value: text('value', { mode: 'json' }),
    description: text('description'),
    
    // Metadata
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedBy: text('updated_by').references(() => users.id),
}, (table) => ({
    keyIdx: uniqueIndex('system_settings_key_idx').on(table.key),
}));

// ========================================
// TYPE EXPORTS FOR APPLICATION USE
// ========================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;

export type AppLike = typeof appLikes.$inferSelect;
export type NewAppLike = typeof appLikes.$inferInsert;

export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;

export type AppComment = typeof appComments.$inferSelect;
export type NewAppComment = typeof appComments.$inferInsert;

export type AppView = typeof appViews.$inferSelect;
export type NewAppView = typeof appViews.$inferInsert;

export type OAuthState = typeof oauthStates.$inferSelect;
export type NewOAuthState = typeof oauthStates.$inferInsert;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

export type AuthAttempt = typeof authAttempts.$inferSelect;
export type NewAuthAttempt = typeof authAttempts.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type UserModelConfig = typeof userModelConfigs.$inferSelect;
export type NewUserModelConfig = typeof userModelConfigs.$inferInsert;
export type UserModelProvider = typeof userModelProviders.$inferSelect;
export type NewUserModelProvider = typeof userModelProviders.$inferInsert;

export type Star = typeof stars.$inferSelect;
export type NewStar = typeof stars.$inferInsert;

export type MlDataset = typeof mlDatasets.$inferSelect;
export type NewMlDataset = typeof mlDatasets.$inferInsert;
export type MlDatasetVersion = typeof mlDatasetVersions.$inferSelect;
export type NewMlDatasetVersion = typeof mlDatasetVersions.$inferInsert;
export type MlExperiment = typeof mlExperiments.$inferSelect;
export type NewMlExperiment = typeof mlExperiments.$inferInsert;
export type MlRun = typeof mlRuns.$inferSelect;
export type NewMlRun = typeof mlRuns.$inferInsert;
export type MlRunMetric = typeof mlRunMetrics.$inferSelect;
export type NewMlRunMetric = typeof mlRunMetrics.$inferInsert;
export type MlArtifact = typeof mlArtifacts.$inferSelect;
export type NewMlArtifact = typeof mlArtifacts.$inferInsert;
export type MlModel = typeof mlModels.$inferSelect;
export type NewMlModel = typeof mlModels.$inferInsert;
export type MlModelVersion = typeof mlModelVersions.$inferSelect;
export type NewMlModelVersion = typeof mlModelVersions.$inferInsert;
export type MlEvaluation = typeof mlEvaluations.$inferSelect;
export type NewMlEvaluation = typeof mlEvaluations.$inferInsert;
export type MlTrainingJob = typeof mlTrainingJobs.$inferSelect;
export type NewMlTrainingJob = typeof mlTrainingJobs.$inferInsert;
export type MlServingDeployment = typeof mlServingDeployments.$inferSelect;
export type NewMlServingDeployment = typeof mlServingDeployments.$inferInsert;
export type MlAutomlStudy = typeof mlAutomlStudies.$inferSelect;
export type NewMlAutomlStudy = typeof mlAutomlStudies.$inferInsert;
export type MlAutomlTrial = typeof mlAutomlTrials.$inferSelect;
export type NewMlAutomlTrial = typeof mlAutomlTrials.$inferInsert;
export type MlCognitiveMemoryLink = typeof mlCognitiveMemoryLinks.$inferSelect;
export type NewMlCognitiveMemoryLink = typeof mlCognitiveMemoryLinks.$inferInsert;
export type MlArchonAgent = typeof mlArchonAgents.$inferSelect;
export type NewMlArchonAgent = typeof mlArchonAgents.$inferInsert;
export type MlAutonomyReport = typeof mlAutonomyReports.$inferSelect;
export type NewMlAutonomyReport = typeof mlAutonomyReports.$inferInsert;
