# Invitation Platform

This app will act as a personal digital invitation and RSVP management system.

## Functions

- Display an invitation to guests as an html page.
- Manage guests lists and RSVP responses
- Generate unique links for individual guests, or an open link for guests to input their own details.
- Provide quick stats on party and attendees
- allow multiple "hosts" for a party to collaborate and manage invite

## Tech Stack

- Nextjs with tailwind
- Turso for the db
- in-house auth, email/password
- deployed on vercel

## Questions

- How are the invite pages made? I don't really want an elaborate WYSIWYG editor. Should it just be locked to a banner and then rigid party detail points? Should it consume and html page that is served externally with functions to inject the accept/reject functions? Should I hardcode usable templates with configurable variables?
