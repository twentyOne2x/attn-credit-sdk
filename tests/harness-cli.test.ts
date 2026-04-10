import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const REPO_ROOT = "/Users/user/PycharmProjects/attn-credit-sdk";
const CLI_DIST_PATH = path.join(REPO_ROOT, "packages/harness-cli/dist/index.js");

async function runCli(args: string[]) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [CLI_DIST_PATH, ...args], {
    cwd: REPO_ROOT,
  });
  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    summary: JSON.parse(stdout) as Record<string, any>,
  };
}

async function runCliRaw(args: string[]) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [CLI_DIST_PATH, ...args], {
    cwd: REPO_ROOT,
  });
  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

test("partner harness CLI emits a retained run directory with SDK artifacts and logs", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-"));
  const result = await runCli(["partner-managed-mock-pilot", "--out-dir", outDir]);

  assert.equal(result.summary.ok, true);
  assert.equal(result.summary.stage, "stage_2_observable_payout_path_mvp");
  assert.equal(result.summary.claim_level, "underwriting_compatible");
  assert.equal(result.summary.attn_catalog_snapshot, false);
  assert.equal(result.summary.attn_capabilities_snapshot, false);
  assert.equal(result.summary.attn_snapshot_scope, "none");
  assert.match(result.summary.attn_snapshot_note, /no attn snapshot/i);
  assert.ok(result.summary.artifact_paths.sdk_evidence_pack);
  assert.ok(result.summary.artifact_paths.partner_payout_topology);

  const summaryFile = await readFile(result.summary.artifact_paths.summary, "utf8");
  const evidencePackFile = await readFile(result.summary.artifact_paths.sdk_evidence_pack, "utf8");
  const logFile = await readFile(path.join(result.summary.run_dir, "logs", "events.ndjson"), "utf8");

  const summaryJson = JSON.parse(summaryFile) as { stage: string };
  const evidencePackJson = JSON.parse(evidencePackFile) as {
    descriptor: { partner_id: string };
    assessment: { stage: string };
    receipts: Array<{ receipt_type: string }>;
  };

  assert.equal(summaryJson.stage, "stage_2_observable_payout_path_mvp");
  assert.equal(evidencePackJson.descriptor.partner_id, "partner_demo");
  assert.equal(evidencePackJson.assessment.stage, "stage_2_observable_payout_path_mvp");
  assert.deepEqual(
    evidencePackJson.receipts.map((receipt) => receipt.receipt_type),
    [
      "partner_managed_payout_topology_receipt",
      "partner_managed_change_event_receipt",
      "partner_managed_revenue_events_receipt",
      "partner_managed_debt_open_routing_receipt",
    ],
  );
  assert.match(logFile, /partner\.getPayoutTopology/);
  assert.match(logFile, /sdk\.writeEvidencePack/);
  assert.equal(
    result.summary.required_partner_inputs.includes("payout_edit_authority_separation"),
    true,
  );
  assert.equal(
    result.summary.residual_risk_codes.includes("private_treasury_funding_receipts_missing"),
    true,
  );
});

test("partner harness CLI can render a human-readable validation summary for quick gauging", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-human-"));
  const result = await runCliRaw([
    "partner-managed-validate",
    "--out-dir",
    outDir,
    "--launch",
    path.join(REPO_ROOT, "examples", "partner-managed", "launch.json"),
    "--payout-topology",
    path.join(REPO_ROOT, "examples", "partner-managed", "payout-topology.json"),
    "--creator-fee-state",
    path.join(REPO_ROOT, "examples", "partner-managed", "creator-fee-state.json"),
    "--revenue-events",
    path.join(REPO_ROOT, "examples", "partner-managed", "revenue-events.json"),
    "--repayment-mode",
    path.join(REPO_ROOT, "examples", "partner-managed", "repayment-mode.json"),
    "--format",
    "human",
  ]);

  assert.equal(result.stderr, "");
  assert.match(result.stdout, /command: partner-managed-validate/);
  assert.match(result.stdout, /bundle ready for first retained run: yes/);
  assert.match(result.stdout, /current stage: stage_2_observable_payout_path_mvp/);
  assert.match(result.stdout, /next stage: stage_3_policy_bounded_first_pilot/);
  assert.match(result.stdout, /next steps:/);
});

