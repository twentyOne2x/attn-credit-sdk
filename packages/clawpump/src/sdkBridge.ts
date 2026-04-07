import {
  classifyPartnerManagedLane,
  createPartnerManagedChangeEventReceipt,
  createPartnerManagedDebtOpenRoutingReceipt,
  createPartnerManagedEvidencePack,
  createPartnerManagedIntegrationDescriptor,
  createPartnerManagedPayoutTopologyReceipt,
  createPartnerManagedReleaseOffboardReceipt,
  createPartnerManagedRevenueEventsReceipt,
  type PartnerManagedChangeAuthorityKind,
  type PartnerManagedChangeAuthorityReadback,
  type PartnerManagedDebtOpenRoutingReadback,
  type PartnerManagedEvidencePack,
  type PartnerManagedIntegrationDescriptor,
  type PartnerManagedIncidentStateReadback,
  type PartnerManagedPayoutTopologyReadback,
  type PartnerManagedReadbackSource,
  type PartnerManagedRevenueScopeModel,
  type PartnerManagedStageAssessment,
  type PartnerManagedWalletPolicySummary,
  type PartnerWalletOperatorModel,
  type ProofState,
} from "../../sdk/src";

import type {
  ClawPumpControlModel,
  ClawPumpCreatorFeeStateReceipt,
  ClawPumpModeState,
  ClawPumpPayoutTopology,
  ClawPumpPayoutTopologyReceipt,
  ClawPumpProofState,
  ClawPumpReleaseModeReceipt,
  ClawPumpRepaymentMode,
  ClawPumpRepaymentModeReceipt,
  ClawPumpRevenueEvent,
  ClawPumpRevenueEventsReceipt,
} from "./types";

type ClawPumpReceiptSourceKind =
  | "payout_topology"
  | "revenue_events"
  | "repayment_mode"
  | "release_mode"
  | "change_authority";

export type ClawPumpIntegrationDescriptorArgs = {
  payout_topology?: ClawPumpPayoutTopology;
  payout_topology_receipt?: ClawPumpPayoutTopologyReceipt;
  revenue_events?: ClawPumpRevenueEvent[];
  revenue_events_receipt?: ClawPumpRevenueEventsReceipt;
  repayment_mode?: ClawPumpRepaymentMode;
  repayment_mode_receipt?: ClawPumpRepaymentModeReceipt | ClawPumpReleaseModeReceipt;
  revenue_scope_model?: PartnerManagedRevenueScopeModel;
  operator_model?: PartnerWalletOperatorModel;
  partner_id?: string;
  display_name?: string;
  revenue_scope_notes?: string[];
  notes?: string[];
  incident_support?: Partial<PartnerManagedIntegrationDescriptor["incident_support"]>;
  release_support?: Partial<PartnerManagedIntegrationDescriptor["release_support"]>;
};

export type ClawPumpEvidencePackArgs = ClawPumpIntegrationDescriptorArgs & {
  policy: PartnerManagedWalletPolicySummary;
  creator_fee_state_receipt?: ClawPumpCreatorFeeStateReceipt;
  evidence_refs?: string[];
  assessment?: PartnerManagedStageAssessment;
  incident_state_readback?: PartnerManagedIncidentStateReadback;
};

function mapClawPumpProofState(proofState: ClawPumpProofState | undefined): ProofState | undefined {
  switch (proofState) {
    case undefined:
      return undefined;
    case "spec_only":
      return "spec_only";
    case "fixture_proven":
      return "code_shipped";
    case "backend_readonly_proven":
      return "contract_proven";
    case "repayment_mode_proven":
      return "proof_backed";
    case "blocked_partner_access":
    case "blocked_partner_capability":
      return "code_shipped";
  }
}

function inferCluster(args: ClawPumpIntegrationDescriptorArgs): PartnerManagedIntegrationDescriptor["cluster"] {
  return args.payout_topology?.mint ? "mainnet-beta" : "mainnet-beta";
}

