import type { Metadata } from "next";
import { PostDetailClient } from "./post-detail-client";

export const metadata: Metadata = {
  title: "게시글 상세 | ASSIST 11기",
  description: "게시글 상세 보기",
};

export default function PostDetailPage() {
  return <PostDetailClient />;
}
