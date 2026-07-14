import { describe, expect, mock, test } from "bun:test";

let runEffect: (() => void | (() => void)) | undefined;
mock.module("react", () => ({
  useEffect: (effect: () => void | (() => void)) => {
    runEffect = effect;
  },
}));

const { shouldPreventBrowserZoom, useDisableZoom } =
  await import("./use-disable-zoom");

describe("browser zoom prevention", () => {
  test("prevents modified wheel zoom gestures", () => {
    expect(shouldPreventBrowserZoom({ ctrlKey: true })).toBe(true);
    expect(shouldPreventBrowserZoom({ metaKey: true })).toBe(true);
  });

  test("prevents multi-touch pinch gestures", () => {
    expect(shouldPreventBrowserZoom({ touches: { length: 2 } })).toBe(true);
    expect(shouldPreventBrowserZoom({ scale: 1.5 })).toBe(true);
  });

  test("allows ordinary one-finger touch and wheel movement", () => {
    expect(shouldPreventBrowserZoom({ touches: { length: 1 } })).toBe(false);
    expect(shouldPreventBrowserZoom({ scale: 1 })).toBe(false);
    expect(shouldPreventBrowserZoom({})).toBe(false);
  });

  test("registers zoom blockers and removes every listener on cleanup", () => {
    const windowListeners = new Map<string, EventListener>();
    const documentListeners = new Map<string, EventListener>();
    const removedWindowListeners: string[] = [];
    const removedDocumentListeners: string[] = [];
    const eventTarget = (
      listeners: Map<string, EventListener>,
      removed: string[],
    ) => ({
      addEventListener: (type: string, listener: EventListener) =>
        listeners.set(type, listener),
      removeEventListener: (type: string) => removed.push(type),
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: eventTarget(windowListeners, removedWindowListeners),
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: eventTarget(documentListeners, removedDocumentListeners),
    });

    try {
      useDisableZoom();
      expect(runEffect).toBeFunction();
      const cleanup = runEffect?.();
      expect(windowListeners.keys().toArray()).toEqual(["wheel", "keydown"]);
      expect(documentListeners.keys().toArray()).toEqual([
        "touchmove",
        "gesturestart",
        "gesturechange",
        "gestureend",
      ]);

      for (const [type, listener] of [
        ["wheel", windowListeners.get("wheel")],
        ["keydown", windowListeners.get("keydown")],
        ["touchmove", documentListeners.get("touchmove")],
        ["gesturestart", documentListeners.get("gesturestart")],
      ] as const) {
        const event = {
          ctrlKey: type === "wheel" || type === "keydown",
          key: type === "keydown" ? "+" : undefined,
          touches: type === "touchmove" ? { length: 2 } : undefined,
          preventDefault: mock(),
        };
        listener?.(event as unknown as Event);
        expect(event.preventDefault).toHaveBeenCalled();
      }

      expect(cleanup).toBeFunction();
      cleanup?.();
      expect(removedWindowListeners).toEqual(["wheel", "keydown"]);
      expect(removedDocumentListeners).toEqual([
        "touchmove",
        "gesturestart",
        "gesturechange",
        "gestureend",
      ]);
    } finally {
      Reflect.deleteProperty(globalThis, "window");
      Reflect.deleteProperty(globalThis, "document");
    }
  });
});