function createClawPumpReadbackSource(args: {
  source_kind: ClawPumpReceiptSourceKind;
  source_timestamp?: string;
  receipt_id?: string;
  clawpump_proof_state?: ClawPumpProofState;
  notes?: string[];
}): PartnerManagedReadbackSource {
  return {
    source_id:
      args.receipt_id ??
      `clawpump:${args.source_kind}:${args.source_timestamp ?? "unknown_timestamp"}`,
    source_kind: "api",
    observed_at: args.source_timestamp ?? new Date(0).toISOString(),
    proof_state: mapClawPumpProofState(args.clawpump_proof_state),
    notes: args.notes ?? [],
  };
}

function inferOperatorModel(
  controlModel: ClawPumpControlModel | undefined,
  override?: PartnerWalletOperatorModel,
): PartnerWalletOperatorModel {
  if (override) return override;
  switch (controlModel) {
    case "delegatable":
      return "quorum_or_policy_engine";
    case "platform_owned":
    case "borrower_owned":
    case "unknown":
    case undefined:
      return "unknown";
  }
}

function inferChangeAuthorityKind(
  operatorModel: PartnerWalletOperatorModel,
): PartnerManagedChangeAuthorityKind {
  switch (operatorModel) {
    case "single_platform_signer":
      return "single_signer";
    case "quorum_or_policy_engine":
      return "policy_engine";
    case "unknown":
      return "unknown";
  }
}

function routeStateFromMode(modeState: ClawPumpModeState | undefined) {
  switch (modeState) {
    case "active":
      return "enforced" as const;
    case "cleared":
      return "inactive" as const;
    case "pending_manual":
      return "observable" as const;
    case "unsupported":
    case undefined:
      return "unknown" as const;
  }
}

export function createClawPumpPayoutTopologyReadback(args: {
  topology: ClawPumpPayoutTopology;
  receipt?: ClawPumpPayoutTopologyReceipt;
  operator_model?: PartnerWalletOperatorModel;
  notes?: string[];
}): PartnerManagedPayoutTopologyReadback {
  const operatorModel = inferOperatorModel(args.topology.control_model, args.operator_model);
  return {
    source: createClawPumpReadbackSource({
      source_kind: "payout_topology",
      source_timestamp: args.receipt?.source_timestamp ?? args.topology.source_timestamp,
      receipt_id: args.receipt?.receipt_id,
      clawpump_proof_state: args.receipt?.proof_state,
      notes: args.notes,
    }),
    payout_mode: args.topology.current_payout_mode,
    recipient_wallets: args.topology.current_payout_recipients.map((recipient) => recipient.wallet),
    payout_edit_authority: args.topology.payout_edit_authority,
    operator_model: operatorModel,
    drift_detection_supported: Boolean(args.receipt?.receipt_id),
    notes: args.notes ?? [],
  };
}

export function createClawPumpDebtOpenRoutingReadback(args: {
  mode: ClawPumpRepaymentMode;
  receipt?: ClawPumpRepaymentModeReceipt | ClawPumpReleaseModeReceipt;
  notes?: string[];
}): PartnerManagedDebtOpenRoutingReadback {
  return {
    source: createClawPumpReadbackSource({
      source_kind:
        args.receipt?.receipt_type === "clawpump_release_mode_receipt"
          ? "release_mode"
          : "repayment_mode",
      source_timestamp: args.receipt?.source_timestamp ?? args.mode.source_timestamp,
      receipt_id: args.receipt?.receipt_id,
      clawpump_proof_state: args.receipt?.proof_state,
      notes: args.notes,
    }),
    route_state: routeStateFromMode(args.mode.mode_state),
    repayment_target: args.mode.repayment_target ?? null,
    release_target: args.mode.release_target ?? null,
    repayment_share_bps: args.mode.repayment_share_bps ?? null,
    unilateral_change_possible: "unknown",
    notes: args.notes ?? [],
  };
}

export function createClawPumpChangeAuthorityReadback(args: {
  topology: ClawPumpPayoutTopology;
  receipt?: ClawPumpPayoutTopologyReceipt;
  operator_model?: PartnerWalletOperatorModel;
  notes?: string[];
}): PartnerManagedChangeAuthorityReadback {
  const operatorModel = inferOperatorModel(args.topology.control_model, args.operator_model);
  return {
    source: createClawPumpReadbackSource({
      source_kind: "change_authority",
      source_timestamp: args.receipt?.source_timestamp ?? args.topology.source_timestamp,
      receipt_id: args.receipt?.receipt_id,
      clawpump_proof_state: args.receipt?.proof_state,
      notes: args.notes,
    }),
    authority_kind: inferChangeAuthorityKind(operatorModel),
    authority_ref: args.topology.payout_edit_authority ?? null,
    change_receipts_supported: Boolean(args.receipt?.receipt_id),
    notes: args.notes ?? [],
  };
}

