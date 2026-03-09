export type BoardType = "notice" | "free" | "column";

export interface PostSummary {
  id: string;
  title: string;
  content: string;
  boardType: BoardType;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  reactionCount: number;
  commentCount: number;
}

export interface PostDetail extends PostSummary {
  userHasLiked: boolean;
}

export interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
}
