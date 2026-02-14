CREATE TABLE `template_gallery` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_user_id` text NOT NULL,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `thumbnail_url` text,
  `repo_url` text,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
);