export function createClawPumpIntegrationDescriptor(
  args: ClawPumpIntegrationDescriptorArgs,
): PartnerManagedIntegrationDescriptor {
  const payoutReadback =
    args.payout_topology &&
    createClawPumpPayoutTopologyReadback({
      topology: args.payout_topology,
      receipt: args.payout_topology_receipt,
      operator_model: args.operator_model,
    });
  const routingReadback =
    args.repayment_mode &&
    createClawPumpDebtOpenRoutingReadback({
      mode: args.repayment_mode,
      receipt: args.repayment_mode_receipt,
    });

  return createPartnerManagedIntegrationDescriptor({
    partner_id: args.partner_id ?? "clawpump",
    display_name: args.display_name ?? "ClawPump",
    chain: "solana",
    cluster: inferCluster(args),
    revenue_scope_model: args.revenue_scope_model ?? "creator_and_service_fees",
    payout_topology_source:
      payoutReadback?.source ??
      createClawPumpReadbackSource({
        source_kind: "payout_topology",
      }),
    debt_open_routing_source:
      routingReadback?.source ??
      createClawPumpReadbackSource({
        source_kind: "repayment_mode",
      }),
    readback_support: {
      payout_topology: Boolean(args.payout_topology),
      revenue_events: Boolean(args.revenue_events?.length || args.revenue_events_receipt),
      debt_open_routing: Boolean(args.repayment_mode),
      change_authority: Boolean(args.payout_topology?.payout_edit_authority),
      incident_state: false,
      release_state: Boolean(
        args.repayment_mode_receipt?.receipt_type === "clawpump_release_mode_receipt" ||
          args.repayment_mode?.mode_state === "cleared",
      ),
    },
    incident_support: {
      freeze_supported: false,
      quarantine_supported: false,
      session_revocation_supported: false,
      ...(args.incident_support ?? {}),
    },
    release_support: {
      release_mode_supported: true,
      offboard_receipt_supported: Boolean(
        args.repayment_mode_receipt?.receipt_type === "clawpump_release_mode_receipt",
      ),
      ...(args.release_support ?? {}),
    },
    revenue_scope_notes:
      args.revenue_scope_notes ??
      [
        "ClawPump can feed the generic partner-managed SDK contract, but live payout and routing truths still have to come from the partner surfaces.",
      ],
    notes: args.notes ?? [],
  });
}

export function toPartnerManagedClawPumpPayoutReceipt(
  receipt: ClawPumpPayoutTopologyReceipt,
): ReturnType<typeof createPartnerManagedPayoutTopologyReceipt> {
  return createPartnerManagedPayoutTopologyReceipt({
    partner_id: "clawpump",
    chain: "solana",
    cluster: "mainnet-beta",
    source_timestamp: receipt.source_timestamp,
    receipt_id: receipt.receipt_id,
    proof_state: mapClawPumpProofState(receipt.proof_state),
    notes: receipt.notes,
    payout_mode: receipt.payout_mode ?? "unknown",
    recipient_wallets: receipt.recipient_wallets ?? [],
    payout_edit_authority: receipt.payout_edit_authority ?? null,
    operator_model: "unknown",
  });
}

export function toPartnerManagedClawPumpRevenueReceipt(
  receipt: ClawPumpRevenueEventsReceipt,
  events?: ClawPumpRevenueEvent[],
): ReturnType<typeof createPartnerManagedRevenueEventsReceipt> {
  return createPartnerManagedRevenueEventsReceipt({
    partner_id: "clawpump",
    chain: "solana",
    cluster: "mainnet-beta",
    source_timestamp: receipt.source_timestamp,
    receipt_id: receipt.receipt_id,
    proof_state: mapClawPumpProofState(receipt.proof_state),
    notes: receipt.notes,
    revenue_unit: "SOL",
    event_count: receipt.event_count,
    event_ids: events?.map((event) => event.event_id) ?? [],
  });
}

