import { describe, expect, test } from "bun:test";
import { shouldPreventBrowserZoom } from "./use-disable-zoom";

describe("browser zoom prevention", () => {
  test("prevents modified wheel zoom gestures", () => {
    expect(shouldPreventBrowserZoom({ ctrlKey: true })).toBe(true);
    expect(shouldPreventBrowserZoom({ metaKey: true })).toBe(true);
  });

  test("prevents multi-touch pinch gestures", () => {
    expect(shouldPreventBrowserZoom({ touches: { length: 2 } })).toBe(true);
  });

  test("allows ordinary one-finger touch and wheel movement", () => {
    expect(shouldPreventBrowserZoom({ touches: { length: 1 } })).toBe(false);
    expect(shouldPreventBrowserZoom({})).toBe(false);
  });
});
