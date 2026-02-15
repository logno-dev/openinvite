ALTER TABLE `invitation_touchpoints` ADD `title` text;
-- statement-breakpoint
UPDATE `invitation_touchpoints`
SET `title` = COALESCE(
  `title`,
  (SELECT i.`title` FROM `invitations` i WHERE i.`id` = `invitation_touchpoints`.`invitation_id`),
  `name`
)
WHERE `title` IS NULL;
