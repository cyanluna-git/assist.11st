export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  isManual: boolean;
  createdAt: string;
  sourceId: string | null;
  sourceName: string | null;
  sharedById: string | null;
  sharedByName: string | null;
  commentCount: number;
}

export interface NewsSource {
  id: string;
  name: string;
  category: string | null;
  isSubscribed: boolean;
}

export interface NewsComment {
  id: string;
  articleId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  authorName: string | null;
  authorAvatar: string | null;
}
