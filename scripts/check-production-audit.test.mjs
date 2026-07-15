import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  AUDIT_MAX_BUFFER_BYTES,
  runProductionAudit,
} from "./check-production-audit.mjs";

const readableAudit = JSON.stringify({
  advisories: {
    1001: { module_name: "moderate-package" },
  },
  metadata: {
    vulnerabilities: { critical: 0, high: 0, moderate: 1, low: 0 },
  },
});

const captureReport = () => {
  const output = [];
  const errors = [];
  return {
    errors,
    output,
    writeError: (message) => errors.push(message),
    writeOutput: (message) => output.push(message),
  };
};

describe("production audit command runner", () => {
  test("runs pnpm with an explicit bounded audit-report buffer", () => {
    const report = captureReport();
    let invocation;

    const exitCode = runProductionAudit({
      ...report,
      spawn: (command, args, options) => {
        invocation = { args, command, options };
        return { status: 1, stderr: "not reported", stdout: readableAudit };
      },
    });

    assert.equal(AUDIT_MAX_BUFFER_BYTES, 16 * 1024 * 1024);
    assert.deepEqual(invocation, {
      command: "pnpm",
      args: ["audit", "--prod", "--json"],
      options: { encoding: "utf8", maxBuffer: AUDIT_MAX_BUFFER_BYTES },
    });
    assert.equal(exitCode, 0);
    assert.deepEqual(report.output, [
      "critical=0 high=0 moderate=1 low=0",
      "advisory packages: moderate-package",
    ]);
    assert.deepEqual(report.errors, []);
  });

  test("reports ENOBUFS without exposing subprocess output or errors", () => {
    const report = captureReport();
    const exitCode = runProductionAudit({
      ...report,
      spawn: () => ({
        error: Object.assign(new Error("ENOBUFS DEPENDENCY_TOKEN=secret"), {
          code: "ENOBUFS",
        }),
        stderr: "DEPENDENCY_TOKEN=secret",
        stdout: "raw audit output",
      }),
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(report.output, []);
    assert.deepEqual(report.errors, ["Production audit result is unreadable."]);
  });

  test("reports unreadable stdout without exposing raw diagnostics", () => {
    const report = captureReport();
    const exitCode = runProductionAudit({
      ...report,
      spawn: () => ({
        status: 1,
        stderr: "DEPENDENCY_TOKEN=secret",
        stdout: "WARN DEPENDENCY_TOKEN=secret",
      }),
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(report.output, []);
    assert.deepEqual(report.errors, ["Production audit result is unreadable."]);
  });

  test("reports a thrown spawn failure without exposing its message", () => {
    const report = captureReport();
    const exitCode = runProductionAudit({
      ...report,
      spawn: () => {
        throw new Error("spawn failed with DEPENDENCY_TOKEN=secret");
      },
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(report.output, []);
    assert.deepEqual(report.errors, ["Production audit result is unreadable."]);
  });

  for (const fixture of [
    {
      name: "rejects a signaled audit process",
      processResult: {
        signal: "SIGTERM",
        status: null,
        stderr: "DEPENDENCY_TOKEN=signaled-secret",
        stdout: readableAudit,
      },
    },
    {
      name: "rejects an abnormal audit process status",
      processResult: {
        signal: null,
        status: 2,
        stderr: "DEPENDENCY_TOKEN=status-secret",
        stdout: readableAudit,
      },
    },
    {
      name: "rejects a missing audit process status",
      processResult: {
        signal: null,
        stderr: "DEPENDENCY_TOKEN=missing-status-secret",
        stdout: readableAudit,
      },
    },
  ]) {
    test(fixture.name, () => {
      const report = captureReport();
      const exitCode = runProductionAudit({
        ...report,
        spawn: () => fixture.processResult,
      });

      assert.equal(exitCode, 1);
      assert.deepEqual(report.output, []);
      assert.deepEqual(report.errors, [
        "Production audit result is unreadable.",
      ]);
    });
  }
});
