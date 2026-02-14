PRAGMA foreign_keys = OFF;
BEGIN;

CREATE TABLE `__new_users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `password_hash` text NOT NULL,
  `display_name` text,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_users` (`id`, `email`, `password_hash`, `display_name`, `created_at`)
SELECT `id`, `email`, `password_hash`, `display_name`, `created_at`
FROM `users`;
DROP TABLE `users`;
ALTER TABLE `__new_users` RENAME TO `users`;

CREATE TABLE `__new_invitations` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `title` text NOT NULL,
  `status` text NOT NULL DEFAULT 'draft',
  `timezone` text NOT NULL DEFAULT 'UTC',
  `count_mode` text NOT NULL DEFAULT 'split',
  `template_url` text,
  `template_url_draft` text,
  `template_url_live` text,
  `open_rsvp_token` text NOT NULL,
  `preview_token` text NOT NULL,
  `rsvp_deadline` integer,
  `max_guests` integer,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_invitations` (
  `id`,
  `owner_user_id`,
  `title`,
  `status`,
  `timezone`,
  `count_mode`,
  `template_url`,
  `template_url_draft`,
  `template_url_live`,
  `open_rsvp_token`,
  `preview_token`,
  `rsvp_deadline`,
  `max_guests`,
  `created_at`
)
SELECT
  `id`,
  `owner_user_id`,
  `title`,
  COALESCE(`status`, 'draft'),
  COALESCE(`timezone`, 'UTC'),
  COALESCE(`count_mode`, 'split'),
  `template_url`,
  `template_url_draft`,
  `template_url_live`,
  COALESCE(NULLIF(`open_rsvp_token`, ''), lower(hex(randomblob(16)))),
  COALESCE(NULLIF(`preview_token`, ''), lower(hex(randomblob(16)))),
  `rsvp_deadline`,
  `max_guests`,
  `created_at`
FROM `invitations`;
DROP TABLE `invitations`;
ALTER TABLE `__new_invitations` RENAME TO `invitations`;

CREATE TABLE `__new_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `token` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` integer NOT NULL
);
INSERT INTO `__new_sessions` (`id`, `user_id`, `token`, `created_at`, `expires_at`)
SELECT `id`, `user_id`, `token`, `created_at`, `expires_at`
FROM `sessions`;
DROP TABLE `sessions`;
ALTER TABLE `__new_sessions` RENAME TO `sessions`;

CREATE TABLE `__new_contact_lists` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `name` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_contact_lists` (`id`, `user_id`, `name`, `created_at`)
SELECT `id`, `user_id`, `name`, `created_at`
FROM `contact_lists`;
DROP TABLE `contact_lists`;
ALTER TABLE `__new_contact_lists` RENAME TO `contact_lists`;

CREATE TABLE `__new_contacts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `name` text NOT NULL,
  `email` text,
  `phone` text,
  `tags` text,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_contacts` (`id`, `user_id`, `name`, `email`, `phone`, `tags`, `created_at`)
SELECT `id`, `user_id`, `name`, `email`, `phone`, `tags`, `created_at`
FROM `contacts`;
DROP TABLE `contacts`;
ALTER TABLE `__new_contacts` RENAME TO `contacts`;

