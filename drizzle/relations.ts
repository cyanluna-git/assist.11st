import { relations } from "drizzle-orm/relations";
import { users, sessions, thesis, posts, comments, events, groups, groupPosts, bookmarks, groupMembers, notificationSettings, notifications, albums, photos, polls, pollOptions, pollVotes, invitations, reactions, eventRsvps, thesisReviews, accounts } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	theses: many(thesis),
	comments: many(comments),
	events: many(events),
	groups: many(groups),
	groupPosts: many(groupPosts),
	bookmarks: many(bookmarks),
	groupMembers: many(groupMembers),
	notificationSettings: many(notificationSettings),
	notifications: many(notifications),
	photos: many(photos),
	polls: many(polls),
	pollVotes: many(pollVotes),
	invitations: many(invitations),
	posts: many(posts),
	reactions: many(reactions),
	eventRsvps: many(eventRsvps),
	thesisReviews: many(thesisReviews),
	accounts: many(accounts),
}));

export const thesisRelations = relations(thesis, ({one, many}) => ({
	user: one(users, {
		fields: [thesis.authorId],
		references: [users.id]
	}),
	thesisReviews: many(thesisReviews),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [comments.authorId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	comments: many(comments),
	user: one(users, {
		fields: [posts.authorId],
		references: [users.id]
	}),
	reactions: many(reactions),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	user: one(users, {
		fields: [events.creatorId],
		references: [users.id]
	}),
	eventRsvps: many(eventRsvps),
}));

export const groupsRelations = relations(groups, ({one, many}) => ({
	user: one(users, {
		fields: [groups.leaderId],
		references: [users.id]
	}),
	groupPosts: many(groupPosts),
	groupMembers: many(groupMembers),
}));

export const groupPostsRelations = relations(groupPosts, ({one}) => ({
	group: one(groups, {
		fields: [groupPosts.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupPosts.authorId],
		references: [users.id]
	}),
}));

export const bookmarksRelations = relations(bookmarks, ({one}) => ({
	user: one(users, {
		fields: [bookmarks.userId],
		references: [users.id]
	}),
}));

export const groupMembersRelations = relations(groupMembers, ({one}) => ({
	group: one(groups, {
		fields: [groupMembers.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupMembers.userId],
		references: [users.id]
	}),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({one}) => ({
	user: one(users, {
		fields: [notificationSettings.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const photosRelations = relations(photos, ({one}) => ({
	album: one(albums, {
		fields: [photos.albumId],
		references: [albums.id]
	}),
	user: one(users, {
		fields: [photos.uploaderId],
		references: [users.id]
	}),
}));

export const albumsRelations = relations(albums, ({many}) => ({
	photos: many(photos),
}));

export const pollsRelations = relations(polls, ({one, many}) => ({
	user: one(users, {
		fields: [polls.creatorId],
		references: [users.id]
	}),
	pollOptions: many(pollOptions),
}));

export const pollVotesRelations = relations(pollVotes, ({one}) => ({
	pollOption: one(pollOptions, {
		fields: [pollVotes.pollOptionId],
		references: [pollOptions.id]
	}),
	user: one(users, {
		fields: [pollVotes.userId],
		references: [users.id]
	}),
}));

export const pollOptionsRelations = relations(pollOptions, ({one, many}) => ({
	pollVotes: many(pollVotes),
	poll: one(polls, {
		fields: [pollOptions.pollId],
		references: [polls.id]
	}),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	user: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id]
	}),
}));

export const reactionsRelations = relations(reactions, ({one}) => ({
	post: one(posts, {
		fields: [reactions.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [reactions.userId],
		references: [users.id]
	}),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({one}) => ({
	event: one(events, {
		fields: [eventRsvps.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventRsvps.userId],
		references: [users.id]
	}),
}));

export const thesisReviewsRelations = relations(thesisReviews, ({one}) => ({
	thesis: one(thesis, {
		fields: [thesisReviews.thesisId],
		references: [thesis.id]
	}),
	user: one(users, {
		fields: [thesisReviews.reviewerId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));