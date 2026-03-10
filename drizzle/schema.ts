import { pgTable, foreignKey, text, uuid, timestamp, boolean, integer, unique, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const boardType = pgEnum("board_type", ['notice', 'free', 'column'])
export const rsvpStatus = pgEnum("rsvp_status", ['attending', 'declined', 'maybe'])
export const thesisStatus = pgEnum("thesis_status", ['draft', 'submitted', 'reviewed'])
export const userRole = pgEnum("user_role", ['admin', 'member', 'professor'])


export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: uuid().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const thesis = pgTable("thesis", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authorId: uuid("author_id").notNull(),
	title: text().notNull(),
	abstract: text(),
	field: text(),
	status: thesisStatus().default('draft').notNull(),
	fileUrl: text("file_url"),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "thesis_author_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const comments = pgTable("comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	authorId: uuid("author_id").notNull(),
	parentId: uuid("parent_id"),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "comments_author_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	creatorId: uuid("creator_id").notNull(),
	title: text().notNull(),
	description: text(),
	location: text(),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp("end_at", { withTimezone: true, mode: 'string' }),
	category: text(),
	isRecurring: boolean("is_recurring").default(false).notNull(),
	recurrenceRule: text("recurrence_rule"),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "events_creator_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const groups = pgTable("groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: text(),
	imageUrl: text("image_url"),
	leaderId: uuid("leader_id").notNull(),
	maxMembers: integer("max_members"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.leaderId],
			foreignColumns: [users.id],
			name: "groups_leader_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const albums = pgTable("albums", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	coverImageUrl: text("cover_image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const groupPosts = pgTable("group_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	authorId: uuid("author_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_posts_group_id_groups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "group_posts_author_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const bookmarks = pgTable("bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	targetType: text("target_type").notNull(),
	targetId: uuid("target_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bookmarks_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const groupMembers = pgTable("group_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	userId: uuid("user_id").notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_members_group_id_groups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_members_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const notificationSettings = pgTable("notification_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	enabled: boolean().default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_settings_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text(),
	link: text(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const photos = pgTable("photos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	albumId: uuid("album_id").notNull(),
	uploaderId: uuid("uploader_id").notNull(),
	imageUrl: text("image_url").notNull(),
	caption: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.albumId],
			foreignColumns: [albums.id],
			name: "photos_album_id_albums_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploaderId],
			foreignColumns: [users.id],
			name: "photos_uploader_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const polls = pgTable("polls", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	creatorId: uuid("creator_id").notNull(),
	title: text().notNull(),
	description: text(),
	isMultiple: boolean("is_multiple").default(false).notNull(),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
	closesAt: timestamp("closes_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "polls_creator_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const pollVotes = pgTable("poll_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pollOptionId: uuid("poll_option_id").notNull(),
	userId: uuid("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.pollOptionId],
			foreignColumns: [pollOptions.id],
			name: "poll_votes_poll_option_id_poll_options_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "poll_votes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const invitations = pgTable("invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	role: userRole().default('member').notNull(),
	code: text().notNull(),
	invitedBy: uuid("invited_by"),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "invitations_invited_by_users_id_fk"
		}).onDelete("set null"),
	unique("invitations_code_unique").on(table.code),
]);

export const rssItems = pgTable("rss_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	source: text().notNull(),
	title: text().notNull(),
	summary: text(),
	url: text().notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
});

export const posts = pgTable("posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authorId: uuid("author_id").notNull(),
	boardType: boardType("board_type").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "posts_author_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const reactions = pgTable("reactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "reactions_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reactions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	image: text(),
	password: text(),
	phone: text(),
	company: text(),
	position: text(),
	industry: text(),
	interests: text(),
	bio: text(),
	avatarUrl: text("avatar_url"),
	role: userRole().default('member').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const eventRsvps = pgTable("event_rsvps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: rsvpStatus().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_rsvps_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_rsvps_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const pollOptions = pgTable("poll_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pollId: uuid("poll_id").notNull(),
	text: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.pollId],
			foreignColumns: [polls.id],
			name: "poll_options_poll_id_polls_id_fk"
		}).onDelete("cascade"),
]);

export const thesisReviews = pgTable("thesis_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	thesisId: uuid("thesis_id").notNull(),
	reviewerId: uuid("reviewer_id").notNull(),
	rating: integer(),
	feedback: text(),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.thesisId],
			foreignColumns: [thesis.id],
			name: "thesis_reviews_thesis_id_thesis_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewerId],
			foreignColumns: [users.id],
			name: "thesis_reviews_reviewer_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: uuid().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_userId_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_providerAccountId_pk"}),
]);
