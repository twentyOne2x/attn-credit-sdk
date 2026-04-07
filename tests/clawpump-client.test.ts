import assert from "node:assert/strict";
import test from "node:test";

import {
  createClawPumpEvidencePack,
  createClawPumpIntegrationDescriptor,
  createMockClawPumpClient,
} from "../packages/clawpump/src/index";
import {
  PARTNER_WALLET_POLICY_REQUIREMENT_IDS,
  createPartnerManagedWalletPolicyTemplate,
} from "../packages/sdk/src";

const DEFAULT_MINT = "clawmint11111111111111111111111111111111";
const DEFAULT_WALLET = "agentwallet111111111111111111111111111111";
const ATTN_TARGET = "attnrepay111111111111111111111111111111";

test("clawpump client returns typed launch and wallet launch receipts", async () => {
  const client = createMockClawPumpClient();

  const launch = await client.getLaunch(DEFAULT_MINT);
  assert.equal(launch.ok, true);
  if (!launch.ok) return;
  assert.equal(launch.data.launcher_platform, "clawpump");
  assert.equal(launch.receipt.receipt_type, "clawpump_launch_receipt");
  assert.equal(launch.receipt.cluster, "mainnet-beta");
  assert.equal(launch.receipt.proof_state, "backend_readonly_proven");

  const launches = await client.listLaunchesByWallet(DEFAULT_WALLET);
  assert.equal(launches.ok, true);
  if (!launches.ok) return;
  assert.equal(launches.data.length, 1);
  assert.equal(launches.receipt.wallet_query, DEFAULT_WALLET);
  assert.equal(launches.receipt.launch_count, 1);
});

test("clawpump client returns payout topology, fee state, and revenue event receipts", async () => {
  const client = createMockClawPumpClient();

  const topology = await client.getPayoutTopology(DEFAULT_MINT);
  assert.equal(topology.ok, true);
  if (!topology.ok) return;
  assert.equal(topology.data.platform_controls_dev_wallet, true);
  assert.equal(topology.receipt.receipt_type, "clawpump_payout_topology_receipt");
  assert.equal(topology.receipt.recipient_wallets?.length, 2);

  const feeState = await client.getCreatorFeeState(DEFAULT_MINT);
  assert.equal(feeState.ok, true);
  if (!feeState.ok) return;
  assert.equal(feeState.data.claimable_creator_fees_sol, 5.5);
  assert.equal(feeState.receipt.receipt_type, "clawpump_creator_fee_state_receipt");
  assert.equal(feeState.receipt.current_creator_fee_recipient, DEFAULT_WALLET);

  const events = await client.listRevenueEvents(DEFAULT_MINT, { limit: 2 });
  assert.equal(events.ok, true);
  if (!events.ok) return;
  assert.equal(events.data.length, 2);
  assert.equal(events.receipt.receipt_type, "clawpump_revenue_events_receipt");
  assert.equal(events.receipt.event_count, 2);
});

test("clawpump repayment mode can be activated and cleared through the mock transport", async () => {
  const client = createMockClawPumpClient();

  const setMode = await client.setRepaymentMode({
    mint: DEFAULT_MINT,
    repayment_target: ATTN_TARGET,
    repayment_share_bps: 6000,
    activated_by: "attn_operator",
    note: "pilot activation",
  });

  assert.equal(setMode.ok, true);
  if (!setMode.ok) return;
  assert.equal(setMode.data.mode_state, "active");
  assert.equal(setMode.data.repayment_target, ATTN_TARGET);
  assert.equal(setMode.receipt.receipt_type, "clawpump_repayment_mode_receipt");
  assert.equal(setMode.receipt.proof_state, "repayment_mode_proven");

  const currentMode = await client.getRepaymentMode(DEFAULT_MINT);
  assert.equal(currentMode.ok, true);
  if (!currentMode.ok) return;
  assert.equal(currentMode.data.mode_state, "active");
  assert.equal(currentMode.data.repayment_share_bps, 6000);

  const clearMode = await client.clearRepaymentMode({
    mint: DEFAULT_MINT,
    cleared_by: "attn_operator",
    release_target: DEFAULT_WALLET,
    note: "loan repaid",
  });
  assert.equal(clearMode.ok, true);
  if (!clearMode.ok) return;
  assert.equal(clearMode.data.mode_state, "cleared");
  assert.equal(clearMode.receipt.receipt_type, "clawpump_release_mode_receipt");
  assert.equal(clearMode.receipt.release_target, DEFAULT_WALLET);
});

