-- Mad-Lab ML Workbench Extended Tables
-- Migration: 0006_mad_lab_workbench

CREATE TABLE `ml_evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`model_id` text,
	`model_version_id` text,
	`run_id` text,
	`dataset_id` text,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`metrics` text DEFAULT '{}',
	`report_key` text,
	`metadata` text DEFAULT '{}',
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`model_version_id`) REFERENCES `ml_model_versions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`run_id`) REFERENCES `ml_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`dataset_id`) REFERENCES `ml_datasets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_evaluations_user_idx` ON `ml_evaluations` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_evaluations_app_idx` ON `ml_evaluations` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_evaluations_model_idx` ON `ml_evaluations` (`model_id`);--> statement-breakpoint
CREATE INDEX `ml_evaluations_status_idx` ON `ml_evaluations` (`status`);--> statement-breakpoint

CREATE TABLE `ml_training_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`experiment_id` text,
	`run_id` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`config` text DEFAULT '{}',
	`resource_limits` text DEFAULT '{}',
	`log_key` text,
	`checkpoint_key` text,
	`exit_code` integer,
	`error_message` text,
	`retry_count` integer DEFAULT 0,
	`max_retries` integer DEFAULT 3,
	`queued_at` integer DEFAULT CURRENT_TIMESTAMP,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`experiment_id`) REFERENCES `ml_experiments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`run_id`) REFERENCES `ml_runs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_training_jobs_user_idx` ON `ml_training_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_training_jobs_app_idx` ON `ml_training_jobs` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_training_jobs_experiment_idx` ON `ml_training_jobs` (`experiment_id`);--> statement-breakpoint
CREATE INDEX `ml_training_jobs_status_idx` ON `ml_training_jobs` (`status`);--> statement-breakpoint

CREATE TABLE `ml_serving_deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`model_id` text,
	`model_version_id` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'provisioning' NOT NULL,
	`endpoint_url` text,
	`container_config` text DEFAULT '{}',
	`resource_limits` text DEFAULT '{}',
	`replicas` integer DEFAULT 1,
	`request_count` integer DEFAULT 0,
	`last_request_at` integer,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`model_version_id`) REFERENCES `ml_model_versions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_serving_deployments_user_idx` ON `ml_serving_deployments` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_serving_deployments_app_idx` ON `ml_serving_deployments` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_serving_deployments_model_idx` ON `ml_serving_deployments` (`model_id`);--> statement-breakpoint
CREATE INDEX `ml_serving_deployments_status_idx` ON `ml_serving_deployments` (`status`);--> statement-breakpoint

CREATE TABLE `ml_automl_studies` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`experiment_id` text,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`search_space` text DEFAULT '{}',
	`objectives` text DEFAULT '[]',
	`algorithm` text DEFAULT 'moses',
	`max_trials` integer DEFAULT 100,
	`completed_trials` integer DEFAULT 0,
	`best_trial_id` text,
	`best_score` real,
	`metadata` text DEFAULT '{}',
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`experiment_id`) REFERENCES `ml_experiments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_automl_studies_user_idx` ON `ml_automl_studies` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_automl_studies_app_idx` ON `ml_automl_studies` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_automl_studies_experiment_idx` ON `ml_automl_studies` (`experiment_id`);--> statement-breakpoint
CREATE INDEX `ml_automl_studies_status_idx` ON `ml_automl_studies` (`status`);--> statement-breakpoint

CREATE TABLE `ml_automl_trials` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`run_id` text,
	`trial_number` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`parameters` text DEFAULT '{}',
	`metrics` text DEFAULT '{}',
	`score` real,
	`is_pruned` integer DEFAULT false,
	`is_promoted` integer DEFAULT false,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`study_id`) REFERENCES `ml_automl_studies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`run_id`) REFERENCES `ml_runs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_automl_trials_study_idx` ON `ml_automl_trials` (`study_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ml_automl_trials_study_trial_idx` ON `ml_automl_trials` (`study_id`,`trial_number`);--> statement-breakpoint
CREATE INDEX `ml_automl_trials_status_idx` ON `ml_automl_trials` (`status`);--> statement-breakpoint

CREATE TABLE `ml_cognitive_memory_links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`memory_type` text NOT NULL,
	`memory_key` text NOT NULL,
	`content` text,
	`embedding` text,
	`relevance_score` real,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_cognitive_memory_links_user_idx` ON `ml_cognitive_memory_links` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_cognitive_memory_links_app_idx` ON `ml_cognitive_memory_links` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_cognitive_memory_links_entity_idx` ON `ml_cognitive_memory_links` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `ml_cognitive_memory_links_memory_type_idx` ON `ml_cognitive_memory_links` (`memory_type`);--> statement-breakpoint

CREATE TABLE `ml_archon_agents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`name` text NOT NULL,
	`description` text,
	`agent_type` text NOT NULL,
	`capabilities` text DEFAULT '[]',
	`tools` text DEFAULT '[]',
	`objectives` text DEFAULT '[]',
	`memory_scope` text DEFAULT 'project',
	`safety_limits` text DEFAULT '{}',
	`is_active` integer DEFAULT true,
	`usage_count` integer DEFAULT 0,
	`last_used_at` integer,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_archon_agents_user_idx` ON `ml_archon_agents` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_archon_agents_app_idx` ON `ml_archon_agents` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_archon_agents_type_idx` ON `ml_archon_agents` (`agent_type`);--> statement-breakpoint
CREATE INDEX `ml_archon_agents_is_active_idx` ON `ml_archon_agents` (`is_active`);--> statement-breakpoint

CREATE TABLE `ml_autonomy_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`app_id` text,
	`report_type` text NOT NULL,
	`status` text DEFAULT 'unknown' NOT NULL,
	`summary` text,
	`suggestions` text DEFAULT '[]',
	`metrics` text DEFAULT '{}',
	`acknowledged_at` integer,
	`acknowledged_by` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`acknowledged_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_autonomy_reports_user_idx` ON `ml_autonomy_reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_autonomy_reports_app_idx` ON `ml_autonomy_reports` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_autonomy_reports_type_idx` ON `ml_autonomy_reports` (`report_type`);--> statement-breakpoint
CREATE INDEX `ml_autonomy_reports_status_idx` ON `ml_autonomy_reports` (`status`);--> statement-breakpoint
CREATE INDEX `ml_autonomy_reports_created_at_idx` ON `ml_autonomy_reports` (`created_at`);
