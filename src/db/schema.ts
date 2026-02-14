import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  timezone: text("timezone").notNull().default("UTC"),
  countMode: text("count_mode").notNull().default("split"),
  templateUrl: text("template_url"),
  templateUrlDraft: text("template_url_draft"),
  templateUrlLive: text("template_url_live"),
  openRsvpToken: text("open_rsvp_token")
    .notNull()
    .unique()
    .default(sql`(lower(hex(randomblob(16))))`),
  previewToken: text("preview_token")
    .notNull()
    .unique()
    .default(sql`(lower(hex(randomblob(16))))`),
  rsvpDeadline: integer("rsvp_deadline", { mode: "timestamp" }),
  maxGuests: integer("max_guests"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const templateGallery = sqliteTable("template_gallery", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  repoUrl: text("repo_url"),
  submittedBy: text("submitted_by"),
  submittedByUserId: text("submitted_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  tags: text("tags"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const invitationDetails = sqliteTable("invitation_details", {
  invitationId: text("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" })
    .primaryKey(),
  date: text("date"),
  time: text("time"),
  eventDate: text("event_date"),
  eventTime: text("event_time"),
  dateFormat: text("date_format"),
  timeFormat: text("time_format"),
  locationName: text("location_name"),
  address: text("address"),
  mapLink: text("map_link"),
  registryLink: text("registry_link"),
  mapEmbed: text("map_embed"),
  notes: text("notes"),
  notes2: text("notes_2"),
  notes3: text("notes_3"),
});

export const invitationHosts = sqliteTable("invitation_hosts", {
  id: text("id").primaryKey(),
  invitationId: text("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("host"),
  canEdit: integer("can_edit", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const hostInvites = sqliteTable("host_invites", {
  id: text("id").primaryKey(),
  invitationId: text("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  usedAt: integer("used_at", { mode: "timestamp" }),
  usedByUserId: text("used_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const rsvpOptions = sqliteTable("rsvp_options", {
  id: text("id").primaryKey(),
  invitationId: text("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  label: text("label").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const guestGroups = sqliteTable("guest_groups", {
  id: text("id").primaryKey(),
  invitationId: text("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  token: text("token").notNull().unique(),
  expectedAdults: integer("expected_adults").notNull().default(0),
  expectedKids: integer("expected_kids").notNull().default(0),
  expectedTotal: integer("expected_total").notNull().default(0),
  openCount: integer("open_count", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const guests = sqliteTable("guests", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => guestGroups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull().default("adult"),
  dietaryNotes: text("dietary_notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const rsvpResponses = sqliteTable("rsvp_responses", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => guestGroups.id, { onDelete: "cascade" }),
  optionKey: text("option_key").notNull(),
  adults: integer("adults").notNull().default(0),
  kids: integer("kids").notNull().default(0),
  total: integer("total").notNull().default(0),
  message: text("message"),
  respondedByUserId: text("responded_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  tags: text("tags"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const contactLists = sqliteTable("contact_lists", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const contactListItems = sqliteTable("contact_list_items", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => contactLists.id, { onDelete: "cascade" }),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});
