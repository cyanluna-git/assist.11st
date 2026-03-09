import type { Metadata } from "next";
import { GalleryPageClient } from "./gallery-page-client";

export const metadata: Metadata = {
  title: "갤러리 | ASSIST 11기",
  description: "ASSIST 11기 사진 갤러리",
};

export default function GalleryPage() {
  return <GalleryPageClient />;
}
