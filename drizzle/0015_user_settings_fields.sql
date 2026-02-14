ALTER TABLE `users` ADD `phone` text;
-- statement-breakpoint
ALTER TABLE `users` ADD `share_email_with_guests` integer DEFAULT (0) NOT NULL;
