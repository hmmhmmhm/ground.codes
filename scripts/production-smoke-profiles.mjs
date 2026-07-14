import {
  additionalLatinSmokeChecks,
  runAdditionalLatinSmokeChecks,
} from "./production-smoke-additional-latin.mjs";
import {
  additionalSmokeChecks,
  runAdditionalSmokeChecks,
} from "./production-smoke-additional.mjs";
import {
  coreLanguageSmokeChecks,
  runCoreLanguageSmokeChecks,
} from "./production-smoke-core.mjs";
import {
  expandedSmokeChecks,
  runExpandedSmokeChecks,
} from "./production-smoke-expanded.mjs";
import { assertSmokeCheckDefinitions } from "./production-smoke-helpers.mjs";
import {
  fullOperationsSmokeChecks,
  runFullOperationsSmokeChecks,
} from "./production-smoke-operations.mjs";
import {
  quickSmokeChecks,
  runQuickSmokeChecks,
} from "./production-smoke-quick.mjs";

export const smokeProfiles = {
  quick: [runQuickSmokeChecks],
  full: [
    runQuickSmokeChecks,
    runCoreLanguageSmokeChecks,
    runExpandedSmokeChecks,
    runAdditionalSmokeChecks,
    runAdditionalLatinSmokeChecks,
    runFullOperationsSmokeChecks,
  ],
};

export const smokeProfileCheckMetadata = {
  quick: quickSmokeChecks,
  full: [
    ...quickSmokeChecks,
    ...coreLanguageSmokeChecks,
    ...expandedSmokeChecks,
    ...additionalSmokeChecks,
    ...additionalLatinSmokeChecks,
    ...fullOperationsSmokeChecks,
  ],
};

for (const checks of Object.values(smokeProfileCheckMetadata)) {
  assertSmokeCheckDefinitions(checks);
}

export const smokeLanguageCoverage = Object.fromEntries(
  Object.entries(smokeProfileCheckMetadata).map(([profile, checks]) => [
    profile,
    checks.flatMap((check) =>
      check.coverageLanguage ? [check.coverageLanguage] : [],
    ),
  ]),
);

export const resolveSmokeProfile = (requestedProfile) => {
  const profile = requestedProfile ?? "full";
  if (!Object.hasOwn(smokeProfiles, profile)) {
    throw new Error(`Unknown production smoke profile: ${profile}`);
  }
  return profile;
};

export const runSmokeProfile = async (profile, context) => {
  for (const runner of smokeProfiles[profile]) {
    await runner(context);
  }
};
