import type { Metadata } from "next";
import { AlbumDetailClient } from "./album-detail-client";

export const metadata: Metadata = {
  title: "앨범 상세 | ASSIST 11기",
  description: "앨범 상세 보기",
};

export default function AlbumDetailPage() {
  return <AlbumDetailClient />;
}
