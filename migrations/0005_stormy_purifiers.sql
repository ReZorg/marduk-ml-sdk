CREATE TABLE `ml_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`run_id` text,
	`kind` text DEFAULT 'other' NOT NULL,
	`name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text,
	`byte_size` integer,
	`checksum` text,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`run_id`) REFERENCES `ml_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_artifacts_user_idx` ON `ml_artifacts` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_artifacts_app_idx` ON `ml_artifacts` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_artifacts_run_idx` ON `ml_artifacts` (`run_id`);--> statement-breakpoint
CREATE INDEX `ml_artifacts_kind_idx` ON `ml_artifacts` (`kind`);--> statement-breakpoint
CREATE TABLE `ml_dataset_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset_id` text NOT NULL,
	`version` text NOT NULL,
	`storage_key` text,
	`checksum` text,
	`row_count` integer,
	`byte_size` integer,
	`schema_json` text,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`dataset_id`) REFERENCES `ml_datasets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_dataset_versions_dataset_idx` ON `ml_dataset_versions` (`dataset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ml_dataset_versions_dataset_version_idx` ON `ml_dataset_versions` (`dataset_id`,`version`);--> statement-breakpoint
CREATE TABLE `ml_datasets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`name` text NOT NULL,
	`description` text,
	`source_type` text DEFAULT 'upload' NOT NULL,
	`format` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`current_version_id` text,
	`storage_key` text,
	`schema_json` text,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_datasets_user_idx` ON `ml_datasets` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_datasets_app_idx` ON `ml_datasets` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_datasets_status_idx` ON `ml_datasets` (`status`);--> statement-breakpoint
CREATE INDEX `ml_datasets_user_name_idx` ON `ml_datasets` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `ml_experiments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`dataset_id` text,
	`dataset_version_id` text,
	`name` text NOT NULL,
	`description` text,
	`target_metric` text,
	`goal` text DEFAULT 'maximize',
	`status` text DEFAULT 'draft' NOT NULL,
	`config` text DEFAULT '{}',
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dataset_id`) REFERENCES `ml_datasets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`dataset_version_id`) REFERENCES `ml_dataset_versions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_experiments_user_idx` ON `ml_experiments` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_experiments_app_idx` ON `ml_experiments` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_experiments_dataset_idx` ON `ml_experiments` (`dataset_id`);--> statement-breakpoint
CREATE INDEX `ml_experiments_status_idx` ON `ml_experiments` (`status`);--> statement-breakpoint
CREATE TABLE `ml_model_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`model_id` text NOT NULL,
	`run_id` text,
	`version` text NOT NULL,
	`artifact_id` text,
	`metrics` text DEFAULT '{}',
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`run_id`) REFERENCES `ml_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`artifact_id`) REFERENCES `ml_artifacts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ml_model_versions_model_idx` ON `ml_model_versions` (`model_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ml_model_versions_model_version_idx` ON `ml_model_versions` (`model_id`,`version`);--> statement-breakpoint
CREATE INDEX `ml_model_versions_run_idx` ON `ml_model_versions` (`run_id`);--> statement-breakpoint
CREATE TABLE `ml_models` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`name` text NOT NULL,
	`description` text,
	`task_type` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_models_user_idx` ON `ml_models` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_models_app_idx` ON `ml_models` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_models_status_idx` ON `ml_models` (`status`);--> statement-breakpoint
CREATE TABLE `ml_run_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`name` text NOT NULL,
	`value` real NOT NULL,
	`step` integer,
	`epoch` integer,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`run_id`) REFERENCES `ml_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_run_metrics_run_idx` ON `ml_run_metrics` (`run_id`);--> statement-breakpoint
CREATE INDEX `ml_run_metrics_run_name_idx` ON `ml_run_metrics` (`run_id`,`name`);--> statement-breakpoint
CREATE TABLE `ml_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`experiment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text,
	`name` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`run_type` text DEFAULT 'training' NOT NULL,
	`parameters` text DEFAULT '{}',
	`metrics` text DEFAULT '{}',
	`artifact_root_key` text,
	`log_key` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`experiment_id`) REFERENCES `ml_experiments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ml_runs_experiment_idx` ON `ml_runs` (`experiment_id`);--> statement-breakpoint
CREATE INDEX `ml_runs_user_idx` ON `ml_runs` (`user_id`);--> statement-breakpoint
CREATE INDEX `ml_runs_app_idx` ON `ml_runs` (`app_id`);--> statement-breakpoint
CREATE INDEX `ml_runs_status_idx` ON `ml_runs` (`status`);--> statement-breakpoint
CREATE INDEX `ml_runs_created_at_idx` ON `ml_runs` (`created_at`);