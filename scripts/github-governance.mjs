import { isDeepStrictEqual } from "node:util";
import { spawnSync } from "node:child_process";

export const DEFAULT_REPOSITORY = "hmmhmmhm/ground.codes";
export const RULESET_NAME = "main-protection";
export const OPTIONAL_SECURITY_FEATURES = [
  "secret_scanning_non_provider_patterns",
  "secret_scanning_validity_checks",
];

const CORE_SECURITY_FEATURES = [
  "secret_scanning",
  "secret_scanning_push_protection",
];
const MAX_GH_OUTPUT_BYTES = 16 * 1024 * 1024;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const PULL_REQUEST_PARAMETERS = {
  dismiss_stale_reviews_on_push: false,
  require_code_owner_review: false,
  require_last_push_approval: false,
  required_approving_review_count: 0,
  required_review_thread_resolution: false,
};

export class GovernanceError extends Error {
  constructor(message) {
    super(message);
    this.name = "GovernanceError";
  }
}

export const buildMainRuleset = () => ({
  name: RULESET_NAME,
  target: "branch",
  enforcement: "active",
  conditions: {
    ref_name: {
      include: ["refs/heads/main"],
      exclude: [],
    },
  },
  bypass_actors: [
    {
      actor_id: 5,
      actor_type: "RepositoryRole",
      bypass_mode: "always",
    },
  ],
  rules: [
    { type: "deletion" },
    { type: "non_fast_forward" },
    {
      type: "pull_request",
      parameters: { ...PULL_REQUEST_PARAMETERS },
    },
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: true,
        required_status_checks: [{ context: "verify" }],
      },
    },
  ],
});

export const buildRepositoryPatch = () => ({
  delete_branch_on_merge: true,
  security_and_analysis: {
    secret_scanning: { status: "enabled" },
    secret_scanning_push_protection: { status: "enabled" },
  },
});

const buildOptionalSecurityPatch = (feature) => ({
  security_and_analysis: {
    [feature]: { status: "enabled" },
  },
});

const fail = (message) => {
  throw new GovernanceError(message);
};

const validateRepository = (repository) => {
  if (!REPOSITORY_PATTERN.test(repository)) {
    fail("Repository must use the owner/name format.");
  }
  return repository;
};

export const parseGovernanceArgs = (argv) => {
  const modes = argv.filter((argument) =>
    ["--apply", "--verify"].includes(argument),
  );
  if (modes.length !== 1) {
    fail("Choose exactly one of --apply or --verify.");
  }

  let repository = DEFAULT_REPOSITORY;
  const repositoryFlag = argv.indexOf("--repository");
  if (repositoryFlag !== -1) {
    repository = argv[repositoryFlag + 1] ?? "";
  }

  const recognizedArguments = new Set([
    modes[0],
    "--repository",
    ...(repositoryFlag === -1 ? [] : [repository]),
  ]);
  const unknownArgument = argv.find(
    (argument) => !recognizedArguments.has(argument),
  );
  if (unknownArgument) fail("Unknown governance argument.");

  return {
    mode: modes[0] === "--apply" ? "apply" : "verify",
    repository: validateRepository(repository),
  };
};

export const createGhApiClient = ({ spawn = spawnSync } = {}) => ({
  request({ method = "GET", endpoint, body }) {
    const args = ["api", "--method", method, endpoint];
    const options = {
      encoding: "utf8",
      maxBuffer: MAX_GH_OUTPUT_BYTES,
    };
    if (body !== undefined) {
      args.push("--input", "-");
      options.input = JSON.stringify(body);
    }

    const result = spawn("gh", args, options);
    if (result.signal || result.status !== 0) {
      fail(`GitHub API request failed: ${method} ${endpoint}`);
    }

    const output = result.stdout?.trim();
    if (!output) return null;
    try {
      return JSON.parse(output);
    } catch {
      fail(`GitHub API returned invalid JSON: ${method} ${endpoint}`);
    }
  },
});

