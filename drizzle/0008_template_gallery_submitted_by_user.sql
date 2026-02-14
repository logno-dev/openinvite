ALTER TABLE `template_gallery` ADD `submitted_by_user_id` text;
-- statement-breakpoint
UPDATE `template_gallery`
SET `submitted_by_user_id` = `owner_user_id`
WHERE `submitted_by_user_id` IS NULL
  AND (`submitted_by` IS NULL OR `submitted_by` != 'OpenInvite');
