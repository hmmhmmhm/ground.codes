import { enumerateManagedFiles } from "./manifest-filesystem.mjs";
import { deterministicGzip, sha256Hex, validateManifest } from "./manifest.mjs";

const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

export const collectReleaseObjectMetadata = async ({
  sourceRoot,
  manifest,
  onObject,
}) => {
  validateManifest(manifest);
  const entries = new Map(manifest.entries.map((entry) => [entry.path, entry]));
  const visitedPaths = new Set();
  const metadata = new Map();
  await enumerateManagedFiles({
    root: sourceRoot,
    onFile: async ({ path, group, contents }) => {
      const entry = entries.get(path);
      const contentHash = sha256Hex(contents);
      if (
        !entry ||
        entry.group !== group ||
        entry.size !== contents.length ||
        entry.sha256 !== contentHash
      ) {
        throw new TypeError(`${path} changed after manifest creation`);
      }
      visitedPaths.add(path);
      if (metadata.has(contentHash)) return;
      const compressed = deterministicGzip(contents);
      if (compressed.length !== entry.compressedSize) {
        throw new TypeError(
          `${path} compression changed after manifest creation`,
        );
      }
      const object = {
        name: `${contentHash}.json.gz`,
        size: compressed.length,
        sha256: sha256Hex(compressed),
      };
      await onObject?.({ ...object, bytes: compressed });
      metadata.set(contentHash, object);
    },
  });
  if (visitedPaths.size !== entries.size) {
    throw new TypeError("source entries changed after manifest creation");
  }
  return Object.fromEntries(
    [...metadata.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .map(([hash, value]) => [hash, value]),
  );
};