export function toPartnerManagedClawPumpRoutingReceipt(
  receipt: ClawPumpRepaymentModeReceipt,
): ReturnType<typeof createPartnerManagedDebtOpenRoutingReceipt> {
  return createPartnerManagedDebtOpenRoutingReceipt({
    partner_id: "clawpump",
    chain: "solana",
    cluster: "mainnet-beta",
    source_timestamp: receipt.source_timestamp,
    receipt_id: receipt.receipt_id,
    proof_state: mapClawPumpProofState(receipt.proof_state),
    notes: receipt.notes,
    route_state: routeStateFromMode(receipt.mode_state),
    repayment_target: receipt.repayment_target ?? null,
    release_target: null,
    repayment_share_bps: receipt.repayment_share_bps ?? null,
  });
}

export function toPartnerManagedClawPumpReleaseReceipt(
  receipt: ClawPumpReleaseModeReceipt,
): ReturnType<typeof createPartnerManagedReleaseOffboardReceipt> {
  return createPartnerManagedReleaseOffboardReceipt({
    partner_id: "clawpump",
    chain: "solana",
    cluster: "mainnet-beta",
    source_timestamp: receipt.source_timestamp,
    receipt_id: receipt.receipt_id,
    proof_state: mapClawPumpProofState(receipt.proof_state),
    notes: receipt.notes,
    release_target: receipt.release_target ?? null,
    offboard_supported: true,
  });
}

export function createClawPumpEvidencePack(
  args: ClawPumpEvidencePackArgs,
): PartnerManagedEvidencePack {
  const descriptor = createClawPumpIntegrationDescriptor(args);
  const assessment = args.assessment ?? classifyPartnerManagedLane({ policy: args.policy });
  const genericReceipts = [
    ...(args.payout_topology_receipt
      ? [
          toPartnerManagedClawPumpPayoutReceipt(args.payout_topology_receipt),
          createPartnerManagedChangeEventReceipt({
            partner_id: "clawpump",
            chain: "solana",
            cluster: "mainnet-beta",
            source_timestamp: args.payout_topology_receipt.source_timestamp,
            receipt_id: `${args.payout_topology_receipt.receipt_id}:change_authority`,
            proof_state: mapClawPumpProofState(args.payout_topology_receipt.proof_state),
            notes: args.payout_topology_receipt.notes,
            authority_kind: inferChangeAuthorityKind(
              inferOperatorModel(args.payout_topology?.control_model, args.operator_model),
            ),
            authority_ref: args.payout_topology_receipt.payout_edit_authority ?? null,
            change_kind: "current_authority_snapshot",
            changed_by: null,
          }),
        ]
      : []),
    ...(args.revenue_events_receipt
      ? [toPartnerManagedClawPumpRevenueReceipt(args.revenue_events_receipt, args.revenue_events)]
      : []),
    ...(args.repayment_mode_receipt?.receipt_type === "clawpump_repayment_mode_receipt"
      ? [toPartnerManagedClawPumpRoutingReceipt(args.repayment_mode_receipt)]
      : []),
    ...(args.repayment_mode_receipt?.receipt_type === "clawpump_release_mode_receipt"
      ? [toPartnerManagedClawPumpReleaseReceipt(args.repayment_mode_receipt)]
      : []),
  ];

  return createPartnerManagedEvidencePack({
    descriptor,
    policy: args.policy,
    assessment,
    readbacks: {
      ...(args.payout_topology
        ? {
            payout_topology: createClawPumpPayoutTopologyReadback({
              topology: args.payout_topology,
              receipt: args.payout_topology_receipt,
              operator_model: args.operator_model,
            }),
            change_authority: createClawPumpChangeAuthorityReadback({
              topology: args.payout_topology,
              receipt: args.payout_topology_receipt,
              operator_model: args.operator_model,
            }),
          }
        : {}),
      ...(args.repayment_mode
        ? {
            debt_open_routing: createClawPumpDebtOpenRoutingReadback({
              mode: args.repayment_mode,
              receipt: args.repayment_mode_receipt,
            }),
          }
        : {}),
      ...(args.incident_state_readback
        ? {
            incident_state: args.incident_state_readback,
          }
        : {}),
    },
    receipts: genericReceipts,
    evidence_refs: args.evidence_refs ?? [],
  });
}
