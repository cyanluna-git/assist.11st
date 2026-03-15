import assert from "node:assert/strict";
import test from "node:test";
import { getSeoulDateKey, getSeoulWeekday, isSaturdayInSeoul } from "@/lib/seoul-date";

test("isSaturdayInSeoul uses Asia/Seoul instead of local runtime timezone", () => {
  assert.equal(isSaturdayInSeoul(new Date("2026-03-13T14:59:59Z")), false);
  assert.equal(isSaturdayInSeoul(new Date("2026-03-13T15:00:00Z")), true);
  assert.equal(isSaturdayInSeoul(new Date("2026-03-14T14:59:59Z")), true);
  assert.equal(isSaturdayInSeoul(new Date("2026-03-14T15:00:00Z")), false);
});

test("getSeoulWeekday returns the expected short weekday token", () => {
  assert.equal(getSeoulWeekday(new Date("2026-03-13T15:00:00Z")), "Sat");
  assert.equal(getSeoulWeekday(new Date("2026-03-14T15:00:00Z")), "Sun");
});

test("getSeoulDateKey follows the Seoul calendar day boundary", () => {
  assert.equal(getSeoulDateKey(new Date("2026-03-13T14:59:59Z")), "2026-03-13");
  assert.equal(getSeoulDateKey(new Date("2026-03-13T15:00:00Z")), "2026-03-14");
});
