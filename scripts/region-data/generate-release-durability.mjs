import { closeSync, constants, fsyncSync, openSync } from "node:fs";

export const fsyncDirectory = (
  path,
  phase,
  {
    failPhase,
    events,
    open = openSync,
    fsync = fsyncSync,
    close = closeSync,
  } = {},
) => {
  let descriptor;
  try {
    descriptor = open(path, constants.O_RDONLY);
    if (failPhase === phase) {
      throw new TypeError(`${phase} injected failure`);
    }
    fsync(descriptor);
    events?.push(phase);
  } finally {
    if (descriptor !== undefined) close(descriptor);
  }
};