test("clawpump client fails closed on unavailable backend reads", async () => {
  const client = createMockClawPumpClient({
    failures: {
      getCreatorFeeState: {
        kind: "unavailable",
        message: "partner backend timed out",
        retryable: true,
        status_code: 503,
      },
    },
  });

  const feeState = await client.getCreatorFeeState(DEFAULT_MINT);
  assert.equal(feeState.ok, false);
  if (feeState.ok) return;
  assert.equal(feeState.error.kind, "unavailable");
  assert.equal(feeState.receipt.proof_state, "blocked_partner_access");
  assert.equal(feeState.receipt.receipt_type, "clawpump_creator_fee_state_receipt");
});

test("clawpump client distinguishes unsupported and unauthorized control operations", async () => {
  const unsupportedClient = createMockClawPumpClient({
    failures: {
      clearRepaymentMode: {
        kind: "unsupported",
        message: "partner does not support release mode yet",
        retryable: false,
        status_code: 422,
      },
    },
  });

  const clearMode = await unsupportedClient.clearRepaymentMode({
    mint: DEFAULT_MINT,
    cleared_by: "attn_operator",
  });
  assert.equal(clearMode.ok, false);
  if (clearMode.ok) return;
  assert.equal(clearMode.error.kind, "unsupported");
  assert.equal(clearMode.receipt.proof_state, "blocked_partner_capability");
  assert.equal(clearMode.receipt.mode_state, "unsupported");

  const unauthorizedClient = createMockClawPumpClient({
    failures: {
      setRepaymentMode: {
        kind: "unauthorized",
        message: "missing partner scope",
        retryable: false,
        status_code: 401,
      },
    },
  });

  const setMode = await unauthorizedClient.setRepaymentMode({
    mint: DEFAULT_MINT,
    repayment_target: ATTN_TARGET,
    repayment_share_bps: 5000,
    activated_by: "attn_operator",
  });
  assert.equal(setMode.ok, false);
  if (setMode.ok) return;
  assert.equal(setMode.error.kind, "unauthorized");
  assert.equal(setMode.receipt.proof_state, "blocked_partner_access");
  assert.equal(setMode.receipt.mode_state, "pending_manual");
});