test("partner harness CLI can render a human-readable retained pack summary", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-human-pack-"));
  const result = await runCliRaw([
    "partner-managed-pack-from-files",
    "--out-dir",
    outDir,
    "--launch",
    path.join(REPO_ROOT, "examples", "partner-managed", "launch.json"),
    "--payout-topology",
    path.join(REPO_ROOT, "examples", "partner-managed", "payout-topology.json"),
    "--creator-fee-state",
    path.join(REPO_ROOT, "examples", "partner-managed", "creator-fee-state.json"),
    "--revenue-events",
    path.join(REPO_ROOT, "examples", "partner-managed", "revenue-events.json"),
    "--repayment-mode",
    path.join(REPO_ROOT, "examples", "partner-managed", "repayment-mode.json"),
    "--format",
    "human",
  ]);

  assert.equal(result.stderr, "");
  assert.match(result.stdout, /command: partner-managed-pack-from-files/);
  assert.match(result.stdout, /ok: yes/);
  assert.match(result.stdout, /stage: stage_2_observable_payout_path_mvp/);
  assert.match(result.stdout, /claim level: underwriting_compatible/);
});

test("partner harness CLI fails closed when partner reads are injected to fail", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-fail-"));
  const result = await runCli([
    "partner-managed-mock-pilot",
    "--out-dir",
    outDir,
    "--inject-failure",
    "getPayoutTopology:unavailable",
  ]).catch((error: { stdout?: string }) => {
    const stdout = error.stdout ?? "";
    return {
      stdout: stdout.trim(),
      summary: JSON.parse(stdout) as {
        ok: boolean;
        stage: string;
        failures: Array<{ step: string; code?: string }>;
      },
    };
  });

  assert.equal(result.summary.ok, false);
  assert.equal(result.summary.stage, "stage_0_truth_discovery");
  assert.equal(
    result.summary.failures.some(
      (failure) => failure.step === "partner.getPayoutTopology" && failure.code === "unavailable",
    ),
    true,
  );
  assert.equal(
    result.summary.failures.every((failure) => typeof failure.message === "string" && failure.message.length > 0),
    true,
  );
});