const requestSafely = (api, request, setting) => {
  try {
    return api.request(request);
  } catch {
    fail(`${setting}: GitHub API request failed`);
  }
};

const requestOptionally = (api, request) => {
  try {
    api.request(request);
    return true;
  } catch {
    return false;
  }
};

const findRuleset = (api, repository) => {
  const endpoint = `/repos/${repository}/rulesets`;
  const rulesets = requestSafely(
    api,
    { method: "GET", endpoint },
    RULESET_NAME,
  );
  if (!Array.isArray(rulesets)) fail(`${RULESET_NAME}: invalid API response`);

  const matches = rulesets.filter(({ name }) => name === RULESET_NAME);
  if (matches.length > 1) fail(`${RULESET_NAME}: duplicate rulesets found`);
  return matches[0] ?? null;
};

const rulesetId = (ruleset) => {
  if (!Number.isInteger(ruleset?.id) || ruleset.id < 1) {
    fail(`${RULESET_NAME}: missing ruleset id`);
  }
  return ruleset.id;
};

const applyRuleset = (api, repository) => {
  const endpoint = `/repos/${repository}/rulesets`;
  const existing = findRuleset(api, repository);
  const response = requestSafely(
    api,
    {
      method: existing ? "PUT" : "POST",
      endpoint: existing ? `${endpoint}/${rulesetId(existing)}` : endpoint,
      body: buildMainRuleset(),
    },
    RULESET_NAME,
  );
  return rulesetId(response);
};

const normalizedBypassActors = (actors) =>
  actors?.map(({ actor_id, actor_type, bypass_mode }) => ({
    actor_id,
    actor_type,
    bypass_mode,
  }));

const rulesMatchPolicy = (rules) => {
  if (!Array.isArray(rules) || rules.length !== 4) return false;
  const byType = new Map(rules.map((rule) => [rule.type, rule]));
  if (byType.size !== 4) return false;

  const pullRequest = byType.get("pull_request");
  const statusChecks = byType.get("required_status_checks");
  const contexts = statusChecks?.parameters?.required_status_checks?.map(
    ({ context }) => ({ context }),
  );

  return (
    byType.has("deletion") &&
    byType.has("non_fast_forward") &&
    Object.entries(PULL_REQUEST_PARAMETERS).every(
      ([name, value]) => pullRequest?.parameters?.[name] === value,
    ) &&
    statusChecks?.parameters?.strict_required_status_checks_policy === true &&
    isDeepStrictEqual(contexts, [{ context: "verify" }])
  );
};

const verifyRuleset = (ruleset) => {
  const expected = buildMainRuleset();
  const checks = [
    [ruleset.name === expected.name, "name"],
    [ruleset.target === expected.target, "target"],
    [ruleset.enforcement === expected.enforcement, "enforcement"],
    [
      isDeepStrictEqual(
        ruleset.conditions?.ref_name,
        expected.conditions.ref_name,
      ),
      "branch target",
    ],
    [
      isDeepStrictEqual(
        normalizedBypassActors(ruleset.bypass_actors),
        expected.bypass_actors,
      ),
      "bypass actors",
    ],
    [rulesMatchPolicy(ruleset.rules), "rules"],
  ];
  const failedCheck = checks.find(([matches]) => !matches);
  if (failedCheck) {
    fail(`${RULESET_NAME}: ${failedCheck[1]} do not match policy`);
  }
};

const readRepository = (api, repository) =>
  requestSafely(
    api,
    { method: "GET", endpoint: `/repos/${repository}` },
    "repository settings",
  );

const optionalSupport = (repository) =>
  new Set(
    OPTIONAL_SECURITY_FEATURES.filter((feature) =>
      Object.hasOwn(repository?.security_and_analysis ?? {}, feature),
    ),
  );

