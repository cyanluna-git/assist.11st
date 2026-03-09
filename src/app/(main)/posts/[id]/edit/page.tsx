import type { Metadata } from "next";
import { EditPostClient } from "./edit-post-client";

export const metadata: Metadata = {
  title: "글수정 | ASSIST 11기",
  description: "게시글 수정",
};

export default function EditPostPage() {
  return <EditPostClient />;
}
