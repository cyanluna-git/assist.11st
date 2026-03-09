import type { Metadata } from "next";
import { WriteThesisClient } from "./write-thesis-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "논문 등록 | ASSIST 11기",
  description: "새 논문 등록",
};

export default function WriteThesisPage() {
  return <WriteThesisClient />;
}