test("partner harness CLI snapshots attn catalog and capabilities through a deterministic local server", async () => {
  const server = http.createServer((request, response) => {
    if (request.url?.startsWith("/api/partner/credit/catalog")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          ok: true,
          catalog_version: "v1",
          current_truth: {
            live_claim_scope: "callable_fallback_only",
          },
        }),
      );
      return;
    }

    if (request.url === "/api/partner/credit/capabilities") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          ok: true,
          receipt_type: "partner_capabilities_receipt",
          state: "ready",
        }),
      );
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: false }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to bind local test server");
  }

  try {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-attn-"));
    const result = await runCli([
      "partner-managed-mock-pilot",
      "--out-dir",
      outDir,
      "--attn-base-url",
      `http://127.0.0.1:${address.port}`,
      "--preset-id",
      "solana_borrower_privy_only",
      "--creator-ingress-mode",
      "direct-to-swig",
      "--control-profile-id",
      "partner_managed_light",
    ]);

  assert.equal(result.summary.ok, true);
  assert.equal(result.summary.attn_catalog_snapshot, true);
  assert.equal(result.summary.attn_capabilities_snapshot, true);
  assert.equal(result.summary.attn_snapshot_scope, "current_callable_fallback_tuple");
  assert.match(result.summary.attn_snapshot_note, /current hosted callable fallback tuple/i);

    const catalogFile = await readFile(result.summary.artifact_paths.attn_catalog, "utf8");
    const capabilitiesFile = await readFile(result.summary.artifact_paths.attn_capabilities, "utf8");
    const catalogJson = JSON.parse(catalogFile) as { current_truth?: { live_claim_scope?: string } };
    const capabilitiesJson = JSON.parse(capabilitiesFile) as { state?: string };

    assert.equal(catalogJson.current_truth?.live_claim_scope, "callable_fallback_only");
    assert.equal(capabilitiesJson.state, "ready");
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("partner harness CLI can gauge the live attn catalog through the public SDK wrapper", async () => {
  const server = http.createServer((request, response) => {
    if (request.url?.startsWith("/api/partner/credit/catalog")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          ok: true,
          catalog_version: "v1",
          lane: {
            lane_id: "pump_creator_fee_borrower_lane",
            title: "Pump creator-fee borrower lane (Solana-first)",
            chain: "solana",
            cluster: "mainnet-beta",
            preset_id: "solana_borrower_legacy_swig",
            creator_ingress_mode: "via-borrower",
            control_profile_id: "attn_default",
            capital_source: "treasury_wallet",
            funding_mode: "manual_operator_release",
            production_truth: "executable_private_pilot",
            lane_contract_state: "treasury_private_pilot",
            revenue_source: "pumpfun_creator_fees",
            revenue_unit: "SOL",
            repayment_source: "swig_controlled_creator_fee_capture",
            primary_debt_unit: "SOL",
            current_callable_debt_unit: "SOL",
            primary_lane_contract: "pump_creator_fee_solana_first",
            current_callable_lane_contract: "treasury_private_pilot_sol",
            coexistence_state: "treasury_sol_fallback_primary_pending",
            proof_state: "current",
            public_claim_state: "current",
            blockers: [],
            blocker_codes: [],
            next_actions: [],
            notes: [],
          },
          current_truth: {
            can_agent_discover_lane_now: true,
            can_agent_start_onboarding_now: true,
            can_agent_complete_primary_lane_now: false,
            can_agent_complete_real_credit_now: true,
            can_agent_complete_public_market_now: false,
            primary_lane_readiness_state: "blocked_non_sol_dependency",
            primary_lane_blockers: ["raw_protocol_debt_unit_not_sol_only"],
            public_market_readiness_state: "blocked_primary_lane",
            public_market_blockers: ["primary_lane_not_live"],
            real_credit_blockers: [],
            live_claim_scope: "callable_fallback_only",
            closure_hosted_state: {
              storage_mode: "database",
              datasource_env_state: "configured",
              durable_state_backend: "shared_system_kv",
              persistence_topology: "mixed_persistence",
              runtime_fallback_state: "fail_closed",
            },
            dashboard_speed: {
              supplied: true,
              borrower_measured_receipt_count: 1,
              lender_measured_receipt_count: 0,
              borrower_blockers: [],
              lender_blockers: ["lender_dashboard_speed_receipts_missing"],
            },
            proof_contract_summary: null,
            mcp_transport_state: "wrapper_ready",
            agent_operability_state: "funded_live_ready",
            recommended_package: "@attn-credit/sdk",
            recommended_wrapper: "createPumpAgentBorrowerTools",
            skill_surface_path: "/skill.md",
            runbook_surface_path: "/partner-credit-runbook.md",
          },
          action_order: ["check_credit", "start_onboarding"],
          routes: [],
        }),
      );
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: false }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to bind local test server");
  }

  try {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-live-catalog-"));
    const result = await runCli([
      "attn-live-catalog",
      "--out-dir",
      outDir,
      "--attn-base-url",
      `http://127.0.0.1:${address.port}`,
    ]);

    assert.equal(result.summary.ok, true);
    assert.equal(result.summary.live_claim_scope, "callable_fallback_only");
    assert.equal(result.summary.recommendation, "proceed_with_caution");
    assert.equal(result.summary.recommended_wrapper, "createPumpAgentBorrowerTools");
    assert.ok(result.summary.artifact_paths.catalog);
    assert.ok(result.summary.artifact_paths.catalog_summary);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("partner harness CLI can hit live capabilities and action commands through the public SDK wrapper", async () => {
  const calls: Array<{ url: string; body?: Record<string, unknown> }> = [];
  const server = http.createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      const body =
        chunks.length > 0
          ? (JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>)
          : undefined;
      calls.push({ url: request.url ?? "", body });

      if (request.url === "/api/partner/credit/capabilities") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            receipt_type: "partner_capabilities_receipt",
            request_id: "partner_caps_test",
            state: "ready",
            proof_state: "current",
            public_claim_state: "current",
            actions: {
              check_credit: {
                state: "ready",
                execution_mode: "read_only",
                context_requirements: [],
                blockers: [],
                next_actions: ["start_onboarding"],
              },
              get_attn_alignment_offer: {
                state: "ready",
                execution_mode: "read_only",
                context_requirements: [],
                blockers: [],
                next_actions: [],
              },
              accept_attn_alignment_offer: {
                state: "context_required",
                execution_mode: "blocked",
                context_requirements: ["session_context"],
                blockers: [],
                next_actions: [],
              },
              start_onboarding: {
                state: "ready",
                execution_mode: "transact_approved",
                context_requirements: ["payload"],
                blockers: [],
                next_actions: [],
              },
              get_stage_status: {
                state: "context_required",
                execution_mode: "read_only",
                context_requirements: ["session_id"],
                blockers: [],
                next_actions: [],
              },
              execute_handoff: {
                state: "context_required",
                execution_mode: "transact_approved",
                context_requirements: ["session_id"],
                blockers: [],
                next_actions: [],
              },
              open_credit_line: {
                state: "context_required",
                execution_mode: "manual_client_signature_required",
                context_requirements: ["session_id", "facility_pubkey"],
                blockers: [],
                next_actions: [],
              },
              repay: {
                state: "context_required",
                execution_mode: "manual_client_signature_required",
                context_requirements: ["facility_pubkey"],
                blockers: [],
                next_actions: [],
              },
              offboard: {
                state: "context_required",
                execution_mode: "manual_client_signature_required",
                context_requirements: ["session_id", "facility_pubkey"],
                blockers: [],
                next_actions: [],
              },
            },
          }),
        );
        return;
      }

      if (request.url === "/api/partner/credit/action") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            receipt_type: "partner_action_receipt",
            request_id: "partner_action_test",
            action: body?.action ?? "check_credit",
            state: "ready",
            result: {
              execution_mode: "read_only",
              verification_state: "evidence_verified",
            },
          }),
        );
        return;
      }

      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: false }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to bind local test server");
  }

  try {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-live-action-"));
    const capabilities = await runCli([
      "attn-live-capabilities",
      "--out-dir",
      outDir,
      "--attn-base-url",
      `http://127.0.0.1:${address.port}`,
    ]);
    const action = await runCli([
      "attn-live-action",
      "--out-dir",
      outDir,
      "--attn-base-url",
      `http://127.0.0.1:${address.port}`,
      "--action",
      "check_credit",
      "--mint",
      "Eg2ymQ2aQqjMcibnmTt8erC6Tvk9PVpJZCxvVPJz2agu",
    ]);

    assert.equal(capabilities.summary.ok, true);
    assert.ok(capabilities.summary.ready_actions.includes("check_credit"));
    assert.ok(capabilities.summary.ready_actions.includes("start_onboarding"));
    assert.equal(action.summary.ok, true);
    assert.equal(action.summary.action, "check_credit");
    assert.equal(action.summary.decision_status, "ready");

    const capabilitiesCall = calls.find((call) => call.url === "/api/partner/credit/capabilities");
    const actionCall = calls.find((call) => call.url === "/api/partner/credit/action");
    assert.ok(capabilitiesCall);
    assert.equal(capabilitiesCall!.body?.preset_id, "solana_borrower_legacy_swig");
    assert.equal(capabilitiesCall!.body?.creator_ingress_mode, "via-borrower");
    assert.ok(actionCall);
    assert.equal(actionCall!.body?.action, "check_credit");
    assert.equal(actionCall!.body?.mint, "Eg2ymQ2aQqjMcibnmTt8erC6Tvk9PVpJZCxvVPJz2agu");
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("partner harness CLI can retain a small scenario matrix for comparative analysis", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-matrix-"));
  const result = await runCli(["partner-managed-mock-matrix", "--out-dir", outDir]);

  const matrixSummary = result.summary as unknown as {
    ok: boolean;
    all_scenarios_ok: boolean;
    degraded_scenario_count: number;
    matrix_dir: string;
    scenario_summaries: Array<{
      scenario_id: string;
      stage: string;
      failure_count: number;
    }>;
  };

  assert.equal(matrixSummary.ok, true);
  assert.equal(matrixSummary.all_scenarios_ok, false);
  assert.equal(matrixSummary.degraded_scenario_count, 2);
  assert.equal(matrixSummary.scenario_summaries.length, 3);
  assert.deepEqual(
    matrixSummary.scenario_summaries.map((scenario) => scenario.scenario_id),
    ["baseline", "payout_topology_unavailable", "repayment_activation_unsupported"],
  );
  assert.equal(matrixSummary.scenario_summaries[0]?.stage, "stage_2_observable_payout_path_mvp");
  assert.equal(matrixSummary.scenario_summaries[1]?.stage, "stage_0_truth_discovery");
  assert.equal(matrixSummary.scenario_summaries[2]?.failure_count, 1);

  const matrixSummaryFile = await readFile(path.join(matrixSummary.matrix_dir, "matrix-summary.json"), "utf8");
  const matrixLogFile = await readFile(path.join(matrixSummary.matrix_dir, "logs", "events.ndjson"), "utf8");
  assert.match(matrixSummaryFile, /payout_topology_unavailable/);
  assert.match(matrixLogFile, /repayment_activation_unsupported/);
});

