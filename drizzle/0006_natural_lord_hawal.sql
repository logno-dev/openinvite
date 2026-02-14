CREATE TABLE `host_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`invitation_id` text NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`used_at` integer,
	`used_by_user_id` text,
	FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `host_invites_token_unique` ON `host_invites` (`token`);--> statement-breakpoint
CREATE TABLE `template_gallery` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`thumbnail_url` text,
	`repo_url` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX "guest_groups_token_unique";--> statement-breakpoint
DROP INDEX "host_invites_token_unique";--> statement-breakpoint
DROP INDEX "invitations_open_rsvp_token_unique";--> statement-breakpoint
DROP INDEX "invitations_preview_token_unique";--> statement-breakpoint
DROP INDEX "sessions_token_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `invitations` ALTER COLUMN "preview_token" TO "preview_token" text NOT NULL DEFAULT lower(hex(randomblob(16)));--> statement-breakpoint
CREATE UNIQUE INDEX `guest_groups_token_unique` ON `guest_groups` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_open_rsvp_token_unique` ON `invitations` (`open_rsvp_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_preview_token_unique` ON `invitations` (`preview_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `invitations` ADD `count_mode` text DEFAULT 'split' NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `template_url_draft` text;--> statement-breakpoint
ALTER TABLE `invitations` ADD `template_url_live` text;--> statement-breakpoint
ALTER TABLE `invitations` ADD `open_rsvp_token` text DEFAULT lower(hex(randomblob(16))) NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation_details` ADD `event_date` text;--> statement-breakpoint
ALTER TABLE `invitation_details` ADD `event_time` text;--> statement-breakpoint
ALTER TABLE `invitation_details` ADD `date_format` text;--> statement-breakpoint
ALTER TABLE `invitation_details` ADD `time_format` text;--> statement-breakpoint
ALTER TABLE `invitation_details` ADD `map_embed` text;--> statement-breakpoint
ALTER TABLE `invitation_details` ADD `notes_2` text;--> statement-breakpoint
ALTER TABLE `invitation_details` ADD `notes_3` text;