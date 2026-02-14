ALTER TABLE `template_gallery` ADD `tags` text;
-- statement-breakpoint
UPDATE `template_gallery`
SET `tags` = 'minimal, editorial, neutral'
WHERE `tags` IS NULL
  AND `url` = '/templates/studio-minimal.html';
-- statement-breakpoint
UPDATE `template_gallery`
SET `tags` = 'moody, evening, modern'
WHERE `tags` IS NULL
  AND `url` = '/templates/candlelight-modern.html';
-- statement-breakpoint
UPDATE `template_gallery`
SET `tags` = 'garden, airy, botanical'
WHERE `tags` IS NULL
  AND `url` = '/templates/garden-party.html';
