import type { Metadata } from "next";
import { EditThesisClient } from "./edit-thesis-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "논문 수정 | ASSIST 11기",
  description: "논문 수정",
};

export default function EditThesisPage() {
  return <EditThesisClient />;
}
