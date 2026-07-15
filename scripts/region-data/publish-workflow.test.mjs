import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assertFrozenInstallPolicy,
  indentedYamlBlock,
  readText,
  workflowStep,
  workflowStepCommand,
} from "../workflow-test-helpers.mjs";

const path = ".github/workflows/publish-region-data.yml";
const workflow = () => readText("../.github/workflows/publish-region-data.yml");

describe("protected region-data publication workflow", () => {
  test("is manual, least-privilege, pinned, and environment protected", () => {
    const source = workflow();
    const trigger = indentedYamlBlock(source, "on");
    const permissions = indentedYamlBlock(source, "permissions");

    assert.match(trigger, /workflow_dispatch:/);
    assert.doesNotMatch(trigger, /pull_request:|push:|schedule:/);
    assert.equal(
      permissions,
      "permissions:\n  contents: write\n  pull-requests: write",
    );
    assert.match(source, /^    environment: region-data-publisher$/m);
    assert.match(source, /^  cancel-in-progress: false$/m);
    assert.match(source, /actions\/checkout@[a-f0-9]{40}/);
    assert.match(source, /actions\/setup-node@[a-f0-9]{40}/);
    assert.match(source, /pnpm\/action-setup@[a-f0-9]{40}/);
    assertFrozenInstallPolicy({ path, source, requireInstall: true });
  });

  test("materializes first and runs only reviewed transformations and audits", () => {
    const source = workflow();
    const sync = workflowStep(source, "Materialize active release");
    const transform = workflowStep(source, "Run approved transformation");
    const audit = workflowStep(source, "Audit generated data");
    const generate = workflowStep(source, "Generate immutable release");
    const transformCommand = workflowStepCommand(transform);

    assert.match(
      sync,
      /REGION_DATA_BASE_URL: \$\{\{ vars\.REGION_DATA_BASE_URL \}\}/,
    );
    assert.match(
      sync,
      /node scripts\/sync-region-data\.mjs --groups region-dist,region-db --prune/,
    );
    assert.match(
      transform,
      /TRANSFORMATION: \$\{\{ inputs\.transformation \}\}/,
    );
    assert.match(transformCommand, /case "\$TRANSFORMATION" in/);
    assert.match(transformCommand, /none\)/);
    assert.match(transformCommand, /region-1\)/);
    assert.doesNotMatch(transformCommand, /eval "\$TRANSFORMATION"/);
    assert.match(audit, /pnpm data:audit-labels/);
    assert.match(audit, /pnpm language:audit/);

    const indexes = [sync, transform, audit, generate].map((step) =>
      source.indexOf(step),
    );
    assert.deepEqual(
      indexes,
      [...indexes].sort((left, right) => left - right),
    );
  });

  test("publishes only a changed pointer and verifies the public release", () => {
    const source = workflow();
    const detect = workflowStep(source, "Detect release change");
    const publish = workflowStep(source, "Publish immutable release");
    const verify = workflowStep(source, "Verify clean public materialization");

    assert.match(
      detect,
      /git diff --quiet -- packages\/geoint\/region-data-release\.json/,
    );
    assert.match(detect, /changed=false/);
    assert.match(detect, /changed=true/);
    for (const step of [publish, verify]) {
      assert.match(step, /if: steps\.release\.outputs\.changed == 'true'/);
    }
    assert.match(publish, /pnpm region-data:publish/);
    assert.match(publish, /R2_REGION_DATA_ACCESS_KEY_ID: \$\{\{ secrets\./);
    assert.match(publish, /R2_REGION_DATA_SECRET_ACCESS_KEY: \$\{\{ secrets\./);
    assert.doesNotMatch(
      source.slice(0, source.indexOf(publish)),
      /R2_REGION_DATA_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY)/,
    );
    assert.match(
      verify,
      /rm -rf packages\/geoint\/region-dist packages\/geoint\/region-db/,
    );
    assert.match(
      verify,
      /node scripts\/sync-region-data\.mjs --groups region-dist,region-db --prune/,
    );
    assert.match(verify, /node scripts\/verify-region-data\.mjs/);
    assert.ok(source.indexOf(detect) < source.indexOf(publish));
  });

  test("allows only the pointer and release history in the PR", () => {
    const source = workflow();
    const document = workflowStep(source, "Record release history");
    const commit = workflowStep(source, "Validate and commit release pointer");
    const pullRequest = workflowStep(source, "Open release pull request");
    const command = workflowStepCommand(commit);

    assert.match(document, /docs\/operations\/region-data-delivery\.md/);
    assert.match(command, /git diff --name-only/);
    assert.match(command, /git ls-files --others --exclude-standard/);
    assert.match(command, /git diff --cached --name-only/);
    assert.match(command, /packages\/geoint\/region-data-release\.json/);
    assert.match(command, /docs\/operations\/region-data-delivery\.md/);
    assert.match(command, /data-release\/\$\{VERSION\}/);
    assert.match(command, /git push --set-upstream origin/);
    assert.match(pullRequest, /gh pr create/);
    assert.match(pullRequest, /--base main/);
    assert.match(pullRequest, /--head "\$BRANCH"/);
  });
});
