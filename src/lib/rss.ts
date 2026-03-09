import RSSParser from "rss-parser";

const parser = new RSSParser({
  timeout: 10_000,
  headers: {
    "User-Agent": "ASSIST-11th-RSS/1.0",
  },
});

export interface ParsedArticle {
  title: string;
  url: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
}

export async function parseFeed(feedUrl: string): Promise<ParsedArticle[]> {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? [])
    .filter((item) => item.link && item.title)
    .map((item) => ({
      title: item.title!.trim(),
      url: item.link!.trim(),
      summary: item.contentSnippet?.slice(0, 500) ?? null,
      imageUrl: extractImage(item) ?? null,
      publishedAt: item.isoDate ? new Date(item.isoDate) : null,
    }));
}

function extractImage(
  item: RSSParser.Item & Record<string, unknown>,
): string | null {
  // media:content or media:thumbnail
  const media = item["media:content"] as
    | { $?: { url?: string } }
    | undefined;
  if (media?.$?.url) return media.$.url;

  const thumb = item["media:thumbnail"] as
    | { $?: { url?: string } }
    | undefined;
  if (thumb?.$?.url) return thumb.$.url;

  // enclosure
  const enclosure = item.enclosure as
    | { url?: string; type?: string }
    | undefined;
  if (enclosure?.url && enclosure.type?.startsWith("image")) {
    return enclosure.url;
  }

  return null;
}
