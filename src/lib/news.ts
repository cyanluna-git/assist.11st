import type { NewsArticle } from "@/types/news";

function getNewsSourceBucket(article: NewsArticle) {
  return article.sourceId ?? article.sourceName ?? `article:${article.id}`;
}

export function pickDashboardNewsArticles(
  articles: NewsArticle[],
  limit: number,
) {
  if (limit <= 0 || articles.length === 0) {
    return [];
  }

  const grouped = new Map<string, NewsArticle[]>();
  const sourceOrder: string[] = [];

  for (const article of articles) {
    const key = getNewsSourceBucket(article);
    if (!grouped.has(key)) {
      grouped.set(key, []);
      sourceOrder.push(key);
    }
    grouped.get(key)?.push(article);
  }

  const selected: NewsArticle[] = [];

  while (selected.length < limit) {
    let pickedInRound = false;

    for (const key of sourceOrder) {
      const queue = grouped.get(key);
      if (!queue || queue.length === 0) {
        continue;
      }

      selected.push(queue.shift()!);
      pickedInRound = true;

      if (selected.length === limit) {
        break;
      }
    }

    if (!pickedInRound) {
      break;
    }
  }

  return selected;
}
