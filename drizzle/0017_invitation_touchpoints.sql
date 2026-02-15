CREATE TABLE `invitation_touchpoints` (
  `id` text PRIMARY KEY NOT NULL,
  `invitation_id` text NOT NULL,
  `kind` text NOT NULL,
  `name` text NOT NULL,
  `collect_rsvp` integer DEFAULT (1) NOT NULL,
  `template_url_draft` text,
  `template_url_live` text,
  `is_active` integer DEFAULT (1) NOT NULL,
  `created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade
);
-- statement-breakpoint
CREATE UNIQUE INDEX `invitation_touchpoints_invitation_kind_unique` ON `invitation_touchpoints` (`invitation_id`, `kind`);
-- statement-breakpoint
CREATE TABLE `invitation_touchpoint_details` (
  `touchpoint_id` text PRIMARY KEY NOT NULL,
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
  `notes_3` text,
  FOREIGN KEY (`touchpoint_id`) REFERENCES `invitation_touchpoints`(`id`) ON UPDATE no action ON DELETE cascade
);
-- statement-breakpoint
INSERT INTO `invitation_touchpoints` (
  `id`,
  `invitation_id`,
  `kind`,
  `name`,
  `collect_rsvp`,
  `template_url_draft`,
  `template_url_live`,
  `is_active`
)
SELECT
  lower(hex(randomblob(16))),
  i.`id`,
  'invitation',
  'Invitation',
  1,
  i.`template_url_draft`,
  i.`template_url_live`,
  1
FROM `invitations` i
WHERE NOT EXISTS (
  SELECT 1
  FROM `invitation_touchpoints` tp
  WHERE tp.`invitation_id` = i.`id`
    AND tp.`kind` = 'invitation'
);
-- statement-breakpoint
INSERT INTO `invitation_touchpoint_details` (
  `touchpoint_id`,
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
  tp.`id`,
  d.`date`,
  d.`time`,
  d.`event_date`,
  d.`event_time`,
  d.`date_format`,
  d.`time_format`,
  d.`location_name`,
  d.`address`,
  d.`map_link`,
  d.`registry_link`,
  d.`map_embed`,
  d.`notes`,
  d.`notes_2`,
  d.`notes_3`
FROM `invitation_touchpoints` tp
LEFT JOIN `invitation_details` d ON d.`invitation_id` = tp.`invitation_id`
WHERE tp.`kind` = 'invitation'
  AND NOT EXISTS (
    SELECT 1
    FROM `invitation_touchpoint_details` td
    WHERE td.`touchpoint_id` = tp.`id`
  );
