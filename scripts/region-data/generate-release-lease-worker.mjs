import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";

import { fsyncDirectory } from "./generate-release-durability.mjs";

const LEASE_NAME = ".generate-lease";
const readInput = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};
const identity = (stats) => ({
  dev: String(stats.dev),
  ino: String(stats.ino),
});
const sameIdentity = (stats, expected) =>
  String(stats.dev) === expected.dev && String(stats.ino) === expected.ino;
const inspectRoot = (expected) => {
  const stats = lstatSync(".", { bigint: true });
  if (
    stats.isSymbolicLink() ||
    !stats.isDirectory() ||
    !sameIdentity(stats, expected)
  ) {
    throw new TypeError("staging root identity changed during lease operation");
  }
};
const inspectLease = () => {
  const stats = lstatSync(LEASE_NAME, { bigint: true });
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new TypeError("generation lease must be a regular file");
  }
  const flags =
    constants.O_RDONLY |
    (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
  const descriptor = openSync(LEASE_NAME, flags);
  try {
    const bytes = readFileSync(descriptor);
    const after = lstatSync(LEASE_NAME, { bigint: true });
    if (!after.isFile() || !sameIdentity(after, identity(stats))) {
      throw new TypeError("generation lease changed during read");
    }
    return { bytes, identity: identity(stats) };
  } finally {
    closeSync(descriptor);
  }
};
const validateOwner = (owner) => {
  if (
    !Number.isSafeInteger(owner?.pid) ||
    owner.pid <= 0 ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      owner?.token,
    )
  ) {
    throw new TypeError("generation lease owner metadata is invalid");
  }
};

const acquire = (owner) => {
  validateOwner(owner);
  const temporary = `.lease-${owner.pid}-${owner.token}.tmp`;
  const bytes = Buffer.from(
    JSON.stringify({ pid: owner.pid, token: owner.token }),
  );
  const descriptor = openSync(
    temporary,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
    0o600,
  );
  let temporaryOwned = true;
  const temporaryIdentity = identity(fstatSync(descriptor, { bigint: true }));
  try {
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    const temporaryStats = lstatSync(temporary, { bigint: true });
    try {
      linkSync(temporary, LEASE_NAME);
    } catch (error) {
      if (error?.code === "EEXIST") {
        throw new TypeError("generation lease already exists");
      }
      throw error;
    }
    const leaseStats = lstatSync(LEASE_NAME, { bigint: true });
    if (!sameIdentity(leaseStats, identity(temporaryStats))) {
      throw new TypeError("generation lease activation changed identity");
    }
    unlinkSync(temporary);
    temporaryOwned = false;
    fsyncDirectory(".", "lease-directory-fsync");
    return { owner, identity: identity(leaseStats) };
  } finally {
    try {
      closeSync(descriptor);
    } catch {}
    if (temporaryOwned) {
      try {
        const current = lstatSync(temporary, { bigint: true });
        if (current.isFile() && sameIdentity(current, temporaryIdentity)) {
          unlinkSync(temporary);
        }
      } catch {}
    }
  }
};

const remove = (expectedIdentity, expectedOwner) => {
  const lease = inspectLease();
  if (!sameIdentity(lease.identity, expectedIdentity)) {
    throw new TypeError("generation lease ownership changed before cleanup");
  }
  let owner;
  try {
    owner = JSON.parse(lease.bytes.toString("utf8"));
  } catch {
    throw new TypeError(
      "generation lease owner metadata changed before cleanup",
    );
  }
  if (owner.pid !== expectedOwner.pid || owner.token !== expectedOwner.token) {
    throw new TypeError("generation lease token changed before cleanup");
  }
  unlinkSync(LEASE_NAME);
  fsyncDirectory(".", "lease-directory-fsync");
  return { removed: true };
};

try {
  const input = await readInput();
  inspectRoot(input.expectedIdentity);
  let result;
  if (input.operation === "acquire") result = acquire(input.owner);
  else if (input.operation === "inspect") {
    const lease = inspectLease();
    result = {
      bytes: lease.bytes.toString("base64"),
      identity: lease.identity,
    };
  } else if (input.operation === "remove") {
    result = remove(input.leaseIdentity, input.owner);
  } else throw new TypeError("unsupported generation lease operation");
  inspectRoot(input.expectedIdentity);
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
