import { describe, expect, mock, test } from "bun:test";
import {
  installBrowserZoomPrevention,
  shouldPreventBrowserZoom,
} from "./use-disable-zoom";

type ListenerRegistration = {
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions | EventListenerOptions;
};

const createEventTarget = () => {
  const active = new Map<string, Set<EventListener>>();
  const added: ListenerRegistration[] = [];
  const removed: ListenerRegistration[] = [];

  return {
    added,
    removed,
    addEventListener(
      type: string,
      listener: EventListener,
      options?: boolean | AddEventListenerOptions,
    ) {
      added.push({ type, listener, options });
      const listeners = active.get(type) ?? new Set<EventListener>();
      listeners.add(listener);
      active.set(type, listeners);
    },
    removeEventListener(
      type: string,
      listener: EventListener,
      options?: boolean | EventListenerOptions,
    ) {
      removed.push({ type, listener, options });
      active.get(type)?.delete(listener);
    },
    dispatch(type: string, event: Event) {
      active.get(type)?.forEach((listener) => listener(event));
    },
  };
};

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
    const windowTarget = createEventTarget();
    const documentTarget = createEventTarget();
    const cleanup = installBrowserZoomPrevention(windowTarget, documentTarget);

    expect(
      windowTarget.added.map(({ type, options }) => ({ type, options })),
    ).toEqual([
      { type: "wheel", options: { passive: false } },
      { type: "keydown", options: undefined },
    ]);
    expect(
      documentTarget.added.map(({ type, options }) => ({ type, options })),
    ).toEqual([
      { type: "touchmove", options: { passive: false } },
      { type: "gesturestart", options: { passive: false } },
      { type: "gesturechange", options: { passive: false } },
      { type: "gestureend", options: { passive: false } },
    ]);

    const dispatchCases = [
      [windowTarget, "wheel", { ctrlKey: true }],
      [windowTarget, "keydown", { ctrlKey: true, key: "+" }],
      [documentTarget, "touchmove", { touches: { length: 2 } }],
      [documentTarget, "gesturestart", {}],
    ] as const;
    for (const [target, type, properties] of dispatchCases) {
      const event = { ...properties, preventDefault: mock() };
      target.dispatch(type, event as unknown as Event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    }

    cleanup();
    expect(windowTarget.removed).toHaveLength(2);
    expect(documentTarget.removed).toHaveLength(4);
    for (const [added, removed] of [
      ...windowTarget.added.map(
        (added, index) => [added, windowTarget.removed[index]] as const,
      ),
      ...documentTarget.added.map(
        (added, index) => [added, documentTarget.removed[index]] as const,
      ),
    ]) {
      expect(removed).toMatchObject({
        type: added.type,
        options: undefined,
      });
      expect(removed?.listener).toBe(added.listener);
    }

    for (const [target, type, properties] of dispatchCases) {
      const event = { ...properties, preventDefault: mock() };
      target.dispatch(type, event as unknown as Event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  });
});
