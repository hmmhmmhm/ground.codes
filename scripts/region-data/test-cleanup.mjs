import { chmod, lstat, readdir, rm } from "node:fs/promises";

const makeWritable = async (path) => {
  let stats;
  try {
    stats = await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (stats.isSymbolicLink()) return;
  if (stats.isDirectory()) {
    await chmod(path, 0o700);
    for (const name of await readdir(path)) {
      await makeWritable(`${path}/${name}`);
    }
  } else if (stats.isFile()) {
    await chmod(path, 0o600);
  }
};

export const removeWritableTree = async (path) => {
  await makeWritable(path);
  await rm(path, { force: true, recursive: true });
};
