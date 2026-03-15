import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveMobileBottomHref,
  isMoreMenuRoute,
  mobileBottomNavItems,
  mobileMoreMenuGroups,
} from "@/lib/mobile-navigation";

test("mobile bottom nav stays in the agreed order", () => {
  assert.deepEqual(
    mobileBottomNavItems.map((item) => item.label),
    ["홈", "게시판", "점심", "프로필", "더보기"],
  );
});

test("profile tab stays active for both directory and profile detail routes", () => {
  assert.equal(getActiveMobileBottomHref("/directory"), "/directory");
  assert.equal(getActiveMobileBottomHref("/profiles/user-1"), "/directory");
});

test("secondary mobile routes resolve to the more tab", () => {
  assert.equal(getActiveMobileBottomHref("/more"), "/more");
  assert.equal(getActiveMobileBottomHref("/organization"), "/more");
  assert.equal(getActiveMobileBottomHref("/settings/notifications"), "/more");
  assert.equal(getActiveMobileBottomHref("/admin"), "/more");
});

test("more menu route helper recognizes grouped routes only", () => {
  assert.equal(isMoreMenuRoute("/news"), true);
  assert.equal(isMoreMenuRoute("/groups/123"), true);
  assert.equal(isMoreMenuRoute("/posts"), false);
  assert.equal(isMoreMenuRoute("/lunch"), false);
});

test("more menu groups exclude bottom-nav destinations", () => {
  const bottomHrefs = new Set(mobileBottomNavItems.map((item) => item.href));
  const moreHrefs = mobileMoreMenuGroups.flatMap((group) => group.items.map((item) => item.href));

  assert.equal(
    moreHrefs.some((href) => bottomHrefs.has(href)),
    false,
  );
});