test("partner harness CLI can package clawpump-style partner files into retained SDK artifacts", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-files-"));
  const result = await runCli([
    "partner-managed-pack-from-files",
    "--out-dir",
    outDir,
    "--launch",
    path.join(REPO_ROOT, "examples", "partner-managed", "launch.json"),
    "--payout-topology",
    path.join(REPO_ROOT, "examples", "partner-managed", "payout-topology.json"),
    "--creator-fee-state",
    path.join(REPO_ROOT, "examples", "partner-managed", "creator-fee-state.json"),
    "--revenue-events",
    path.join(REPO_ROOT, "examples", "partner-managed", "revenue-events.json"),
    "--repayment-mode",
    path.join(REPO_ROOT, "examples", "partner-managed", "repayment-mode.json"),
  ]);

  assert.equal(result.summary.ok, true);
  assert.equal(result.summary.stage, "stage_2_observable_payout_path_mvp");
  assert.equal(result.summary.claim_level, "underwriting_compatible");
  assert.equal(result.summary.attn_snapshot_scope, "none");
  assert.ok(result.summary.artifact_paths.partner_launch);
  assert.ok(result.summary.artifact_paths.partner_revenue_events);
  assert.ok(result.summary.artifact_paths.partner_repayment_mode_receipt);

  const summaryFile = await readFile(result.summary.artifact_paths.summary, "utf8");
  const evidencePackFile = await readFile(result.summary.artifact_paths.sdk_evidence_pack, "utf8");
  const logFile = await readFile(path.join(result.summary.run_dir, "logs", "events.ndjson"), "utf8");

  const summaryJson = JSON.parse(summaryFile) as { stage: string; attn_snapshot_scope: string };
  const evidencePackJson = JSON.parse(evidencePackFile) as {
    descriptor: { partner_id: string; display_name: string };
    assessment: { stage: string };
  };

  assert.equal(summaryJson.stage, "stage_2_observable_payout_path_mvp");
  assert.equal(summaryJson.attn_snapshot_scope, "none");
  assert.equal(evidencePackJson.descriptor.partner_id, "partner_demo");
  assert.equal(evidencePackJson.descriptor.display_name, "Partner Demo");
  assert.equal(evidencePackJson.assessment.stage, "stage_2_observable_payout_path_mvp");
  assert.match(logFile, /inputs\.payout_topology/);
  assert.match(logFile, /partner\.writeRepaymentModeReceipt/);
});

