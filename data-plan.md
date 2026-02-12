# OpenInvite Data Plan

## Core Model

The invitation is the central object. It connects hosts, RSVP rules, guest
groups, and the presentation layer (card/site) that will be defined later.

## Entities

- invitations
  - id
  - ownerUserId
  - title
  - status (draft/live/closed)
  - timezone
  - rsvpDeadline
  - maxGuests
  - createdAt

- invitation_details
  - invitationId
  - date
  - time
  - locationName
  - address
  - mapLink
  - notes

- invitation_hosts
  - invitationId
  - userId
  - role (owner/host)
  - canEdit

- rsvp_options
  - invitationId
  - key
  - label
  - isDefault
  - sortOrder

- guest_groups
  - id
  - invitationId
  - displayName
  - email
  - phone
  - token
  - expectedAdults
  - expectedKids
  - expectedTotal
  - openCount
  - notes

- guests (optional)
  - groupId
  - name
  - ageGroup (adult/kid)
  - dietaryNotes

- rsvp_responses
  - id
  - groupId
  - optionKey
  - adults
  - kids
  - total
  - message
  - respondedByUserId (nullable)
  - updatedAt

- contacts
  - userId
  - name
  - email
  - phone
  - tags

- contact_lists
  - userId
  - name

- contact_list_items
  - listId
  - contactId

## Workflow Notes

- Create invitation → add details → set RSVP options → add hosts → add guest groups.
- Guest link is tokenized at the guest group level and can be revisited to update.
- Host responses on behalf of guests should be recorded via respondedByUserId.
- Guest group is the RSVP unit; individuals are optional child records.
