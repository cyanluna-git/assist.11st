const seoulWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  weekday: "short",
});

const seoulDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getSeoulWeekday(date: Date) {
  return seoulWeekdayFormatter.format(date);
}

export function isSaturdayInSeoul(date: Date = new Date()) {
  return getSeoulWeekday(date) === "Sat";
}

export function getSeoulDateKey(date: Date = new Date()) {
  const parts = seoulDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return "1970-01-01";
  }

  return `${year}-${month}-${day}`;
}

export function getSeoulDayStart(date: Date = new Date()) {
  return new Date(`${getSeoulDateKey(date)}T00:00:00+09:00`);
}
