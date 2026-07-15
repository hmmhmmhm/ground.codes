import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const sha256Hex = (bytes) => createHash("sha256").update(bytes).digest("hex");

const normalizedGzip = (bytes) => {
  const compressed = gzipSync(bytes, { level: 9, mtime: 0 });
  compressed.writeUInt32LE(0, 4);
  compressed[9] = 255;
  return compressed;
};

const COMPRESSOR_GOLDEN_SHA256 =
  "941a4bc214aa7c64e7774aef050f4e4fc0ed5a45220ebbcccf54a4b00d5314ee";
const COMPRESSOR_INPUT_SHA256 =
  "a8f45e88ab5d8f7d6a500500fbd27e8ecbbed4d7bc0f3dec76d98be7bafd778b";
let compressorVerified = false;

const createCompressorVector = () => {
  let input;
  let x = 0x12345678;
  for (let n = 0; n <= 3; n += 1) {
    input = Buffer.alloc((n * 7919) % 65537);
    for (let index = 0; index < input.length; index += 1) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      input[index] = (x + (index % 17 === 0 ? n : 0)) & 255;
    }
  }
  return input;
};

export const assertSupportedNodeMajor = (version) => {
  if (typeof version !== "string" || version.split(".")[0] !== "22") {
    throw new TypeError("deterministic compression requires Node 22");
  }
};

const verifyCompressor = () => {
  if (compressorVerified) return;
  assertSupportedNodeMajor(process.versions.node);
  const vector = createCompressorVector();
  const compressed = normalizedGzip(vector);
  if (
    vector.length !== 23757 ||
    sha256Hex(vector) !== COMPRESSOR_INPUT_SHA256 ||
    compressed.length !== 23785 ||
    sha256Hex(compressed) !== COMPRESSOR_GOLDEN_SHA256
  ) {
    throw new TypeError("Node 22 gzip compressor failed its golden self-check");
  }
  compressorVerified = true;
};

export const deterministicGzip = (bytes) => {
  verifyCompressor();
  return normalizedGzip(bytes);
};
