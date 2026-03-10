import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

// ────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "member",
  "professor",
]);

export const boardTypeEnum = pgEnum("board_type", [
  "notice",
  "free",
  "column",
]);

export const thesisStatusEnum = pgEnum("thesis_status", [
  "draft",
  "submitted",
  "reviewed",
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "attending",
  "declined",
  "maybe",
]);

// ────────────────────────────────────────────────────────
// 1. users
// ────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  industry: text("industry"),
  interests: text("interests"),
  bio: text("bio"),
  github: text("github"),
  portfolio: text("portfolio"),
  linkedin: text("linkedin"),
  careers: jsonb("careers"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 2. posts
// ────────────────────────────────────────────────────────

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  boardType: boardTypeEnum("board_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 3. comments
// ────────────────────────────────────────────────────────

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 4. reactions
// ────────────────────────────────────────────────────────

export const reactions = pgTable("reactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
});

// ────────────────────────────────────────────────────────
// 5. bookmarks
// ────────────────────────────────────────────────────────

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 6. news_sources
// ────────────────────────────────────────────────────────

export const newsSources = pgTable("news_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  feedUrl: text("feed_url").notNull().unique(),
  category: text("category"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 6-1. news_articles
// ────────────────────────────────────────────────────────

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").references(() => newsSources.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  summary: text("summary"),
  url: text("url").notNull().unique(),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  sharedById: uuid("shared_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  isManual: boolean("is_manual").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 6-2. news_comments
// ────────────────────────────────────────────────────────

export const newsComments = pgTable("news_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => newsArticles.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 7. thesis
// ────────────────────────────────────────────────────────

export const thesis = pgTable("thesis", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  abstract: text("abstract"),
  field: text("field"),
  status: thesisStatusEnum("status").notNull().default("draft"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 8. thesis_reviews
// ────────────────────────────────────────────────────────

export const thesisReviews = pgTable(
  "thesis_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    thesisId: uuid("thesis_id")
      .notNull()
      .references(() => thesis.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating"),
    feedback: text("feedback"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("thesis_reviews_thesis_reviewer_unique").on(
      t.thesisId,
      t.reviewerId,
    ),
  ],
);

// ────────────────────────────────────────────────────────
// 9. albums
// ────────────────────────────────────────────────────────

export const albums = pgTable("albums", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 10. photos
// ────────────────────────────────────────────────────────

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  albumId: uuid("album_id").references(() => albums.id, {
    onDelete: "set null",
  }),
  uploaderId: uuid("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 10-1. photo_comments
// ────────────────────────────────────────────────────────

export const photoComments = pgTable("photo_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  photoId: uuid("photo_id")
    .notNull()
    .references(() => photos.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 11. events
// ────────────────────────────────────────────────────────

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  category: text("category"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule"),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 12. event_rsvps
// ────────────────────────────────────────────────────────

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: rsvpStatusEnum("status").notNull(),
  },
  (t) => [unique("event_rsvps_event_user_unique").on(t.eventId, t.userId)],
);

// ────────────────────────────────────────────────────────
// 13. polls
// ────────────────────────────────────────────────────────

export const polls = pgTable("polls", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isMultiple: boolean("is_multiple").notNull().default(false),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 14. poll_options
// ────────────────────────────────────────────────────────

export const pollOptions = pgTable("poll_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
});

// ────────────────────────────────────────────────────────
// 15. poll_votes
// ────────────────────────────────────────────────────────

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollOptionId: uuid("poll_option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("poll_votes_option_user_unique").on(t.pollOptionId, t.userId)],
);

// ────────────────────────────────────────────────────────
// 16. groups
// ────────────────────────────────────────────────────────

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  imageUrl: text("image_url"),
  leaderId: uuid("leader_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  maxMembers: integer("max_members"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 17. group_members
// ────────────────────────────────────────────────────────

export const groupMembers = pgTable("group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 18. group_posts
// ────────────────────────────────────────────────────────

export const groupPosts = pgTable("group_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 19. notifications
// ────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ────────────────────────────────────────────────────────
// 20. notification_settings
// ────────────────────────────────────────────────────────

export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  enabled: boolean("enabled").notNull().default(true),
});

// ────────────────────────────────────────────────────────
// 21. invitations
// ────────────────────────────────────────────────────────

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email"),
  role: userRoleEnum("role").notNull().default("member"),
  code: text("code").notNull().unique(),
  invitedBy: uuid("invited_by").references(() => users.id, {
    onDelete: "set null",
  }),
  maxUses: integer("max_uses").notNull().default(1),
  useCount: integer("use_count").notNull().default(0),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});
