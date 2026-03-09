import type { Metadata } from "next";
import { PostsPageClient } from "./posts-page-client";

export const metadata: Metadata = {
  title: "커뮤니티 게시판 | ASSIST 11기",
  description: "ASSIST 11기 커뮤니티 게시판",
};

export default function PostsPage() {
  return <PostsPageClient />;
}
