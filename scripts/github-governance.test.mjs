import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import {
  OPTIONAL_SECURITY_FEATURES,
  buildMainRuleset,
  buildRepositoryPatch,
  createGhApiClient,
  formatGovernanceResult,
  parseGovernanceArgs,
  runGitHubGovernance,
} from "./github-governance.mjs";

const REPOSITORY = "owner/repository";
const RULESET_ID = 321;

const enabledSecurity = ({ optional = true } = {}) => ({
  secret_scanning: { status: "enabled" },
  secret_scanning_push_protection: { status: "enabled" },
  ...(optional
    ? {
        secret_scanning_non_provider_patterns: { status: "enabled" },
        secret_scanning_validity_checks: { status: "enabled" },
      }
    : {}),
});

const mergeRepositoryPatch = (repository, patch) => ({
  ...repository,
  ...patch,
  security_and_analysis: {
    ...repository.security_and_analysis,
    ...patch.security_and_analysis,
  },
});

const createStatefulApi = ({
  ruleset,
  optional = true,
  failCore,
  dependabot = Boolean(ruleset),
  ignoreOptional = false,
} = {}) => {
  const state = {
    dependabot,
    vulnerabilityAlerts: Boolean(ruleset),
    repository: {
      visibility: "public",
      delete_branch_on_merge: Boolean(ruleset),
      security_and_analysis: ruleset
        ? enabledSecurity({ optional })
        : Object.fromEntries(
            Object.keys(enabledSecurity({ optional })).map((name) => [
              name,
              { status: "disabled" },
            ]),
          ),
    },
    ruleset,
  };
  const calls = [];

  const api = {
    request({ method, endpoint, body }) {
      calls.push({ method, endpoint, body });

      if (method === "GET" && endpoint.endsWith("/rulesets")) {
        return state.ruleset
          ? [{ id: state.ruleset.id, name: state.ruleset.name }]
          : [];
      }
      if (method === "GET" && endpoint.includes("/rulesets/")) {
        return state.ruleset;
      }
      if (method === "POST" && endpoint.endsWith("/rulesets")) {
        state.ruleset = { id: RULESET_ID, ...body };
        return state.ruleset;
      }
      if (method === "PUT" && endpoint.includes("/rulesets/")) {
        state.ruleset = { id: state.ruleset.id, ...body };
        return state.ruleset;
      }
      if (method === "GET" && endpoint.endsWith("/automated-security-fixes")) {
        return { enabled: state.dependabot, paused: false };
      }
      if (method === "PUT" && endpoint.endsWith("/automated-security-fixes")) {
        state.dependabot = true;
        return null;
      }
      if (method === "GET" && endpoint.endsWith("/vulnerability-alerts")) {
        if (!state.vulnerabilityAlerts) throw new Error("disabled");
        return null;
      }
      if (method === "PUT" && endpoint.endsWith("/vulnerability-alerts")) {
        state.vulnerabilityAlerts = true;
        return null;
      }
      if (method === "GET" && endpoint === `/repos/${REPOSITORY}`) {
        return state.repository;
      }
      if (method === "PATCH" && endpoint === `/repos/${REPOSITORY}`) {
        if (
          failCore &&
          body.security_and_analysis?.secret_scanning_push_protection
        ) {
          throw new Error("token=do-not-leak");
        }
        if (
          ignoreOptional &&
          OPTIONAL_SECURITY_FEATURES.some(
            (feature) => body.security_and_analysis?.[feature],
          )
        )
          return state.repository;
        state.repository = mergeRepositoryPatch(state.repository, body);
        return state.repository;
      }

      throw new Error(`Unexpected request: ${method} ${endpoint}`);
    },
  };

  return { api, calls, state };
};

