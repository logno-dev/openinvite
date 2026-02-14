ALTER TABLE `template_gallery` ADD `submitted_by` text;
-- statement-breakpoint
UPDATE `template_gallery`
SET `submitted_by` = 'OpenInvite'
WHERE `submitted_by` IS NULL
  AND `url` IN (
    '/templates/studio-minimal.html',
    '/templates/candlelight-modern.html',
    '/templates/garden-party.html'
  );