test("clawpump bridge builds a generic partner-managed descriptor and evidence pack", async () => {
  const client = createMockClawPumpClient();
  const payout = await client.getPayoutTopology(DEFAULT_MINT);
  const events = await client.listRevenueEvents(DEFAULT_MINT, { limit: 2 });
  const setMode = await client.setRepaymentMode({
    mint: DEFAULT_MINT,
    repayment_target: ATTN_TARGET,
    repayment_share_bps: 6000,
    activated_by: "attn_operator",
  });

  assert.equal(payout.ok, true);
  assert.equal(events.ok, true);
  assert.equal(setMode.ok, true);
  if (!payout.ok || !events.ok || !setMode.ok) return;

  const allVerifiedStates = Object.fromEntries(
    PARTNER_WALLET_POLICY_REQUIREMENT_IDS.map((requirementId) => [requirementId, "verified"]),
  ) as Record<(typeof PARTNER_WALLET_POLICY_REQUIREMENT_IDS)[number], "verified">;

  const policy = createPartnerManagedWalletPolicyTemplate({
    wallet_operator_model: "quorum_or_policy_engine",
    private_treasury_financing: "manual_operator_release",
    repayment_enforcement_class: "swig_equivalent_partner_control",
    stateByRequirementId: allVerifiedStates,
  });

  const descriptor = createClawPumpIntegrationDescriptor({
    payout_topology: payout.data,
    payout_topology_receipt: payout.receipt,
    revenue_events: events.data,
    revenue_events_receipt: events.receipt,
    repayment_mode: setMode.data,
    repayment_mode_receipt: setMode.receipt,
    operator_model: "quorum_or_policy_engine",
  });

  assert.equal(descriptor.partner_id, "clawpump");
  assert.equal(descriptor.chain, "solana");
  assert.equal(descriptor.readback_support.payout_topology, true);
  assert.equal(descriptor.readback_support.debt_open_routing, true);

  const pack = createClawPumpEvidencePack({
    policy,
    payout_topology: payout.data,
    payout_topology_receipt: payout.receipt,
    revenue_events: events.data,
    revenue_events_receipt: events.receipt,
    repayment_mode: setMode.data,
    repayment_mode_receipt: setMode.receipt,
    operator_model: "quorum_or_policy_engine",
    evidence_refs: ["clawpump://pilot/evidence"],
  });

  assert.equal(pack.assessment.stage, "stage_4_full_partner_managed_standard");
  assert.equal(pack.assessment.claim_level, "swig_equivalent_partner_control_compatible");
  assert.equal(pack.readbacks.payout_topology?.payout_mode, "claim_and_stream");
  assert.equal(pack.readbacks.debt_open_routing?.repayment_target, ATTN_TARGET);
  assert.deepEqual(
    pack.receipts.map((receipt) => receipt.receipt_type),
    [
      "partner_managed_payout_topology_receipt",
      "partner_managed_change_event_receipt",
      "partner_managed_revenue_events_receipt",
      "partner_managed_debt_open_routing_receipt",
    ],
  );
  assert.deepEqual(pack.evidence_refs, ["clawpump://pilot/evidence"]);
});

test("clawpump bridge maps release-mode receipts into the generic release/offboard surface", async () => {
  const client = createMockClawPumpClient();

  const clearMode = await client.clearRepaymentMode({
    mint: DEFAULT_MINT,
    cleared_by: "attn_operator",
    release_target: DEFAULT_WALLET,
  });

  assert.equal(clearMode.ok, true);
  if (!clearMode.ok) return;

  const policy = createPartnerManagedWalletPolicyTemplate({
    wallet_operator_model: "quorum_or_policy_engine",
    private_treasury_financing: "manual_operator_release",
    repayment_enforcement_class: "partner_policy_plus_attn_verifier",
    stateByRequirementId: {
      authoritative_launch_attribution: "verified",
      authoritative_revenue_scope_mapping: "verified",
      authoritative_wallet_topology: "verified",
      authoritative_fee_state: "verified",
      authoritative_revenue_event_feed: "verified",
      repayment_target_invariant: "verified",
      attn_readback_and_audit_receipts: "verified",
      payout_edit_authority_separation: "partial",
      debt_open_change_control: "partial",
      release_and_offboard_semantics: "verified",
      private_treasury_funding_receipts: "verified",
      incident_freeze_and_quarantine: "partial",
    },
  });

  const pack = createClawPumpEvidencePack({
    policy,
    repayment_mode: clearMode.data,
    repayment_mode_receipt: clearMode.receipt,
  });

  assert.equal(pack.readbacks.debt_open_routing?.route_state, "inactive");
  assert.deepEqual(
    pack.receipts.map((receipt) => receipt.receipt_type),
    ["partner_managed_release_offboard_receipt"],
  );
  assert.equal(pack.receipts[0]?.receipt_type, "partner_managed_release_offboard_receipt");
  if (pack.receipts[0]?.receipt_type === "partner_managed_release_offboard_receipt") {
    assert.equal(pack.receipts[0].release_target, DEFAULT_WALLET);
  }
});
