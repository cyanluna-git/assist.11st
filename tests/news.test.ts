import assert from "node:assert/strict";
import test from "node:test";
import { pickDashboardNewsArticles } from "@/lib/news";
import type { NewsArticle } from "@/types/news";

function createArticle(
  id: string,
  sourceId: string | null,
  sourceName: string | null,
): NewsArticle {
  return {
    id,
    title: `기사 ${id}`,
    summary: null,
    url: `https://example.com/${id}`,
    imageUrl: null,
    publishedAt: "2026-03-14T00:00:00.000Z",
    isManual: false,
    createdAt: "2026-03-14T00:00:00.000Z",
    sourceId,
    sourceName,
    sharedById: null,
    sharedByName: null,
    commentCount: 0,
  };
}

test("pickDashboardNewsArticles mixes sources before taking repeats", () => {
  const picked = pickDashboardNewsArticles(
    [
      createArticle("a1", "source-a", "요즘IT"),
      createArticle("a2", "source-a", "요즘IT"),
      createArticle("b1", "source-b", "GeekNews"),
      createArticle("c1", "source-c", "Hacker News"),
      createArticle("b2", "source-b", "GeekNews"),
    ],
    3,
  );

  assert.deepEqual(
    picked.map((article) => article.id),
    ["a1", "b1", "c1"],
  );
});

test("pickDashboardNewsArticles falls back to repeats when sources are limited", () => {
  const picked = pickDashboardNewsArticles(
    [
      createArticle("a1", "source-a", "요즘IT"),
      createArticle("a2", "source-a", "요즘IT"),
      createArticle("b1", "source-b", "GeekNews"),
    ],
    3,
  );

  assert.deepEqual(
    picked.map((article) => article.id),
    ["a1", "b1", "a2"],
  );
});
