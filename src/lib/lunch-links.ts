import type { LunchPlace } from "@/types/lunch";

function toHttps(url: string) {
  if (url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }

  return url;
}

export function getLunchPlaceExternalUrl(place: Pick<LunchPlace, "id" | "name" | "x" | "y" | "placeUrl">) {
  if (place.placeUrl) {
    return toHttps(place.placeUrl);
  }

  if (place.id) {
    return `https://place.map.kakao.com/${encodeURIComponent(place.id)}`;
  }

  return `https://map.kakao.com/link/map/${encodeURIComponent(place.name)},${place.y},${place.x}`;
}
