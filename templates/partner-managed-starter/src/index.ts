import path from "node:path";

export const STARTER_TEMPLATE_FIXTURE_PATHS = {
  launch: "fixtures/launch.json",
  payout_topology: "fixtures/payout-topology.json",
  creator_fee_state: "fixtures/creator-fee-state.json",
  revenue_events: "fixtures/revenue-events.json",
  repayment_mode: "fixtures/repayment-mode.json",
} as const;

export type StarterTemplateFixtureId = keyof typeof STARTER_TEMPLATE_FIXTURE_PATHS;

export const STARTER_TEMPLATE_READBACK_KEYS = [
  "payout_topology",
  "revenue_events",
  "debt_open_routing",
  "change_authority",
  "incident_state",
  "release_state",
] as const;

export function resolveStarterTemplateFixture(
  rootDir: string,
  fixtureId: StarterTemplateFixtureId,
): string {
  return path.resolve(rootDir, STARTER_TEMPLATE_FIXTURE_PATHS[fixtureId]);
}

export function buildStarterTemplateCommandArgs(
  rootDir: string,
  command: "partner-managed-validate" | "partner-managed-pack-from-files",
): string[] {
  return [
    command,
    "--out-dir",
    path.resolve(rootDir, "artifacts"),
    "--launch",
    resolveStarterTemplateFixture(rootDir, "launch"),
    "--payout-topology",
    resolveStarterTemplateFixture(rootDir, "payout_topology"),
    "--creator-fee-state",
    resolveStarterTemplateFixture(rootDir, "creator_fee_state"),
    "--revenue-events",
    resolveStarterTemplateFixture(rootDir, "revenue_events"),
    "--repayment-mode",
    resolveStarterTemplateFixture(rootDir, "repayment_mode"),
  ];
}

export function describeStarterTemplate(rootDir: string) {
  return {
    template_name: "partner-managed-starter",
    readback_keys: STARTER_TEMPLATE_READBACK_KEYS,
    fixtures: Object.fromEntries(
      Object.keys(STARTER_TEMPLATE_FIXTURE_PATHS).map((fixtureId) => [
        fixtureId,
        resolveStarterTemplateFixture(rootDir, fixtureId as StarterTemplateFixtureId),
      ]),
    ),
    validate_args: buildStarterTemplateCommandArgs(rootDir, "partner-managed-validate"),
    pack_args: buildStarterTemplateCommandArgs(rootDir, "partner-managed-pack-from-files"),
  };
}
