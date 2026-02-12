ALTER TABLE `invitations` ADD `template_url` text;--> statement-breakpoint
ALTER TABLE `invitations` ADD `preview_token` text DEFAULT lower(hex(randomblob(16))) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_preview_token_unique` ON `invitations` (`preview_token`);