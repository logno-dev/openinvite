ALTER TABLE `invitation_hosts` ADD `notify_on_rsvp` integer DEFAULT (1) NOT NULL;
-- statement-breakpoint
ALTER TABLE `guest_groups` ADD `invite_email_sent_at` integer;
-- statement-breakpoint
ALTER TABLE `guest_groups` ADD `invite_email_last_type` text;