test("partner harness validate checks a full first-run bundle and recommends the pack command", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-validate-"));
  const result = await runCli([
    "partner-managed-validate",
    "--out-dir",
    outDir,
    "--launch",
    path.join(REPO_ROOT, "examples", "partner-managed", "launch.json"),
    "--payout-topology",
    path.join(REPO_ROOT, "examples", "partner-managed", "payout-topology.json"),
    "--creator-fee-state",
    path.join(REPO_ROOT, "examples", "partner-managed", "creator-fee-state.json"),
    "--revenue-events",
    path.join(REPO_ROOT, "examples", "partner-managed", "revenue-events.json"),
    "--repayment-mode",
    path.join(REPO_ROOT, "examples", "partner-managed", "repayment-mode.json"),
  ]);

  assert.equal(result.summary.ok, true);
  assert.equal(result.summary.command, "partner-managed-validate");
  assert.equal(result.summary.pack_from_files_ready, true);
  assert.equal(result.summary.first_retained_run_ready, true);
  assert.equal(result.summary.current_stage, "stage_2_observable_payout_path_mvp");
  assert.equal(
    result.summary.recommended_commands.some((command: string) =>
      command.includes("partner-managed-pack-from-files"),
    ),
    true,
  );

  const validationSummaryFile = await readFile(result.summary.artifact_paths.summary, "utf8");
  const stageAssessmentFile = await readFile(
    result.summary.artifact_paths.validation_stage_assessment,
    "utf8",
  );
  const validationSummaryJson = JSON.parse(validationSummaryFile) as {
    next_stage: string | null;
    missing_recommended_inputs: string[];
  };
  const stageAssessmentJson = JSON.parse(stageAssessmentFile) as {
    next_requirement_ids: string[];
  };

  assert.equal(validationSummaryJson.next_stage, "stage_3_policy_bounded_first_pilot");
  assert.deepEqual(validationSummaryJson.missing_recommended_inputs, []);
  assert.equal(stageAssessmentJson.next_requirement_ids.length > 0, true);
});