describe("GitHub repository governance", () => {
  test("builds the exact main rules and administrator-only bypass", () => {
    const ruleset = buildMainRuleset();

    assert.equal(ruleset.name, "main-protection");
    assert.equal(ruleset.target, "branch");
    assert.equal(ruleset.enforcement, "active");
    assert.deepEqual(ruleset.conditions.ref_name.include, ["refs/heads/main"]);
    assert.deepEqual(ruleset.conditions.ref_name.exclude, []);
    assert.deepEqual(ruleset.bypass_actors, [
      {
        actor_id: 5,
        actor_type: "RepositoryRole",
        bypass_mode: "always",
      },
    ]);
    assert.deepEqual(ruleset.rules, [
      { type: "deletion" },
      { type: "non_fast_forward" },
      {
        type: "pull_request",
        parameters: {
          dismiss_stale_reviews_on_push: false,
          require_code_owner_review: false,
          require_last_push_approval: false,
          required_approving_review_count: 0,
          required_review_thread_resolution: false,
        },
      },
      {
        type: "required_status_checks",
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [{ context: "verify" }],
        },
      },
    ]);
  });

  test("builds merged-branch deletion and core security-analysis settings", () => {
    assert.deepEqual(buildRepositoryPatch(), {
      delete_branch_on_merge: true,
      security_and_analysis: {
        secret_scanning: { status: "enabled" },
        secret_scanning_push_protection: { status: "enabled" },
      },
    });
    assert.deepEqual(OPTIONAL_SECURITY_FEATURES, [
      "secret_scanning_non_provider_patterns",
      "secret_scanning_validity_checks",
    ]);
  });

  test("creates an absent ruleset and enables every supported setting", () => {
    const { api, calls } = createStatefulApi();

    const result = runGitHubGovernance({
      api,
      mode: "apply",
      repository: REPOSITORY,
    });

    assert.deepEqual(result, {
      rulesetId: RULESET_ID,
      settings: {
        main_protection: "active",
        delete_branch_on_merge: "enabled",
        dependabot_alerts: "enabled",
        dependabot_security_updates: "enabled",
        secret_scanning: "enabled",
        secret_scanning_push_protection: "enabled",
        secret_scanning_non_provider_patterns: "enabled",
        secret_scanning_validity_checks: "enabled",
      },
      warnings: [],
    });
    assert.equal(
      calls.some(
        ({ method, endpoint, body }) =>
          method === "POST" &&
          endpoint === `/repos/${REPOSITORY}/rulesets` &&
          body.name === "main-protection",
      ),
      true,
    );
    const alertsCall = calls.findIndex(
      ({ method, endpoint }) =>
        method === "PUT" && endpoint.endsWith("/vulnerability-alerts"),
    );
    const fixesCall = calls.findIndex(
      ({ method, endpoint }) =>
        method === "PUT" && endpoint.endsWith("/automated-security-fixes"),
    );
    assert.ok(alertsCall !== -1 && alertsCall < fixesCall);
    assert.equal(
      calls.some(
        ({ method, endpoint }) =>
          method === "PUT" && endpoint.includes("/rulesets/"),
      ),
      false,
    );
    assert.equal(
      calls.some(
        ({ method, endpoint }) =>
          method === "PUT" && endpoint.endsWith("/automated-security-fixes"),
      ),
      true,
    );
  });

  test("updates the same exact-name ruleset idempotently", () => {
    const { api, calls } = createStatefulApi({
      ruleset: { id: 42, ...buildMainRuleset(), enforcement: "disabled" },
    });

    const result = runGitHubGovernance({
      api,
      mode: "apply",
      repository: REPOSITORY,
    });

    assert.equal(result.rulesetId, 42);
    assert.equal(
      calls.some(
        ({ method, endpoint }) =>
          method === "PUT" && endpoint === `/repos/${REPOSITORY}/rulesets/42`,
      ),
      true,
    );
    assert.equal(
      calls.some(({ method }) => method === "POST"),
      false,
    );
  });

  test("verify mode reads settings without making mutations", () => {
    const { api, calls } = createStatefulApi({
      ruleset: { id: 42, ...buildMainRuleset() },
    });

    const result = runGitHubGovernance({
      api,
      mode: "verify",
      repository: REPOSITORY,
    });

    assert.equal(result.rulesetId, 42);
    assert.deepEqual(result.warnings, []);
    assert.equal(
      calls.some(({ method }) => ["PATCH", "POST", "PUT"].includes(method)),
      false,
    );
  });

  test("rejects a successful response that reports Dependabot disabled", () => {
    const { api } = createStatefulApi({
      ruleset: { id: 42, ...buildMainRuleset() },
      dependabot: false,
    });

    assert.throws(
      () =>
        runGitHubGovernance({ api, mode: "verify", repository: REPOSITORY }),
      /dependabot_security_updates: expected enabled/,
    );
  });

  test("names attempted but unavailable optional features as warnings", () => {
    const { api, calls } = createStatefulApi({ ignoreOptional: true });

    const result = runGitHubGovernance({
      api,
      mode: "apply",
      repository: REPOSITORY,
    });

    assert.deepEqual(result.warnings, [
      "secret_scanning_non_provider_patterns: unsupported",
      "secret_scanning_validity_checks: unsupported",
    ]);
    assert.equal(
      calls.some(
        ({ body }) =>
          body?.security_and_analysis?.secret_scanning_non_provider_patterns,
      ),
      true,
    );
  });

  test("treats a core push-protection failure as fatal without leaking details", () => {
    const { api } = createStatefulApi({ failCore: true });

    assert.throws(
      () =>
        runGitHubGovernance({
          api,
          mode: "apply",
          repository: REPOSITORY,
        }),
      (error) => {
        assert.match(error.message, /secret_scanning_push_protection/);
        assert.doesNotMatch(error.message, /do-not-leak|token=/);
        return true;
      },
    );
  });

  test("rejects governance drift in verify mode", () => {
    const { api } = createStatefulApi({
      ruleset: {
        id: 42,
        ...buildMainRuleset(),
        rules: [{ type: "deletion" }],
      },
    });

    assert.throws(
      () =>
        runGitHubGovernance({
          api,
          mode: "verify",
          repository: REPOSITORY,
        }),
      /main-protection: rules do not match policy/,
    );
  });

  test("gh client passes JSON on stdin and redacts subprocess diagnostics", () => {
    const invocations = [];
    const client = createGhApiClient({
      spawn(command, args, options) {
        invocations.push({ command, args, options });
        return { status: 1, signal: null, stdout: "", stderr: "TOKEN=secret" };
      },
    });

    assert.throws(
      () =>
        client.request({
          method: "PATCH",
          endpoint: "/repos/owner/repository",
          body: { delete_branch_on_merge: true },
        }),
      (error) => {
        assert.doesNotMatch(error.message, /TOKEN|secret/);
        return true;
      },
    );
    assert.deepEqual(invocations[0].args, [
      "api",
      "--method",
      "PATCH",
      "/repos/owner/repository",
      "--input",
      "-",
    ]);
    assert.equal(
      invocations[0].options.input,
      JSON.stringify({ delete_branch_on_merge: true }),
    );
    assert.equal(invocations[0].options.env, undefined);
  });

  test("parses one explicit mode and an injectable repository flag", () => {
    assert.deepEqual(
      parseGovernanceArgs(["--verify", "--repository", "owner/repository"]),
      { mode: "verify", repository: "owner/repository" },
    );
    assert.deepEqual(parseGovernanceArgs(["--apply"]), {
      mode: "apply",
      repository: "hmmhmmhm/ground.codes",
    });
    assert.throws(
      () => parseGovernanceArgs(["--apply", "--verify"]),
      /Choose exactly one of --apply or --verify/,
    );
    assert.throws(
      () => parseGovernanceArgs(["--verify", "--repository", "bad value"]),
      /Repository must use the owner\/name format/,
    );
    assert.throws(
      () => parseGovernanceArgs(["--verify", "--token=super-secret"]),
      (error) => {
        assert.match(error.message, /Unknown governance argument/);
        assert.doesNotMatch(error.message, /token|super-secret/i);
        return true;
      },
    );
  });

  test("formats only setting names, states, ruleset id, and named warnings", () => {
    const output = formatGovernanceResult({
      rulesetId: 42,
      settings: {
        main_protection: "active",
        secret_scanning: "enabled",
      },
      warnings: ["secret_scanning_validity_checks: unsupported"],
    });

    assert.deepEqual(output, [
      "main_protection: active (ruleset_id=42)",
      "secret_scanning: enabled",
      "warning: secret_scanning_validity_checks: unsupported",
    ]);
    assert.doesNotMatch(output.join("\n"), /token|credential|process\.env/i);
  });

  test("exposes the exact root apply and verify commands", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );

    assert.equal(
      packageJson.scripts["github:governance:apply"],
      "node scripts/configure-github-governance.mjs --apply",
    );
    assert.equal(
      packageJson.scripts["github:governance:verify"],
      "node scripts/configure-github-governance.mjs --verify",
    );
  });
});
