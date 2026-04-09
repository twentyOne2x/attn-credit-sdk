import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  buildStarterTemplateCommandArgs,
  describeStarterTemplate,
  resolveStarterTemplateFixture,
  STARTER_TEMPLATE_FIXTURE_PATHS,
  STARTER_TEMPLATE_READBACK_KEYS,
} from "../src/index";

const TEMPLATE_ROOT = process.cwd();

test("starter template fixture paths resolve to real files", async () => {
  for (const fixtureId of Object.keys(STARTER_TEMPLATE_FIXTURE_PATHS)) {
    await access(resolveStarterTemplateFixture(TEMPLATE_ROOT, fixtureId as keyof typeof STARTER_TEMPLATE_FIXTURE_PATHS));
  }
});

test("starter template command builders include the expected harness commands", () => {
  const validateArgs = buildStarterTemplateCommandArgs(TEMPLATE_ROOT, "partner-managed-validate");
  const packArgs = buildStarterTemplateCommandArgs(
    TEMPLATE_ROOT,
    "partner-managed-pack-from-files",
  );

  assert.equal(validateArgs[0], "partner-managed-validate");
  assert.equal(packArgs[0], "partner-managed-pack-from-files");
  assert.equal(validateArgs.includes("--revenue-events"), true);
  assert.equal(packArgs.includes("--payout-topology"), true);
});

test("starter template description keeps the readback keys and artifacts explicit", () => {
  const description = describeStarterTemplate(TEMPLATE_ROOT);

  assert.equal(description.template_name, "partner-managed-starter");
  assert.equal(description.readback_keys.includes("debt_open_routing"), true);
  assert.equal(STARTER_TEMPLATE_READBACK_KEYS.includes("release_state"), true);
  assert.equal(path.isAbsolute(description.fixtures.launch), true);
});