test("partner harness validate fails closed when required inputs are missing", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-validate-missing-"));
  const result = await runCli([
    "partner-managed-validate",
    "--out-dir",
    outDir,
    "--revenue-events",
    path.join(REPO_ROOT, "examples", "partner-managed", "revenue-events.json"),
  ]).catch((error: { stdout?: string }) => {
    const stdout = error.stdout ?? "";
    return {
      stdout: stdout.trim(),
      summary: JSON.parse(stdout) as Record<string, any>,
    };
  });

  assert.equal(result.summary.ok, false);
  assert.equal(result.summary.pack_from_files_ready, false);
  assert.equal(
    result.summary.missing_required_inputs.includes("payout_topology"),
    true,
  );
  assert.equal(
    result.summary.failures.some(
      (failure: { step: string; code?: string }) =>
        failure.step === "inputs.payout_topology" && failure.code === "missing_input",
    ),
    true,
  );
});

test("legacy clawpump command aliases remain supported for compatibility", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "attn-sdk-harness-legacy-"));
  const result = await runCli([
    "clawpump-pack-from-files",
    "--out-dir",
    outDir,
    "--launch",
    path.join(REPO_ROOT, "examples", "clawpump", "launch.json"),
    "--payout-topology",
    path.join(REPO_ROOT, "examples", "clawpump", "payout-topology.json"),
    "--creator-fee-state",
    path.join(REPO_ROOT, "examples", "clawpump", "creator-fee-state.json"),
    "--revenue-events",
    path.join(REPO_ROOT, "examples", "clawpump", "revenue-events.json"),
    "--repayment-mode",
    path.join(REPO_ROOT, "examples", "clawpump", "repayment-mode.json"),
  ]);

  assert.equal(result.summary.ok, true);
  assert.equal(result.summary.command, "partner-managed-pack-from-files");

  const evidencePackFile = await readFile(result.summary.artifact_paths.sdk_evidence_pack, "utf8");
  const evidencePackJson = JSON.parse(evidencePackFile) as {
    descriptor: { partner_id: string; display_name: string };
  };

  assert.equal(evidencePackJson.descriptor.partner_id, "clawpump");
  assert.equal(evidencePackJson.descriptor.display_name, "ClawPump");
});