CREATE TABLE `__new_contact_list_items` (
  `id` text PRIMARY KEY NOT NULL,
  `list_id` text NOT NULL REFERENCES `contact_lists`(`id`) ON DELETE cascade,
  `contact_id` text NOT NULL REFERENCES `contacts`(`id`) ON DELETE cascade,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_contact_list_items` (`id`, `list_id`, `contact_id`, `created_at`)
SELECT `id`, `list_id`, `contact_id`, `created_at`
FROM `contact_list_items`;
DROP TABLE `contact_list_items`;
ALTER TABLE `__new_contact_list_items` RENAME TO `contact_list_items`;

CREATE TABLE `__new_guest_groups` (
  `id` text PRIMARY KEY NOT NULL,
  `invitation_id` text NOT NULL REFERENCES `invitations`(`id`) ON DELETE cascade,
  `display_name` text NOT NULL,
  `email` text,
  `phone` text,
  `token` text NOT NULL,
  `expected_adults` integer NOT NULL DEFAULT 0,
  `expected_kids` integer NOT NULL DEFAULT 0,
  `expected_total` integer NOT NULL DEFAULT 0,
  `open_count` integer NOT NULL DEFAULT false,
  `notes` text,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_guest_groups` (
  `id`,
  `invitation_id`,
  `display_name`,
  `email`,
  `phone`,
  `token`,
  `expected_adults`,
  `expected_kids`,
  `expected_total`,
  `open_count`,
  `notes`,
  `created_at`
)
SELECT
  `id`,
  `invitation_id`,
  `display_name`,
  `email`,
  `phone`,
  `token`,
  `expected_adults`,
  `expected_kids`,
  `expected_total`,
  `open_count`,
  `notes`,
  `created_at`
FROM `guest_groups`;
DROP TABLE `guest_groups`;
ALTER TABLE `__new_guest_groups` RENAME TO `guest_groups`;

CREATE TABLE `__new_guests` (
  `id` text PRIMARY KEY NOT NULL,
  `group_id` text NOT NULL REFERENCES `guest_groups`(`id`) ON DELETE cascade,
  `name` text NOT NULL,
  `age_group` text NOT NULL DEFAULT 'adult',
  `dietary_notes` text,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_guests` (`id`, `group_id`, `name`, `age_group`, `dietary_notes`, `created_at`)
SELECT `id`, `group_id`, `name`, `age_group`, `dietary_notes`, `created_at`
FROM `guests`;
DROP TABLE `guests`;
ALTER TABLE `__new_guests` RENAME TO `guests`;

CREATE TABLE `__new_invitation_hosts` (
  `id` text PRIMARY KEY NOT NULL,
  `invitation_id` text NOT NULL REFERENCES `invitations`(`id`) ON DELETE cascade,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `role` text NOT NULL DEFAULT 'host',
  `can_edit` integer NOT NULL DEFAULT true,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_invitation_hosts` (`id`, `invitation_id`, `user_id`, `role`, `can_edit`, `created_at`)
SELECT `id`, `invitation_id`, `user_id`, `role`, `can_edit`, `created_at`
FROM `invitation_hosts`;
DROP TABLE `invitation_hosts`;
ALTER TABLE `__new_invitation_hosts` RENAME TO `invitation_hosts`;

CREATE TABLE `__new_invitation_details` (
  `invitation_id` text PRIMARY KEY NOT NULL REFERENCES `invitations`(`id`) ON DELETE cascade,
  `date` text,
  `time` text,
  `event_date` text,
  `event_time` text,
  `date_format` text,
  `time_format` text,
  `location_name` text,
  `address` text,
  `map_link` text,
  `registry_link` text,
  `map_embed` text,
  `notes` text,
  `notes_2` text,
  `notes_3` text
);
INSERT INTO `__new_invitation_details` (
  `invitation_id`,
  `date`,
  `time`,
  `event_date`,
  `event_time`,
  `date_format`,
  `time_format`,
  `location_name`,
  `address`,
  `map_link`,
  `registry_link`,
  `map_embed`,
  `notes`,
  `notes_2`,
  `notes_3`
)
SELECT
  `invitation_id`,
  `date`,
  `time`,
  `event_date`,
  `event_time`,
  `date_format`,
  `time_format`,
  `location_name`,
  `address`,
  `map_link`,
  NULL,
  `map_embed`,
  `notes`,
  `notes_2`,
  `notes_3`
FROM `invitation_details`;
DROP TABLE `invitation_details`;
ALTER TABLE `__new_invitation_details` RENAME TO `invitation_details`;

CREATE TABLE `__new_rsvp_responses` (
  `id` text PRIMARY KEY NOT NULL,
  `group_id` text NOT NULL REFERENCES `guest_groups`(`id`) ON DELETE cascade,
  `option_key` text NOT NULL,
  `adults` integer NOT NULL DEFAULT 0,
  `kids` integer NOT NULL DEFAULT 0,
  `total` integer NOT NULL DEFAULT 0,
  `message` text,
  `responded_by_user_id` text REFERENCES `users`(`id`) ON DELETE set null,
  `updated_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_rsvp_responses` (
  `id`,
  `group_id`,
  `option_key`,
  `adults`,
  `kids`,
  `total`,
  `message`,
  `responded_by_user_id`,
  `updated_at`
)
SELECT
  `id`,
  `group_id`,
  `option_key`,
  `adults`,
  `kids`,
  `total`,
  `message`,
  `responded_by_user_id`,
  `updated_at`
FROM `rsvp_responses`;
DROP TABLE `rsvp_responses`;
ALTER TABLE `__new_rsvp_responses` RENAME TO `rsvp_responses`;

CREATE TABLE `__new_host_invites` (
  `id` text PRIMARY KEY NOT NULL,
  `invitation_id` text NOT NULL REFERENCES `invitations`(`id`) ON DELETE cascade,
  `token` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` integer,
  `used_by_user_id` text REFERENCES `users`(`id`) ON DELETE set null
);
INSERT INTO `__new_host_invites` (`id`, `invitation_id`, `token`, `created_at`, `used_at`, `used_by_user_id`)
SELECT `id`, `invitation_id`, `token`, `created_at`, `used_at`, `used_by_user_id`
FROM `host_invites`;
DROP TABLE `host_invites`;
ALTER TABLE `__new_host_invites` RENAME TO `host_invites`;

CREATE TABLE `__new_template_gallery` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `thumbnail_url` text,
  `repo_url` text,
  `submitted_by` text,
  `submitted_by_user_id` text REFERENCES `users`(`id`) ON DELETE set null,
  `tags` text,
  `created_at` integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `__new_template_gallery` (
  `id`,
  `owner_user_id`,
  `name`,
  `url`,
  `thumbnail_url`,
  `repo_url`,
  `submitted_by`,
  `submitted_by_user_id`,
  `tags`,
  `created_at`
)
SELECT
  `id`,
  `owner_user_id`,
  `name`,
  `url`,
  `thumbnail_url`,
  `repo_url`,
  `submitted_by`,
  `submitted_by_user_id`,
  `tags`,
  `created_at`
FROM `template_gallery`;
DROP TABLE `template_gallery`;
ALTER TABLE `__new_template_gallery` RENAME TO `template_gallery`;

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);
CREATE UNIQUE INDEX `invitations_open_rsvp_token_unique` ON `invitations` (`open_rsvp_token`);
CREATE UNIQUE INDEX `invitations_preview_token_unique` ON `invitations` (`preview_token`);
CREATE UNIQUE INDEX `guest_groups_token_unique` ON `guest_groups` (`token`);
CREATE UNIQUE INDEX `host_invites_token_unique` ON `host_invites` (`token`);

COMMIT;
PRAGMA foreign_keys = ON;
