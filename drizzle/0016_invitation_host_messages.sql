CREATE TABLE `invitation_host_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `invitation_id` text NOT NULL,
  `user_id` text NOT NULL,
  `message` text NOT NULL,
  `created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
