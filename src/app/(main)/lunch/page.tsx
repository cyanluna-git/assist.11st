import { LunchPageClient } from "./lunch-page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "점심 추천 | aSSiST 11기",
};

export default function LunchPage() {
  return (
    <LunchPageClient kakaoJavaScriptKey={process.env.KAKAO_JAVA_KEY?.trim() || null} />
  );
}
