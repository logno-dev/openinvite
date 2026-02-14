ALTER TABLE `invitation_details` ADD `registry_link` text;--> statement-breakpoint
ALTER TABLE `template_gallery` ADD `submitted_by` text;--> statement-breakpoint
ALTER TABLE `template_gallery` ADD `submitted_by_user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `template_gallery` ADD `tags` text;