const applyRepositorySettings = (api, repository, currentRepository) => {
  const endpoint = `/repos/${repository}`;
  requestSafely(
    api,
    { method: "PATCH", endpoint, body: buildRepositoryPatch() },
    "secret_scanning_push_protection and core repository settings",
  );
  requestSafely(
    api,
    {
      method: "PUT",
      endpoint: `${endpoint}/vulnerability-alerts`,
    },
    "dependabot_alerts",
  );
  requestSafely(
    api,
    {
      method: "PUT",
      endpoint: `${endpoint}/automated-security-fixes`,
    },
    "dependabot_security_updates",
  );

  const supported = optionalSupport(currentRepository);
  for (const feature of supported) {
    requestOptionally(api, {
      method: "PATCH",
      endpoint,
      body: buildOptionalSecurityPatch(feature),
    });
  }
  return supported;
};

const verifyRepositorySettings = (api, repository, supportedOptionals) => {
  const current = readRepository(api, repository);
  const settings = {
    delete_branch_on_merge: current.delete_branch_on_merge
      ? "enabled"
      : "disabled",
  };
  if (settings.delete_branch_on_merge !== "enabled") {
    fail("delete_branch_on_merge: expected enabled");
  }

  requestSafely(
    api,
    {
      method: "GET",
      endpoint: `/repos/${repository}/vulnerability-alerts`,
    },
    "dependabot_alerts",
  );
  settings.dependabot_alerts = "enabled";

  const dependabot = requestSafely(
    api,
    {
      method: "GET",
      endpoint: `/repos/${repository}/automated-security-fixes`,
    },
    "dependabot_security_updates",
  );
  if (dependabot?.enabled !== true || dependabot.paused === true) {
    fail("dependabot_security_updates: expected enabled");
  }
  settings.dependabot_security_updates = "enabled";

  for (const feature of CORE_SECURITY_FEATURES) {
    const status = current.security_and_analysis?.[feature]?.status;
    settings[feature] = status ?? "unsupported";
    if (status !== "enabled") fail(`${feature}: expected enabled`);
  }

  const warnings = [];
  for (const feature of OPTIONAL_SECURITY_FEATURES) {
    const supported = supportedOptionals.has(feature);
    const status = current.security_and_analysis?.[feature]?.status;
    if (!supported || status !== "enabled") {
      settings[feature] = "unsupported";
      warnings.push(`${feature}: unsupported`);
    } else {
      settings[feature] = status;
    }
  }

  return { settings, warnings };
};

const verifyGovernance = (api, repository, supportedOptionals) => {
  const summary = findRuleset(api, repository);
  if (!summary) fail(`${RULESET_NAME}: ruleset not found`);
  const id = rulesetId(summary);
  const ruleset = requestSafely(
    api,
    {
      method: "GET",
      endpoint: `/repos/${repository}/rulesets/${id}`,
    },
    RULESET_NAME,
  );
  verifyRuleset(ruleset);

  const { settings, warnings } = verifyRepositorySettings(
    api,
    repository,
    supportedOptionals,
  );
  return {
    rulesetId: id,
    settings: { main_protection: "active", ...settings },
    warnings,
  };
};

export const runGitHubGovernance = ({ api, mode, repository }) => {
  if (!api?.request) fail("A GitHub API client is required.");
  if (!["apply", "verify"].includes(mode))
    fail("Mode must be apply or verify.");
  validateRepository(repository);

  const currentRepository = readRepository(api, repository);
  let supportedOptionals = optionalSupport(currentRepository);
  if (mode === "apply") {
    applyRuleset(api, repository);
    supportedOptionals = applyRepositorySettings(
      api,
      repository,
      currentRepository,
    );
  }

  return verifyGovernance(api, repository, supportedOptionals);
};

export const formatGovernanceResult = ({ rulesetId, settings, warnings }) => [
  `main_protection: ${settings.main_protection} (ruleset_id=${rulesetId})`,
  ...Object.entries(settings)
    .filter(([name]) => name !== "main_protection")
    .map(([name, status]) => `${name}: ${status}`),
  ...warnings.map((warning) => `warning: ${warning}`),
];
