#!/usr/bin/env node

import { mkdir, appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import {
  CLAWPUMP_CLUSTERS,
  CLAWPUMP_CONTROL_MODELS,
  CLAWPUMP_MODE_STATES,
  CLAWPUMP_PAYOUT_MODES,
  CLAWPUMP_PROOF_STATES,
  CLAWPUMP_REVENUE_EVENT_TYPES,
  createClawPumpEvidencePack,
  createClawPumpIntegrationDescriptor,
  createMockClawPumpClient,
  createCreatorFeeStateReceipt,
  createLaunchReceipt,
  createPayoutTopologyReceipt,
  createReleaseModeReceipt,
  createRepaymentModeReceipt,
  createRevenueEventsReceipt,
  createTransportMeta,
  type ClawPumpCreatorFeeState,
  type ClawPumpMockFailure,
  type ClawPumpMockOperation,
  type ClawPumpPayoutTopology,
  type ClawPumpProofState,
  type ClawPumpRepaymentMode,
  type ClawPumpRevenueEvent,
  type ClawPumpLaunch,
} from "@attn-credit/clawpump";
import {
  classifyPartnerManagedLane,
  createAttnClient,
  createPartnerManagedEvidencePack,
  createPartnerManagedIntegrationDescriptor,
  createPartnerManagedWalletPolicyTemplate,
  parsePartnerManagedEvidencePack,
  parsePartnerManagedIntegrationDescriptor,
  parsePartnerManagedWalletPolicySummary,
  type ControlProfileId,
  type CreatorIngressMode,
  type PartnerCatalogResponse,
  type PartnerCapabilitiesResponse,
  type PartnerManagedEvidencePack,
  type PartnerManagedIntegrationDescriptor,
  type PartnerManagedWalletPolicySummary,
  type PartnerWalletPolicyRequirementState,
} from "@attn-credit/sdk";

const DEFAULT_MINT = "clawmint11111111111111111111111111111111";
const DEFAULT_REPAYMENT_TARGET = "attnrepay111111111111111111111111111111";
const DEFAULT_OUTPUT_ROOT = "./tmp/partner-managed-harness";
const DEFAULT_PARTNER_ID = "partner_demo";
const DEFAULT_DISPLAY_NAME = "Partner Demo";
const LEGACY_DEFAULT_PARTNER_ID = "clawpump";
const LEGACY_DEFAULT_DISPLAY_NAME = "ClawPump";
const REQUIRED_FOR_PACK_INPUT_IDS: FileInputId[] = ["payout_topology", "revenue_events"];
const RECOMMENDED_FIRST_RUN_INPUT_IDS: FileInputId[] = [
  "launch",
  "payout_topology",
  "creator_fee_state",
  "revenue_events",
  "repayment_mode",
];

type CanonicalCommandName =
  | "partner-managed-mock-pilot"
  | "partner-managed-mock-matrix"
  | "partner-managed-pack-from-files"
  | "partner-managed-doctor";
type AcceptedCommandName =
  | CanonicalCommandName
  | "clawpump-mock-pilot"
  | "clawpump-mock-matrix"
  | "clawpump-pack-from-files"
  | "clawpump-doctor";
type AttnSnapshotScope = "none" | "catalog_only" | "current_callable_fallback_tuple";
type FileInputId =
  | "launch"
  | "payout_topology"
  | "creator_fee_state"
  | "revenue_events"
  | "repayment_mode";
type InputArtifactState = "ok" | "missing" | "invalid";

type CliOptions = {
  command: CanonicalCommandName;
  outDir: string;
  attnBaseUrl?: string;
  presetId?: string;
  creatorIngressMode?: CreatorIngressMode;
  controlProfileId?: ControlProfileId;
  repaymentTarget: string;
  repaymentShareBps: number;
  injectFailures: string[];
  launchPath?: string;
  payoutTopologyPath?: string;
  creatorFeeStatePath?: string;
  revenueEventsPath?: string;
  repaymentModePath?: string;
  proofState: ClawPumpProofState;
  partnerId: string;
  displayName: string;
};

type Logger = {
  runDir: string;
  logPath: string;
  log: (event: Record<string, unknown>) => Promise<void>;
  writeJson: (relativePath: string, value: unknown) => Promise<string>;
};

type RunSummary = {
  ok: boolean;
  command: CanonicalCommandName;
  run_id: string;
  run_dir: string;
  log_path: string;
  stage: string;
  claim_level: string;
  required_partner_inputs: string[];
  residual_risk_codes: string[];
  attn_catalog_snapshot: boolean;
  attn_capabilities_snapshot: boolean;
  attn_snapshot_scope: AttnSnapshotScope;
  attn_snapshot_note: string;
  artifact_paths: Record<string, string>;
  failures: Array<{ step: string; message: string; code?: string }>;
};

type DoctorInputStatus = {
  input_id: FileInputId;
  required_for_pack: boolean;
  recommended_for_first_run: boolean;
  status: InputArtifactState;
  source_path: string | null;
  artifact_path: string | null;
  message: string | null;
};

type DoctorSummary = {
  ok: boolean;
  command: "partner-managed-doctor";
  run_id: string;
  run_dir: string;
  log_path: string;
  pack_from_files_ready: boolean;
  first_retained_run_ready: boolean;
  current_stage: string;
  current_claim_level: string;
  next_stage: string | null;
  next_requirement_ids: string[];
  residual_risk_codes: string[];
  missing_required_inputs: FileInputId[];
  missing_recommended_inputs: FileInputId[];
  invalid_inputs: FileInputId[];
  input_status: DoctorInputStatus[];
  recommended_commands: string[];
  recommended_next_steps: string[];
  attn_catalog_snapshot: boolean;
  attn_capabilities_snapshot: boolean;
  attn_snapshot_scope: AttnSnapshotScope;
  attn_snapshot_note: string;
  artifact_paths: Record<string, string>;
  failures: Array<{ step: string; message: string; code?: string }>;
};

type MatrixSummary = {
  ok: boolean;
  command: "partner-managed-mock-matrix";
  matrix_id: string;
  matrix_dir: string;
  log_path: string;
  all_scenarios_ok: boolean;
  degraded_scenario_count: number;
  scenario_summaries: Array<{
    scenario_id: string;
    ok: boolean;
    stage: string;
    claim_level: string;
    run_dir: string;
    failure_count: number;
  }>;
};

async function writeLoggedJson(
  logger: Logger,
  relativePath: string,
  value: unknown,
  step: string,
): Promise<string> {
  const artifactPath = await logger.writeJson(relativePath, value);
  await logger.log({ step, status: "ok", artifact: artifactPath });
  return artifactPath;
}

type LoadedJsonArtifact<T> = {
  value: T | null;
  state: InputArtifactState;
  sourcePath: string | null;
  artifactPath: string | null;
  message: string | null;
};

function printHelp(): void {
  process.stdout.write(
    [
      "Usage:",
      "  attn-partner-harness partner-managed-mock-pilot [options]",
      "  attn-partner-harness partner-managed-mock-matrix [options]",
      "  attn-partner-harness partner-managed-pack-from-files [options]",
      "  attn-partner-harness partner-managed-doctor [options]",
      "",
      "Legacy compatibility aliases:",
      "  attn-partner-harness clawpump-mock-pilot [options]",
      "  attn-partner-harness clawpump-mock-matrix [options]",
      "  attn-partner-harness clawpump-pack-from-files [options]",
      "  attn-partner-harness clawpump-doctor [options]",
      "",
      "Options:",
      "  --out-dir <path>                 Output root for retained runs",
      "  --attn-base-url <url>           Optional attn base URL for catalog/capabilities snapshots",
      "  --preset-id <id>                Optional preset id for capabilities snapshot",
      "  --creator-ingress-mode <mode>   Optional creator ingress mode for capabilities snapshot",
      "  --control-profile-id <id>       Optional control profile id for capabilities snapshot",
      "  --repayment-target <wallet>     Repayment target to activate in the mock pilot",
      "  --repayment-share-bps <n>       Repayment share basis points for the mock pilot",
      "  --inject-failure <op:kind>      Inject one mock partner failure; repeatable",
      "  --launch <path>                 Reference launch JSON for partner-managed-pack-from-files",
      "  --payout-topology <path>        Reference payout topology JSON for partner-managed-pack-from-files",
      "  --creator-fee-state <path>      Reference creator-fee-state JSON for partner-managed-pack-from-files",
      "  --revenue-events <path>         Reference revenue-events JSON array for partner-managed-pack-from-files",
      "  --repayment-mode <path>         Reference repayment-mode JSON for partner-managed-pack-from-files",
      "  --proof-state <state>           Proof posture to stamp on file-backed receipts",
      "  --partner-id <id>               Partner id to retain in descriptor/evidence output",
      "  --display-name <name>           Display name to retain in descriptor/evidence output",
      "",
    ].join("\n"),
  );
}

const zClawPumpLaunch = z.object({
  mint: z.string().trim().min(1),
  launch_id: z.string().trim().min(1),
  launcher_platform: z.literal("clawpump"),
  creator_wallet: z.string().trim().min(1),
  launch_authority: z.string().trim().min(1),
  created_at: z.string().trim().min(1),
  cluster: z.enum(CLAWPUMP_CLUSTERS),
  agent_id: z.string().trim().min(1).optional(),
});

const zClawPumpPayoutTopology = z.object({
  mint: z.string().trim().min(1),
  dev_wallet: z.string().trim().min(1),
  gas_sponsor_wallet: z.string().trim().min(1).optional(),
  agent_rewards_wallet: z.string().trim().min(1).optional(),
  platform_treasury_wallet: z.string().trim().min(1).optional(),
  current_payout_mode: z.enum(CLAWPUMP_PAYOUT_MODES),
  current_payout_recipients: z.array(
    z.object({
      wallet: z.string().trim().min(1),
      label: z.string().trim().min(1).optional(),
      share_bps: z.number(),
    }),
  ),
  payout_edit_authority: z.string().trim().min(1),
  platform_controls_dev_wallet: z.union([z.boolean(), z.literal("unknown")]),
  control_model: z.enum(CLAWPUMP_CONTROL_MODELS).optional(),
  source_timestamp: z.string().trim().min(1),
});

const zClawPumpCreatorFeeState = z.object({
  mint: z.string().trim().min(1),
  current_creator_fee_recipient: z.string().trim().min(1),
  accrued_creator_fees_sol: z.number(),
  claimed_creator_fees_sol: z.number(),
  claimable_creator_fees_sol: z.number(),
  last_claim_at: z.string().trim().min(1).optional(),
  last_claim_signature: z.string().trim().min(1).optional(),
  source_timestamp: z.string().trim().min(1),
});

const zClawPumpRevenueEvent = z.object({
  event_id: z.string().trim().min(1),
  mint: z.string().trim().min(1),
  event_type: z.enum(CLAWPUMP_REVENUE_EVENT_TYPES),
  amount_sol: z.number(),
  recipient: z.string().trim().min(1).optional(),
  signature: z.string().trim().min(1).optional(),
  slot: z.number().int().optional(),
  block_time: z.string().trim().min(1),
});

const zClawPumpRepaymentMode = z.object({
  mint: z.string().trim().min(1),
  mode_state: z.enum(CLAWPUMP_MODE_STATES),
  repayment_target: z.string().trim().min(1).optional(),
  repayment_share_bps: z.number().int().optional(),
  activated_at: z.string().trim().min(1).optional(),
  cleared_at: z.string().trim().min(1).optional(),
  activated_by: z.string().trim().min(1).optional(),
  cleared_by: z.string().trim().min(1).optional(),
  release_target: z.string().trim().min(1).optional(),
  source_timestamp: z.string().trim().min(1),
});

function resolveAttnSnapshotScope(options: CliOptions): AttnSnapshotScope {
  if (!options.attnBaseUrl) return "none";
  if (options.presetId && options.creatorIngressMode && options.controlProfileId) {
    return "current_callable_fallback_tuple";
  }
  return "catalog_only";
}

function attnSnapshotNote(scope: AttnSnapshotScope): string {
  switch (scope) {
    case "none":
      return "No attn snapshot was retained in this run.";
    case "catalog_only":
      return "The retained attn snapshot is catalog-only discovery truth. It does not imply partner-managed wallet parity.";
    case "current_callable_fallback_tuple":
      return "The retained attn capabilities snapshot describes the current hosted callable fallback tuple, not proof that the partner-managed wallet lane already matches that runtime contract.";
  }
}

function assertString(value: string | undefined, flag: string): string {
  if (!value) {
    throw new Error(`missing value for ${flag}`);
  }
  return value;
}

const COMMAND_ALIASES: Record<AcceptedCommandName, CanonicalCommandName> = {
  "partner-managed-mock-pilot": "partner-managed-mock-pilot",
  "partner-managed-mock-matrix": "partner-managed-mock-matrix",
  "partner-managed-pack-from-files": "partner-managed-pack-from-files",
  "partner-managed-doctor": "partner-managed-doctor",
  "clawpump-mock-pilot": "partner-managed-mock-pilot",
  "clawpump-mock-matrix": "partner-managed-mock-matrix",
  "clawpump-pack-from-files": "partner-managed-pack-from-files",
  "clawpump-doctor": "partner-managed-doctor",
};

function isLegacyClawpumpAlias(command: AcceptedCommandName): boolean {
  return command.startsWith("clawpump-");
}

function parseArgs(argv: string[]): CliOptions {
  const normalizedArgv = argv.filter((token, index) => !(token === "--" && index > 0));
  const [commandRaw, ...rest] = normalizedArgv;
  if (!commandRaw || commandRaw === "--help" || commandRaw === "-h") {
    printHelp();
    process.exit(0);
  }

  if (!(commandRaw in COMMAND_ALIASES)) {
    throw new Error(`unsupported command: ${commandRaw}`);
  }
  const acceptedCommand = commandRaw as AcceptedCommandName;
  const command = COMMAND_ALIASES[acceptedCommand];
  const useLegacyDefaults = isLegacyClawpumpAlias(acceptedCommand);

  const options: CliOptions = {
    command,
    outDir: DEFAULT_OUTPUT_ROOT,
    repaymentTarget: DEFAULT_REPAYMENT_TARGET,
    repaymentShareBps: 6000,
    injectFailures: [],
    proofState: "backend_readonly_proven",
    partnerId: useLegacyDefaults ? LEGACY_DEFAULT_PARTNER_ID : DEFAULT_PARTNER_ID,
    displayName: useLegacyDefaults ? LEGACY_DEFAULT_DISPLAY_NAME : DEFAULT_DISPLAY_NAME,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    switch (token) {
      case "--out-dir":
        options.outDir = assertString(rest[++index], token);
        break;
      case "--attn-base-url":
        options.attnBaseUrl = assertString(rest[++index], token);
        break;
      case "--preset-id":
        options.presetId = assertString(rest[++index], token);
        break;
      case "--creator-ingress-mode":
        options.creatorIngressMode = assertString(rest[++index], token) as CreatorIngressMode;
        break;
      case "--control-profile-id":
        options.controlProfileId = assertString(rest[++index], token) as ControlProfileId;
        break;
      case "--repayment-target":
        options.repaymentTarget = assertString(rest[++index], token);
        break;
      case "--repayment-share-bps":
        options.repaymentShareBps = Number(assertString(rest[++index], token));
        break;
      case "--inject-failure":
        options.injectFailures.push(assertString(rest[++index], token));
        break;
      case "--launch":
        options.launchPath = assertString(rest[++index], token);
        break;
      case "--payout-topology":
        options.payoutTopologyPath = assertString(rest[++index], token);
        break;
      case "--creator-fee-state":
        options.creatorFeeStatePath = assertString(rest[++index], token);
        break;
      case "--revenue-events":
        options.revenueEventsPath = assertString(rest[++index], token);
        break;
      case "--repayment-mode":
        options.repaymentModePath = assertString(rest[++index], token);
        break;
      case "--proof-state":
        options.proofState = assertString(rest[++index], token) as ClawPumpProofState;
        break;
      case "--partner-id":
        options.partnerId = assertString(rest[++index], token);
        break;
      case "--display-name":
        options.displayName = assertString(rest[++index], token);
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        throw new Error(`unknown option: ${token}`);
    }
  }

  options.proofState = z.enum(CLAWPUMP_PROOF_STATES).parse(options.proofState);
  return options;
}

function timestampForId(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function createLogger(outputRoot: string): Promise<Logger> {
  const runId = `run-${timestampForId()}-${Math.random().toString(16).slice(2, 8)}`;
  const runDir = path.resolve(outputRoot, runId);
  const logPath = path.join(runDir, "logs", "events.ndjson");
  await mkdir(path.dirname(logPath), { recursive: true });

  const log = async (event: Record<string, unknown>) => {
    await appendFile(
      logPath,
      `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`,
      "utf8",
    );
  };

  const writeJson = async (relativePath: string, value: unknown) => {
    const artifactPath = path.join(runDir, relativePath);
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    return artifactPath;
  };

  return { runDir, logPath, log, writeJson };
}

function parseInjectedFailures(values: string[]): Partial<Record<ClawPumpMockOperation, ClawPumpMockFailure>> {
  const failures: Partial<Record<ClawPumpMockOperation, ClawPumpMockFailure>> = {};
  for (const value of values) {
    const [operation, kind] = value.split(":");
    if (!operation || !kind) {
      throw new Error(`invalid --inject-failure value: ${value}`);
    }
    failures[operation as ClawPumpMockOperation] = {
      kind: kind as ClawPumpMockFailure["kind"],
      message: `injected ${kind} failure for ${operation}`,
    };
  }
  return failures;
}

async function loadJsonArtifact<T>(args: {
  logger: Logger;
  filePath: string | undefined;
  label: FileInputId;
  schema: z.ZodType<T>;
}): Promise<LoadedJsonArtifact<T>> {
  if (!args.filePath) {
    return {
      value: null,
      state: "missing",
      sourcePath: null,
      artifactPath: null,
      message: null,
    };
  }

  const sourcePath = path.resolve(args.filePath);
  await args.logger.log({
    step: `inputs.${args.label}`,
    status: "started",
    source_path: sourcePath,
  });

  try {
    const raw = JSON.parse(await readFile(args.filePath, "utf8")) as unknown;
    const parsed = args.schema.parse(raw);
    const artifactPath = await args.logger.writeJson(
      `partner/${args.label.replace(/_/g, "-")}.json`,
      parsed,
    );
    await args.logger.log({
      step: `inputs.${args.label}`,
      status: "ok",
      artifact: artifactPath,
    });
    return {
      value: parsed,
      state: "ok",
      sourcePath,
      artifactPath,
      message: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await args.logger.log({ step: `inputs.${args.label}`, status: "error", message });
    return {
      value: null,
      state: "invalid",
      sourcePath,
      artifactPath: null,
      message,
    };
  }
}

async function readJsonArtifact<T>(
  args: {
    logger: Logger;
    failures: Array<{ step: string; message: string; code?: string }>;
    filePath: string | undefined;
    required: boolean;
    label: string;
    schema: z.ZodType<T>;
    artifactPaths: Record<string, string>;
  },
): Promise<T | null> {
  const result = await loadJsonArtifact({
    logger: args.logger,
    filePath: args.filePath,
    label: args.label as FileInputId,
    schema: args.schema,
  });

  if (result.artifactPath) {
    args.artifactPaths[`input_${args.label}`] = result.artifactPath;
  }

  if (result.state === "missing") {
    if (args.required) {
      const message = `missing required --${args.label.replace(/_/g, "-")} input`;
      args.failures.push({ step: `inputs.${args.label}`, message, code: "missing_input" });
      await args.logger.log({ step: `inputs.${args.label}`, status: "error", message });
    }
    return null;
  }

  if (result.state === "invalid") {
    args.failures.push({
      step: `inputs.${args.label}`,
      message: result.message ?? "invalid input",
      code: "invalid_input",
    });
    return null;
  }

  return result.value;
}

function routeRequirementState(mode: ClawPumpRepaymentMode | null): PartnerWalletPolicyRequirementState {
  if (!mode) return "missing";
  switch (mode.mode_state) {
    case "active":
    case "cleared":
      return "verified";
    case "pending_manual":
      return "partial";
    case "unsupported":
      return "missing";
  }
}

function deriveFileBackedPolicy(args: {
  launch: ClawPumpLaunch | null;
  payout: ClawPumpPayoutTopology | null;
  feeState: ClawPumpCreatorFeeState | null;
  revenueEvents: ClawPumpRevenueEvent[] | null;
  repaymentMode: ClawPumpRepaymentMode | null;
  attnCatalogOk: boolean;
  capabilitiesOk: boolean;
}): PartnerManagedWalletPolicySummary {
  const routingState = routeRequirementState(args.repaymentMode);
  const changeAuthorityState: PartnerWalletPolicyRequirementState =
    !args.payout
      ? "missing"
      : args.payout.control_model === "delegatable"
        ? "verified"
        : args.payout.payout_edit_authority
          ? "partial"
          : "missing";

  return createPartnerManagedWalletPolicyTemplate({
    wallet_operator_model:
      args.payout?.control_model === "delegatable" ? "quorum_or_policy_engine" : "unknown",
    private_treasury_financing: "manual_operator_release",
    repayment_enforcement_class: "partner_policy_plus_attn_verifier",
    stateByRequirementId: {
      authoritative_revenue_source_attribution: args.launch ? "verified" : "missing",
      authoritative_revenue_scope_mapping: args.revenueEvents ? "verified" : "missing",
      authoritative_wallet_topology: args.payout ? "verified" : "missing",
      authoritative_payout_state: args.payout ? "verified" : "missing",
      authoritative_revenue_event_feed: args.revenueEvents ? "verified" : "missing",
      repayment_target_invariant: routingState,
      payout_edit_authority_separation: changeAuthorityState,
      debt_open_change_control:
        routingState === "verified" && changeAuthorityState !== "missing" ? "partial" : routingState,
      release_and_offboard_semantics:
        args.repaymentMode?.mode_state === "cleared"
          ? "verified"
          : args.repaymentMode
            ? "partial"
            : "missing",
      private_treasury_funding_receipts: "missing",
      attn_readback_and_audit_receipts:
        args.attnCatalogOk || args.capabilitiesOk
          ? "verified"
          : args.feeState || args.payout || args.revenueEvents || args.repaymentMode
            ? "partial"
            : "missing",
      incident_freeze_and_quarantine: "missing",
    },
    noteByRequirementId: {
      payout_edit_authority_separation:
        args.payout?.control_model === "delegatable"
          ? "The retained payout topology shows a delegatable control model, but the CLI still needs live change receipts to prove full policy integrity."
          : "The retained payout topology identifies the current edit authority, but not a full live approval policy.",
      debt_open_change_control:
        args.repaymentMode?.mode_state === "active" || args.repaymentMode?.mode_state === "cleared"
          ? "The retained routing snapshot shows the repayment posture, but not a full production change-control chain."
          : "The retained routing snapshot is not yet a strong active debt-open control proof.",
      release_and_offboard_semantics:
        args.repaymentMode?.mode_state === "cleared"
          ? "The retained routing snapshot shows a cleared/release posture."
          : "The retained routing snapshot does not yet prove a dedicated release/offboard chain.",
      private_treasury_funding_receipts:
        "This retained-run path packages partner readbacks and exports. It does not move or prove treasury funding by itself.",
      incident_freeze_and_quarantine:
        "This retained-run path does not yet package incident freeze or quarantine receipts.",
      attn_readback_and_audit_receipts:
        args.attnCatalogOk || args.capabilitiesOk
          ? "attn-side snapshots were retained alongside the partner artifacts."
          : "Only partner-side artifacts were retained in this run.",
    },
  });
}

function derivePolicy(args: {
  launchOk: boolean;
  payoutOk: boolean;
  feeStateOk: boolean;
  eventsOk: boolean;
  routingOk: boolean;
  attnCatalogOk: boolean;
  capabilitiesOk: boolean;
}): PartnerManagedWalletPolicySummary {
  const state = (value: PartnerWalletPolicyRequirementState) => value;
  return createPartnerManagedWalletPolicyTemplate({
    wallet_operator_model: "quorum_or_policy_engine",
    private_treasury_financing: "manual_operator_release",
    repayment_enforcement_class: "partner_policy_plus_attn_verifier",
    stateByRequirementId: {
      authoritative_revenue_source_attribution: args.launchOk ? state("verified") : state("missing"),
      authoritative_revenue_scope_mapping: args.eventsOk ? state("verified") : state("missing"),
      authoritative_wallet_topology: args.payoutOk ? state("verified") : state("missing"),
      authoritative_payout_state: args.payoutOk ? state("verified") : state("missing"),
      authoritative_revenue_event_feed: args.eventsOk ? state("verified") : state("missing"),
      repayment_target_invariant: args.routingOk ? state("verified") : state("missing"),
      payout_edit_authority_separation: args.payoutOk ? state("partial") : state("missing"),
      debt_open_change_control: args.routingOk ? state("partial") : state("missing"),
      release_and_offboard_semantics: args.routingOk ? state("partial") : state("missing"),
      private_treasury_funding_receipts: state("missing"),
      attn_readback_and_audit_receipts:
        args.attnCatalogOk || args.capabilitiesOk ? state("verified") : state("partial"),
      incident_freeze_and_quarantine: state("missing"),
    },
    noteByRequirementId: {
      payout_edit_authority_separation: "Current harness proves readback and receipts, but not a live partner approval policy.",
      debt_open_change_control: "Current harness proves routing mode execution, but not live change-control integrity.",
      release_and_offboard_semantics: "Current harness does not yet retain a dedicated release/offboard proof flow.",
      private_treasury_funding_receipts: "This harness does not move real treasury funds.",
      incident_freeze_and_quarantine: "This harness does not yet simulate incident freeze/quarantine controls.",
      attn_readback_and_audit_receipts:
        args.attnCatalogOk || args.capabilitiesOk
          ? "attn-side compatibility snapshots were retained alongside partner artifacts."
          : "Only partner-side receipts were retained in this run.",
    },
  });
}

function nextStageFor(stage: string): string | null {
  switch (stage) {
    case "stage_0_truth_discovery":
      return "stage_1_platform_counterparty_mvp";
    case "stage_1_platform_counterparty_mvp":
      return "stage_2_observable_payout_path_mvp";
    case "stage_2_observable_payout_path_mvp":
      return "stage_3_policy_bounded_first_pilot";
    case "stage_3_policy_bounded_first_pilot":
      return "stage_4_full_partner_managed_standard";
    default:
      return null;
  }
}

function buildSourceFilesSummary(options: CliOptions) {
  return {
    launch: options.launchPath ?? null,
    payout_topology: options.payoutTopologyPath ?? null,
    creator_fee_state: options.creatorFeeStatePath ?? null,
    revenue_events: options.revenueEventsPath ?? null,
    repayment_mode: options.repaymentModePath ?? null,
  };
}

function buildPackFromFilesCommand(options: CliOptions): string {
  const parts = [
    "pnpm run harness:partner-managed-pack-from-files --",
    `--out-dir ${JSON.stringify(options.outDir)}`,
  ];
  if (options.launchPath) parts.push(`--launch ${JSON.stringify(options.launchPath)}`);
  if (options.payoutTopologyPath) {
    parts.push(`--payout-topology ${JSON.stringify(options.payoutTopologyPath)}`);
  }
  if (options.creatorFeeStatePath) {
    parts.push(`--creator-fee-state ${JSON.stringify(options.creatorFeeStatePath)}`);
  }
  if (options.revenueEventsPath) {
    parts.push(`--revenue-events ${JSON.stringify(options.revenueEventsPath)}`);
  }
  if (options.repaymentModePath) {
    parts.push(`--repayment-mode ${JSON.stringify(options.repaymentModePath)}`);
  }
  if (options.attnBaseUrl) parts.push(`--attn-base-url ${JSON.stringify(options.attnBaseUrl)}`);
  if (options.presetId) parts.push(`--preset-id ${JSON.stringify(options.presetId)}`);
  if (options.creatorIngressMode) {
    parts.push(`--creator-ingress-mode ${JSON.stringify(options.creatorIngressMode)}`);
  }
  if (options.controlProfileId) {
    parts.push(`--control-profile-id ${JSON.stringify(options.controlProfileId)}`);
  }
  if (options.partnerId !== DEFAULT_PARTNER_ID) {
    parts.push(`--partner-id ${JSON.stringify(options.partnerId)}`);
  }
  if (options.displayName !== DEFAULT_DISPLAY_NAME) {
    parts.push(`--display-name ${JSON.stringify(options.displayName)}`);
  }
  if (options.proofState !== "backend_readonly_proven") {
    parts.push(`--proof-state ${JSON.stringify(options.proofState)}`);
  }
  return parts.join(" ");
}

function buildDoctorNextSteps(args: {
  missingRequiredInputs: FileInputId[];
  missingRecommendedInputs: FileInputId[];
  invalidInputs: FileInputId[];
  assessment: ReturnType<typeof classifyPartnerManagedLane>;
  packFromFilesReady: boolean;
  firstRetainedRunReady: boolean;
  options: CliOptions;
}): string[] {
  const steps: string[] = [];

  if (args.invalidInputs.length > 0) {
    steps.push(`Fix invalid input files: ${args.invalidInputs.join(", ")}.`);
  }

  if (args.missingRequiredInputs.length > 0) {
    steps.push(
      `Add the minimum file-backed pack inputs first: ${args.missingRequiredInputs.join(", ")}.`,
    );
  }

  if (args.missingRecommendedInputs.length > 0) {
    steps.push(
      `For a truthful first retained run, add the missing recommended inputs: ${args.missingRecommendedInputs.join(", ")}.`,
    );
  }

  if (args.firstRetainedRunReady) {
    steps.push("Run the retained packaging command with this exact file set.");
    steps.push(buildPackFromFilesCommand(args.options));
  } else if (args.packFromFilesReady) {
    steps.push(
      "The minimum pack-from-files bundle is present, but the first retained run is still weaker than recommended.",
    );
    steps.push(buildPackFromFilesCommand(args.options));
  }

  if (args.assessment.next_requirement_ids.length > 0) {
    const targetStage = nextStageFor(args.assessment.stage);
    const prefix = targetStage
      ? `To reach ${targetStage}, improve`
      : "To strengthen the lane further, improve";
    steps.push(`${prefix}: ${args.assessment.next_requirement_ids.join(", ")}.`);
  }

  return steps;
}

async function maybeFetchAttnSnapshots(args: {
  options: CliOptions;
  logger: Logger;
  artifactPaths: Record<string, string>;
  failures: Array<{ step: string; message: string; code?: string }>;
}): Promise<{
  catalog: PartnerCatalogResponse | null;
  capabilities: PartnerCapabilitiesResponse | null;
}> {
  const { options, logger, artifactPaths, failures } = args;
  if (!options.attnBaseUrl) {
    return { catalog: null, capabilities: null };
  }

  const client = createAttnClient({ baseUrl: options.attnBaseUrl });
  let catalog: PartnerCatalogResponse | null = null;
  let capabilities: PartnerCapabilitiesResponse | null = null;

  try {
    await logger.log({ step: "attn.catalog", status: "started", base_url: options.attnBaseUrl });
    catalog = await client.catalog({ chain: "solana", cluster: "mainnet-beta" });
    artifactPaths.attn_catalog = await logger.writeJson("attn/catalog.json", catalog);
    await logger.log({ step: "attn.catalog", status: "ok", artifact: artifactPaths.attn_catalog });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ step: "attn.catalog", message });
    await logger.log({ step: "attn.catalog", status: "error", message });
  }

  if (options.presetId && options.creatorIngressMode && options.controlProfileId) {
    try {
      await logger.log({ step: "attn.capabilities", status: "started", preset_id: options.presetId });
      capabilities = await client.capabilities({
        chain: "solana",
        cluster: "mainnet-beta",
        preset_id: options.presetId,
        creator_ingress_mode: options.creatorIngressMode,
        control_profile_id: options.controlProfileId,
      });
      artifactPaths.attn_capabilities = await logger.writeJson("attn/capabilities.json", capabilities);
      await logger.log({
        step: "attn.capabilities",
        status: "ok",
        artifact: artifactPaths.attn_capabilities,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ step: "attn.capabilities", message });
      await logger.log({ step: "attn.capabilities", status: "error", message });
    }
  }

  return { catalog, capabilities };
}

async function runPartnerManagedDoctor(options: CliOptions): Promise<DoctorSummary> {
  const logger = await createLogger(options.outDir);
  const artifactPaths: Record<string, string> = {};
  const failures: Array<{ step: string; message: string; code?: string }> = [];
  const snapshotScope = resolveAttnSnapshotScope(options);

  await logger.log({ step: "doctor", status: "started", command: options.command });
  artifactPaths.inputs = await logger.writeJson("inputs.json", {
    command: options.command,
    attn_base_url: options.attnBaseUrl ?? null,
    preset_id: options.presetId ?? null,
    creator_ingress_mode: options.creatorIngressMode ?? null,
    control_profile_id: options.controlProfileId ?? null,
    proof_state: options.proofState,
    partner_id: options.partnerId,
    display_name: options.displayName,
    source_files: buildSourceFilesSummary(options),
  });

  const launchResult = await loadJsonArtifact({
    logger,
    filePath: options.launchPath,
    label: "launch",
    schema: zClawPumpLaunch,
  });
  const payoutResult = await loadJsonArtifact({
    logger,
    filePath: options.payoutTopologyPath,
    label: "payout_topology",
    schema: zClawPumpPayoutTopology,
  });
  const feeStateResult = await loadJsonArtifact({
    logger,
    filePath: options.creatorFeeStatePath,
    label: "creator_fee_state",
    schema: zClawPumpCreatorFeeState,
  });
  const revenueEventsResult = await loadJsonArtifact({
    logger,
    filePath: options.revenueEventsPath,
    label: "revenue_events",
    schema: z.array(zClawPumpRevenueEvent),
  });
  const repaymentModeResult = await loadJsonArtifact({
    logger,
    filePath: options.repaymentModePath,
    label: "repayment_mode",
    schema: zClawPumpRepaymentMode,
  });

  const inputStatuses: DoctorInputStatus[] = [
    {
      input_id: "launch",
      required_for_pack: REQUIRED_FOR_PACK_INPUT_IDS.includes("launch"),
      recommended_for_first_run: RECOMMENDED_FIRST_RUN_INPUT_IDS.includes("launch"),
      status: launchResult.state,
      source_path: launchResult.sourcePath,
      artifact_path: launchResult.artifactPath,
      message: launchResult.message,
    },
    {
      input_id: "payout_topology",
      required_for_pack: REQUIRED_FOR_PACK_INPUT_IDS.includes("payout_topology"),
      recommended_for_first_run: RECOMMENDED_FIRST_RUN_INPUT_IDS.includes("payout_topology"),
      status: payoutResult.state,
      source_path: payoutResult.sourcePath,
      artifact_path: payoutResult.artifactPath,
      message: payoutResult.message,
    },
    {
      input_id: "creator_fee_state",
      required_for_pack: REQUIRED_FOR_PACK_INPUT_IDS.includes("creator_fee_state"),
      recommended_for_first_run: RECOMMENDED_FIRST_RUN_INPUT_IDS.includes("creator_fee_state"),
      status: feeStateResult.state,
      source_path: feeStateResult.sourcePath,
      artifact_path: feeStateResult.artifactPath,
      message: feeStateResult.message,
    },
    {
      input_id: "revenue_events",
      required_for_pack: REQUIRED_FOR_PACK_INPUT_IDS.includes("revenue_events"),
      recommended_for_first_run: RECOMMENDED_FIRST_RUN_INPUT_IDS.includes("revenue_events"),
      status: revenueEventsResult.state,
      source_path: revenueEventsResult.sourcePath,
      artifact_path: revenueEventsResult.artifactPath,
      message: revenueEventsResult.message,
    },
    {
      input_id: "repayment_mode",
      required_for_pack: REQUIRED_FOR_PACK_INPUT_IDS.includes("repayment_mode"),
      recommended_for_first_run: RECOMMENDED_FIRST_RUN_INPUT_IDS.includes("repayment_mode"),
      status: repaymentModeResult.state,
      source_path: repaymentModeResult.sourcePath,
      artifact_path: repaymentModeResult.artifactPath,
      message: repaymentModeResult.message,
    },
  ];

  for (const status of inputStatuses) {
    if (status.artifact_path) {
      artifactPaths[`input_${status.input_id}`] = status.artifact_path;
    }
    if (status.status === "invalid") {
      failures.push({
        step: `inputs.${status.input_id}`,
        message: status.message ?? "invalid input",
        code: "invalid_input",
      });
    }
  }

  if (artifactPaths.input_launch) artifactPaths.partner_launch = artifactPaths.input_launch;
  if (artifactPaths.input_payout_topology) {
    artifactPaths.partner_payout_topology = artifactPaths.input_payout_topology;
  }
  if (artifactPaths.input_creator_fee_state) {
    artifactPaths.partner_creator_fee_state = artifactPaths.input_creator_fee_state;
  }
  if (artifactPaths.input_revenue_events) {
    artifactPaths.partner_revenue_events = artifactPaths.input_revenue_events;
  }
  if (artifactPaths.input_repayment_mode) {
    artifactPaths.partner_repayment_mode = artifactPaths.input_repayment_mode;
  }

  const missingRequiredInputs = inputStatuses
    .filter((status) => status.required_for_pack && status.status === "missing")
    .map((status) => status.input_id);
  for (const inputId of missingRequiredInputs) {
    failures.push({
      step: `inputs.${inputId}`,
      message: `missing required --${inputId.replace(/_/g, "-")} input`,
      code: "missing_input",
    });
  }

  const missingRecommendedInputs = inputStatuses
    .filter((status) => status.recommended_for_first_run && status.status === "missing")
    .map((status) => status.input_id);
  const invalidInputs = inputStatuses
    .filter((status) => status.status === "invalid")
    .map((status) => status.input_id);

  const attnSnapshots = await maybeFetchAttnSnapshots({
    options,
    logger,
    artifactPaths,
    failures,
  });

  const policy = deriveFileBackedPolicy({
    launch: launchResult.value,
    payout: payoutResult.value,
    feeState: feeStateResult.value,
    revenueEvents: revenueEventsResult.value,
    repaymentMode: repaymentModeResult.value,
    attnCatalogOk: Boolean(attnSnapshots.catalog),
    capabilitiesOk: Boolean(attnSnapshots.capabilities),
  });
  const assessment = classifyPartnerManagedLane({ policy });

  parsePartnerManagedWalletPolicySummary(policy);
  artifactPaths.doctor_policy_summary = await writeLoggedJson(
    logger,
    "doctor/policy-summary.json",
    policy,
    "doctor.writePolicySummary",
  );
  artifactPaths.doctor_stage_assessment = await writeLoggedJson(
    logger,
    "doctor/stage-assessment.json",
    assessment,
    "doctor.writeStageAssessment",
  );

  const packFromFilesReady = missingRequiredInputs.length === 0 && invalidInputs.length === 0;
  const firstRetainedRunReady = missingRecommendedInputs.length === 0 && invalidInputs.length === 0;
  const recommendedCommands = packFromFilesReady ? [buildPackFromFilesCommand(options)] : [];
  const recommendedNextSteps = buildDoctorNextSteps({
    missingRequiredInputs,
    missingRecommendedInputs,
    invalidInputs,
    assessment,
    packFromFilesReady,
    firstRetainedRunReady,
    options,
  });

  artifactPaths.doctor_next_steps = await writeLoggedJson(
    logger,
    "doctor/recommended-next-steps.json",
    recommendedNextSteps,
    "doctor.writeRecommendedNextSteps",
  );

  const summary: DoctorSummary = {
    ok: firstRetainedRunReady,
    command: "partner-managed-doctor",
    run_id: path.basename(logger.runDir),
    run_dir: logger.runDir,
    log_path: logger.logPath,
    pack_from_files_ready: packFromFilesReady,
    first_retained_run_ready: firstRetainedRunReady,
    current_stage: assessment.stage,
    current_claim_level: assessment.claim_level,
    next_stage: nextStageFor(assessment.stage),
    next_requirement_ids: assessment.next_requirement_ids,
    residual_risk_codes: assessment.residual_risk_codes,
    missing_required_inputs: missingRequiredInputs,
    missing_recommended_inputs: missingRecommendedInputs,
    invalid_inputs: invalidInputs,
    input_status: inputStatuses,
    recommended_commands: recommendedCommands,
    recommended_next_steps: recommendedNextSteps,
    attn_catalog_snapshot: Boolean(attnSnapshots.catalog),
    attn_capabilities_snapshot: Boolean(attnSnapshots.capabilities),
    attn_snapshot_scope: snapshotScope,
    attn_snapshot_note: attnSnapshotNote(snapshotScope),
    artifact_paths: artifactPaths,
    failures,
  };

  artifactPaths.summary = await logger.writeJson("doctor-summary.json", summary);
  await logger.log({
    step: "doctor",
    status: summary.ok ? "ok" : "needs_action",
    artifact: artifactPaths.summary,
  });
  return summary;
}

async function runClawpumpMockPilot(options: CliOptions): Promise<RunSummary> {
  const logger = await createLogger(options.outDir);
  const artifactPaths: Record<string, string> = {};
  const failures: Array<{ step: string; message: string; code?: string }> = [];
  const snapshotScope = resolveAttnSnapshotScope(options);

  await logger.log({ step: "run", status: "started", command: options.command });
  artifactPaths.inputs = await logger.writeJson("inputs.json", {
    command: options.command,
    attn_base_url: options.attnBaseUrl ?? null,
    preset_id: options.presetId ?? null,
    creator_ingress_mode: options.creatorIngressMode ?? null,
    control_profile_id: options.controlProfileId ?? null,
    repayment_target: options.repaymentTarget,
    repayment_share_bps: options.repaymentShareBps,
    inject_failures: options.injectFailures,
  });

  const client = createMockClawPumpClient({
    failures: parseInjectedFailures(options.injectFailures),
    request_prefix: path.basename(logger.runDir),
  });

  const launch = await client.getLaunch(DEFAULT_MINT);
  artifactPaths.partner_launch = await logger.writeJson("partner/launch.json", launch);
  await logger.log({ step: "partner.getLaunch", status: launch.ok ? "ok" : "error", artifact: artifactPaths.partner_launch });
  if (!launch.ok) failures.push({ step: "partner.getLaunch", message: launch.error.message, code: launch.error.kind });

  const payout = await client.getPayoutTopology(DEFAULT_MINT);
  artifactPaths.partner_payout_topology = await logger.writeJson("partner/payout-topology.json", payout);
  await logger.log({ step: "partner.getPayoutTopology", status: payout.ok ? "ok" : "error", artifact: artifactPaths.partner_payout_topology });
  if (!payout.ok) failures.push({ step: "partner.getPayoutTopology", message: payout.error.message, code: payout.error.kind });

  const feeState = await client.getCreatorFeeState(DEFAULT_MINT);
  artifactPaths.partner_creator_fee_state = await logger.writeJson("partner/creator-fee-state.json", feeState);
  await logger.log({ step: "partner.getCreatorFeeState", status: feeState.ok ? "ok" : "error", artifact: artifactPaths.partner_creator_fee_state });
  if (!feeState.ok) failures.push({ step: "partner.getCreatorFeeState", message: feeState.error.message, code: feeState.error.kind });

  const revenueEvents = await client.listRevenueEvents(DEFAULT_MINT, { limit: 3 });
  artifactPaths.partner_revenue_events = await logger.writeJson("partner/revenue-events.json", revenueEvents);
  await logger.log({ step: "partner.listRevenueEvents", status: revenueEvents.ok ? "ok" : "error", artifact: artifactPaths.partner_revenue_events });
  if (!revenueEvents.ok) failures.push({ step: "partner.listRevenueEvents", message: revenueEvents.error.message, code: revenueEvents.error.kind });

  const initialMode = await client.getRepaymentMode(DEFAULT_MINT);
  artifactPaths.partner_repayment_mode_initial = await logger.writeJson("partner/repayment-mode.initial.json", initialMode);
  await logger.log({ step: "partner.getRepaymentMode.initial", status: initialMode.ok ? "ok" : "error", artifact: artifactPaths.partner_repayment_mode_initial });
  if (!initialMode.ok) failures.push({ step: "partner.getRepaymentMode.initial", message: initialMode.error.message, code: initialMode.error.kind });

  const activatedMode = await client.setRepaymentMode({
    mint: DEFAULT_MINT,
    repayment_target: options.repaymentTarget,
    repayment_share_bps: options.repaymentShareBps,
    activated_by: "attn_operator",
    note: "partner-managed harness activation",
  });
  artifactPaths.partner_repayment_mode_active = await logger.writeJson("partner/repayment-mode.active.json", activatedMode);
  await logger.log({ step: "partner.setRepaymentMode", status: activatedMode.ok ? "ok" : "error", artifact: artifactPaths.partner_repayment_mode_active });
  if (!activatedMode.ok) failures.push({ step: "partner.setRepaymentMode", message: activatedMode.error.message, code: activatedMode.error.kind });

  const attnSnapshots = await maybeFetchAttnSnapshots({
    options,
    logger,
    artifactPaths,
    failures,
  });

  const policy = derivePolicy({
    launchOk: launch.ok,
    payoutOk: payout.ok,
    feeStateOk: feeState.ok,
    eventsOk: revenueEvents.ok,
    routingOk: activatedMode.ok,
    attnCatalogOk: Boolean(attnSnapshots.catalog),
    capabilitiesOk: Boolean(attnSnapshots.capabilities),
  });
  const assessment = classifyPartnerManagedLane({ policy });

  let descriptor: PartnerManagedIntegrationDescriptor;
  if (payout.ok || revenueEvents.ok || activatedMode.ok) {
    descriptor = createClawPumpIntegrationDescriptor({
      partner_id: options.partnerId,
      display_name: options.displayName,
      payout_topology: payout.ok ? payout.data : undefined,
      payout_topology_receipt: payout.ok ? payout.receipt : undefined,
      revenue_events: revenueEvents.ok ? revenueEvents.data : undefined,
      revenue_events_receipt: revenueEvents.ok ? revenueEvents.receipt : undefined,
      repayment_mode: activatedMode.ok
        ? activatedMode.data
        : initialMode.ok
          ? initialMode.data
          : undefined,
      repayment_mode_receipt: activatedMode.ok
        ? activatedMode.receipt
        : initialMode.ok
          ? initialMode.receipt
          : undefined,
      operator_model: "quorum_or_policy_engine",
    });
  } else {
    descriptor = createPartnerManagedIntegrationDescriptor({
      partner_id: options.partnerId,
      display_name: options.displayName,
      chain: "solana",
      cluster: "mainnet-beta",
      revenue_scope_model: "creator_and_service_fees",
      payout_topology_source: {
        source_id: "clawpump/mock/payout_topology",
        source_kind: "api",
        observed_at: new Date().toISOString(),
        proof_state: "spec_only",
      },
      debt_open_routing_source: {
        source_id: "clawpump/mock/repayment_mode",
        source_kind: "api",
        observed_at: new Date().toISOString(),
        proof_state: "spec_only",
      },
      readback_support: {
        payout_topology: false,
        revenue_events: false,
        debt_open_routing: false,
        change_authority: false,
        incident_state: false,
        release_state: false,
      },
    });
  }

  const evidencePack: PartnerManagedEvidencePack =
    payout.ok || revenueEvents.ok || activatedMode.ok
        ? createClawPumpEvidencePack({
          partner_id: options.partnerId,
          display_name: options.displayName,
          policy,
          payout_topology: payout.ok ? payout.data : undefined,
          payout_topology_receipt: payout.ok ? payout.receipt : undefined,
          revenue_events: revenueEvents.ok ? revenueEvents.data : undefined,
          revenue_events_receipt: revenueEvents.ok ? revenueEvents.receipt : undefined,
          repayment_mode: activatedMode.ok
            ? activatedMode.data
            : initialMode.ok
              ? initialMode.data
              : undefined,
          repayment_mode_receipt: activatedMode.ok
            ? activatedMode.receipt
            : initialMode.ok
              ? initialMode.receipt
              : undefined,
          assessment,
          evidence_refs: Object.values(artifactPaths),
          notes: [
            "This run proves the public SDK artifact contract and mock-pilot execution surface.",
            "This run does not prove live partner payout-control parity or real treasury-funding execution.",
          ],
        })
      : createPartnerManagedEvidencePack({
          descriptor,
          policy,
          assessment,
          evidence_refs: Object.values(artifactPaths),
        });

  parsePartnerManagedWalletPolicySummary(policy);
  parsePartnerManagedIntegrationDescriptor(descriptor);
  parsePartnerManagedEvidencePack(evidencePack);

  artifactPaths.sdk_policy_summary = await writeLoggedJson(
    logger,
    "sdk/policy-summary.json",
    policy,
    "sdk.writePolicySummary",
  );
  artifactPaths.sdk_integration_descriptor = await writeLoggedJson(
    logger,
    "sdk/integration-descriptor.json",
    descriptor,
    "sdk.writeIntegrationDescriptor",
  );
  artifactPaths.sdk_stage_assessment = await writeLoggedJson(
    logger,
    "sdk/stage-assessment.json",
    assessment,
    "sdk.writeStageAssessment",
  );
  artifactPaths.sdk_evidence_pack = await writeLoggedJson(
    logger,
    "sdk/evidence-pack.json",
    evidencePack,
    "sdk.writeEvidencePack",
  );

  const summary: RunSummary = {
    ok: failures.length === 0,
    command: options.command,
    run_id: path.basename(logger.runDir),
    run_dir: logger.runDir,
    log_path: logger.logPath,
    stage: assessment.stage,
    claim_level: assessment.claim_level,
    required_partner_inputs: evidencePack.required_partner_inputs,
    residual_risk_codes: assessment.residual_risk_codes,
    attn_catalog_snapshot: Boolean(attnSnapshots.catalog),
    attn_capabilities_snapshot: Boolean(attnSnapshots.capabilities),
    attn_snapshot_scope: snapshotScope,
    attn_snapshot_note: attnSnapshotNote(snapshotScope),
    artifact_paths: artifactPaths,
    failures,
  };

  artifactPaths.summary = await logger.writeJson("summary.json", summary);
  await logger.log({ step: "run", status: summary.ok ? "ok" : "degraded", artifact: artifactPaths.summary });
  return summary;
}

async function runClawpumpPackFromFiles(options: CliOptions): Promise<RunSummary> {
  const logger = await createLogger(options.outDir);
  const artifactPaths: Record<string, string> = {};
  const failures: Array<{ step: string; message: string; code?: string }> = [];
  const snapshotScope = resolveAttnSnapshotScope(options);

  await logger.log({ step: "run", status: "started", command: options.command });
  artifactPaths.inputs = await logger.writeJson("inputs.json", {
    command: options.command,
    attn_base_url: options.attnBaseUrl ?? null,
    preset_id: options.presetId ?? null,
    creator_ingress_mode: options.creatorIngressMode ?? null,
    control_profile_id: options.controlProfileId ?? null,
    proof_state: options.proofState,
    partner_id: options.partnerId,
    display_name: options.displayName,
    source_files: {
      launch: options.launchPath ?? null,
      payout_topology: options.payoutTopologyPath ?? null,
      creator_fee_state: options.creatorFeeStatePath ?? null,
      revenue_events: options.revenueEventsPath ?? null,
      repayment_mode: options.repaymentModePath ?? null,
    },
  });

  const launch = await readJsonArtifact({
    logger,
    failures,
    filePath: options.launchPath,
    required: false,
    label: "launch",
    schema: zClawPumpLaunch,
    artifactPaths,
  });
  const payout = await readJsonArtifact({
    logger,
    failures,
    filePath: options.payoutTopologyPath,
    required: true,
    label: "payout_topology",
    schema: zClawPumpPayoutTopology,
    artifactPaths,
  });
  const feeState = await readJsonArtifact({
    logger,
    failures,
    filePath: options.creatorFeeStatePath,
    required: false,
    label: "creator_fee_state",
    schema: zClawPumpCreatorFeeState,
    artifactPaths,
  });
  const revenueEvents = await readJsonArtifact({
    logger,
    failures,
    filePath: options.revenueEventsPath,
    required: true,
    label: "revenue_events",
    schema: z.array(zClawPumpRevenueEvent),
    artifactPaths,
  });
  const repaymentMode = await readJsonArtifact({
    logger,
    failures,
    filePath: options.repaymentModePath,
    required: false,
    label: "repayment_mode",
    schema: zClawPumpRepaymentMode,
    artifactPaths,
  });

  if (artifactPaths.input_launch) artifactPaths.partner_launch = artifactPaths.input_launch;
  if (artifactPaths.input_payout_topology) artifactPaths.partner_payout_topology = artifactPaths.input_payout_topology;
  if (artifactPaths.input_creator_fee_state) artifactPaths.partner_creator_fee_state = artifactPaths.input_creator_fee_state;
  if (artifactPaths.input_revenue_events) artifactPaths.partner_revenue_events = artifactPaths.input_revenue_events;
  if (artifactPaths.input_repayment_mode) artifactPaths.partner_repayment_mode = artifactPaths.input_repayment_mode;

  const receivedAt = new Date().toISOString();
  const receiptMeta = (sourceTimestamp?: string, note?: string) =>
    createTransportMeta({
      partner_request_id: `files:${path.basename(logger.runDir)}`,
      source_timestamp: sourceTimestamp,
      proof_state: options.proofState,
      notes: note ? [note] : [],
    });

  const launchReceipt =
    launch &&
    createLaunchReceipt({
      mint: launch.mint,
      received_at: receivedAt,
      meta: receiptMeta(launch.created_at, "file_backed_launch_snapshot"),
      launch,
    });
  const payoutReceipt =
    payout &&
    createPayoutTopologyReceipt({
      mint: payout.mint,
      received_at: receivedAt,
      meta: receiptMeta(payout.source_timestamp, "file_backed_payout_snapshot"),
      topology: payout,
    });
  const feeStateReceipt =
    feeState &&
    createCreatorFeeStateReceipt({
      mint: feeState.mint,
      received_at: receivedAt,
      meta: receiptMeta(feeState.source_timestamp, "file_backed_creator_fee_state_snapshot"),
      fee_state: feeState,
    });
  const revenueEventsReceipt =
    revenueEvents &&
    createRevenueEventsReceipt({
      mint: revenueEvents[0]?.mint ?? payout?.mint,
      received_at: receivedAt,
      meta: receiptMeta(revenueEvents[0]?.block_time, "file_backed_revenue_events_snapshot"),
      events: revenueEvents,
    });
  const repaymentModeReceipt =
    repaymentMode &&
    (repaymentMode.mode_state === "cleared"
      ? createReleaseModeReceipt({
          mint: repaymentMode.mint,
          received_at: receivedAt,
          meta: receiptMeta(repaymentMode.source_timestamp, "file_backed_release_mode_snapshot"),
          mode: repaymentMode,
        })
      : createRepaymentModeReceipt({
          mint: repaymentMode.mint,
          received_at: receivedAt,
          meta: receiptMeta(repaymentMode.source_timestamp, "file_backed_repayment_mode_snapshot"),
          mode: repaymentMode,
        }));

  if (launchReceipt) {
    artifactPaths.partner_launch_receipt = await writeLoggedJson(
      logger,
      "partner/launch.receipt.json",
      launchReceipt,
      "partner.writeLaunchReceipt",
    );
  }
  if (payoutReceipt) {
    artifactPaths.partner_payout_topology_receipt = await writeLoggedJson(
      logger,
      "partner/payout-topology.receipt.json",
      payoutReceipt,
      "partner.writePayoutReceipt",
    );
  }
  if (feeStateReceipt) {
    artifactPaths.partner_creator_fee_state_receipt = await writeLoggedJson(
      logger,
      "partner/creator-fee-state.receipt.json",
      feeStateReceipt,
      "partner.writeCreatorFeeStateReceipt",
    );
  }
  if (revenueEventsReceipt) {
    artifactPaths.partner_revenue_events_receipt = await writeLoggedJson(
      logger,
      "partner/revenue-events.receipt.json",
      revenueEventsReceipt,
      "partner.writeRevenueEventsReceipt",
    );
  }
  if (repaymentModeReceipt) {
    artifactPaths.partner_repayment_mode_receipt = await writeLoggedJson(
      logger,
      "partner/repayment-mode.receipt.json",
      repaymentModeReceipt,
      "partner.writeRepaymentModeReceipt",
    );
  }

  const attnSnapshots = await maybeFetchAttnSnapshots({
    options,
    logger,
    artifactPaths,
    failures,
  });

  const policy = deriveFileBackedPolicy({
    launch,
    payout,
    feeState,
    revenueEvents,
    repaymentMode,
    attnCatalogOk: Boolean(attnSnapshots.catalog),
    capabilitiesOk: Boolean(attnSnapshots.capabilities),
  });
  const assessment = classifyPartnerManagedLane({ policy });
  const descriptor =
    payout || revenueEvents || repaymentMode
      ? createClawPumpIntegrationDescriptor({
          partner_id: options.partnerId,
          display_name: options.displayName,
          payout_topology: payout ?? undefined,
          payout_topology_receipt: payoutReceipt ?? undefined,
          revenue_events: revenueEvents ?? undefined,
          revenue_events_receipt: revenueEventsReceipt ?? undefined,
          repayment_mode: repaymentMode ?? undefined,
          repayment_mode_receipt: repaymentModeReceipt ?? undefined,
        })
      : createPartnerManagedIntegrationDescriptor({
          partner_id: options.partnerId,
          display_name: options.displayName,
          chain: "solana",
          cluster: "mainnet-beta",
          revenue_scope_model: "creator_and_service_fees",
          payout_topology_source: {
            source_id: `${options.partnerId}/files/payout_topology`,
            source_kind: "manual_attestation",
            observed_at: new Date().toISOString(),
            proof_state: "spec_only",
          },
          debt_open_routing_source: {
            source_id: `${options.partnerId}/files/repayment_mode`,
            source_kind: "manual_attestation",
            observed_at: new Date().toISOString(),
            proof_state: "spec_only",
          },
          readback_support: {
            payout_topology: false,
            revenue_events: false,
            debt_open_routing: false,
            change_authority: false,
            incident_state: false,
            release_state: false,
          },
        });

  const evidencePack = createClawPumpEvidencePack({
    partner_id: options.partnerId,
    display_name: options.displayName,
    policy,
    payout_topology: payout ?? undefined,
    payout_topology_receipt: payoutReceipt ?? undefined,
    creator_fee_state_receipt: feeStateReceipt ?? undefined,
    revenue_events: revenueEvents ?? undefined,
    revenue_events_receipt: revenueEventsReceipt ?? undefined,
    repayment_mode: repaymentMode ?? undefined,
    repayment_mode_receipt: repaymentModeReceipt ?? undefined,
    assessment,
    evidence_refs: Object.values(artifactPaths),
    notes: [
      "This run packages partner-provided ClawPump-style readbacks into the public SDK artifact contract.",
      "This run does not prove live treasury funding, payout-control parity, or the hosted attn callable fallback as the same lane.",
    ],
  });

  parsePartnerManagedWalletPolicySummary(policy);
  parsePartnerManagedIntegrationDescriptor(descriptor);
  parsePartnerManagedEvidencePack(evidencePack);

  artifactPaths.sdk_policy_summary = await writeLoggedJson(
    logger,
    "sdk/policy-summary.json",
    policy,
    "sdk.writePolicySummary",
  );
  artifactPaths.sdk_integration_descriptor = await writeLoggedJson(
    logger,
    "sdk/integration-descriptor.json",
    descriptor,
    "sdk.writeIntegrationDescriptor",
  );
  artifactPaths.sdk_stage_assessment = await writeLoggedJson(
    logger,
    "sdk/stage-assessment.json",
    assessment,
    "sdk.writeStageAssessment",
  );
  artifactPaths.sdk_evidence_pack = await writeLoggedJson(
    logger,
    "sdk/evidence-pack.json",
    evidencePack,
    "sdk.writeEvidencePack",
  );

  const summary: RunSummary = {
    ok: failures.length === 0,
    command: options.command,
    run_id: path.basename(logger.runDir),
    run_dir: logger.runDir,
    log_path: logger.logPath,
    stage: assessment.stage,
    claim_level: assessment.claim_level,
    required_partner_inputs: evidencePack.required_partner_inputs,
    residual_risk_codes: assessment.residual_risk_codes,
    attn_catalog_snapshot: Boolean(attnSnapshots.catalog),
    attn_capabilities_snapshot: Boolean(attnSnapshots.capabilities),
    attn_snapshot_scope: snapshotScope,
    attn_snapshot_note: attnSnapshotNote(snapshotScope),
    artifact_paths: artifactPaths,
    failures,
  };

  artifactPaths.summary = await logger.writeJson("summary.json", summary);
  await logger.log({ step: "run", status: summary.ok ? "ok" : "degraded", artifact: artifactPaths.summary });
  return summary;
}

async function runClawpumpMockMatrix(options: CliOptions): Promise<MatrixSummary> {
  const matrixId = `matrix-${timestampForId()}-${Math.random().toString(16).slice(2, 8)}`;
  const matrixDir = path.resolve(options.outDir, matrixId);
  const logPath = path.join(matrixDir, "logs", "events.ndjson");
  await mkdir(path.dirname(logPath), { recursive: true });

  const log = async (event: Record<string, unknown>) => {
    await appendFile(
      logPath,
      `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`,
      "utf8",
    );
  };

  const scenarios: Array<{ scenario_id: string; option_overrides?: Partial<CliOptions> }> = [
    { scenario_id: "baseline" },
    {
      scenario_id: "payout_topology_unavailable",
      option_overrides: {
        injectFailures: ["getPayoutTopology:unavailable"],
      },
    },
    {
      scenario_id: "repayment_activation_unsupported",
      option_overrides: {
        injectFailures: ["setRepaymentMode:unsupported"],
      },
    },
  ];

  const scenarioSummaries: MatrixSummary["scenario_summaries"] = [];
  await log({ step: "matrix", status: "started", matrix_id: matrixId, scenario_count: scenarios.length });

  for (const scenario of scenarios) {
    await log({ step: "matrix.scenario", status: "started", scenario_id: scenario.scenario_id });
    const summary = await runClawpumpMockPilot({
      ...options,
      ...(scenario.option_overrides ?? {}),
      command: "partner-managed-mock-pilot",
      outDir: path.join(matrixDir, scenario.scenario_id),
    });
    scenarioSummaries.push({
      scenario_id: scenario.scenario_id,
      ok: summary.ok,
      stage: summary.stage,
      claim_level: summary.claim_level,
      run_dir: summary.run_dir,
      failure_count: summary.failures.length,
    });
    await log({
      step: "matrix.scenario",
      status: summary.ok ? "ok" : "degraded",
      scenario_id: scenario.scenario_id,
      run_dir: summary.run_dir,
      stage: summary.stage,
      failure_count: summary.failures.length,
    });
  }

  const summary: MatrixSummary = {
    ok: true,
    command: "partner-managed-mock-matrix",
    matrix_id: matrixId,
    matrix_dir: matrixDir,
    log_path: logPath,
    all_scenarios_ok: scenarioSummaries.every((scenario) => scenario.ok),
    degraded_scenario_count: scenarioSummaries.filter((scenario) => !scenario.ok).length,
    scenario_summaries: scenarioSummaries,
  };
  await writeFile(path.join(matrixDir, "matrix-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await log({
    step: "matrix",
    status: summary.all_scenarios_ok ? "ok" : "degraded",
    artifact: path.join(matrixDir, "matrix-summary.json"),
  });
  return summary;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "partner-managed-mock-pilot") {
    const summary = await runClawpumpMockPilot(options);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exitCode = summary.ok ? 0 : 1;
    return;
  }
  if (options.command === "partner-managed-pack-from-files") {
    const summary = await runClawpumpPackFromFiles(options);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exitCode = summary.ok ? 0 : 1;
    return;
  }
  if (options.command === "partner-managed-doctor") {
    const summary = await runPartnerManagedDoctor(options);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exitCode = summary.ok ? 0 : 1;
    return;
  }
  if (options.command === "partner-managed-mock-matrix") {
    const summary = await runClawpumpMockMatrix(options);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exitCode = summary.ok ? 0 : 1;
    return;
  }
  throw new Error(`unsupported command: ${options.command}`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
