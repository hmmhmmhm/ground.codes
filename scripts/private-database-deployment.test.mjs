import assert from "node:assert/strict";
import { test } from "node:test";
import { readText, workflowStep } from "./workflow-test-helpers.mjs";

test("private database deployment cannot mutate the retained managed database by default", () => {
  const workflow = readText("../.github/workflows/deploy-api.yml");
  for (const name of [
    "Apply PostGIS schema",
    "Import changed region datasets",
  ]) {
    assert.match(
      workflowStep(workflow, name),
      /SUPABASE_DB_MAINTENANCE_ENABLED == 'true'/,
    );
  }
  const guard = workflowStep(
    workflow,
    "Require local region maintenance when data changed",
  );
  assert.match(guard, /steps\.regions\.outputs\.datasets != ''/);
  assert.match(guard, /SUPABASE_DB_MAINTENANCE_ENABLED != 'true'/);
  assert.match(guard, /exit 1/);
  assert.match(guard, /import_all_regions=false/);
});
