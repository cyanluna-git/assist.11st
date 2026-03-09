export interface AlbumSummary {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  createdBy: string;
  creatorName: string | null;
  createdAt: string;
  photoCount: number;
}

export interface AlbumDetail {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  createdBy: string;
  creatorName: string | null;
  createdAt: string;
}

export interface Photo {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  uploaderId: string;
  uploaderName: string | null;
  createdAt: string;
}
