import type { Metadata } from "next";
import { WritePostClient } from "./write-post-client";

export const metadata: Metadata = {
  title: "글쓰기 | ASSIST 11기",
  description: "새 게시글 작성",
};

export default function WritePostPage() {
  return <WritePostClient />;
}
