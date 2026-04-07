import type {
  ClawPumpBaseReceipt,
  ClawPumpCluster,
  ClawPumpCreatorFeeState,
  ClawPumpCreatorFeeStateReceipt,
  ClawPumpLaunch,
  ClawPumpLaunchReceipt,
  ClawPumpModeState,
  ClawPumpPartnerError,
  ClawPumpPayoutTopology,
  ClawPumpPayoutTopologyReceipt,
  ClawPumpProofState,
  ClawPumpRawReference,
  ClawPumpReleaseModeReceipt,
  ClawPumpRepaymentMode,
  ClawPumpRepaymentModeReceipt,
  ClawPumpRevenueEvent,
  ClawPumpRevenueEventsReceipt,
  ClawPumpReceiptType,
  ClawPumpTransportMeta,
} from "./types";

type ReceiptContext<TReceiptType extends ClawPumpReceiptType = ClawPumpReceiptType> = {
  mint?: string;
  wallet_query?: string;
  received_at: string;
  meta?: ClawPumpTransportMeta;
  error?: ClawPumpPartnerError;
  receipt_type: TReceiptType;
  source_timestamp?: string;
};

function normalizeSegment(value: string | undefined): string {
  const normalized = (value ?? "unknown").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return normalized.length > 0 ? normalized : "unknown";
}

function inferProofState(meta: ClawPumpTransportMeta | undefined, error: ClawPumpPartnerError | undefined): ClawPumpProofState {
  if (meta?.proof_state) return meta.proof_state;
  if (!error) return "spec_only";
  switch (error.kind) {
    case "unsupported":
      return "blocked_partner_capability";
    case "unavailable":
    case "unauthorized":
    case "not_found":
    case "invalid_response":
      return "blocked_partner_access";
  }
}

function inferSourceTimestamp(meta: ClawPumpTransportMeta | undefined, fallback?: string): string {
  return meta?.source_timestamp ?? fallback ?? new Date(0).toISOString();
}

function createBaseReceipt<TReceiptType extends ClawPumpReceiptType>(
  args: ReceiptContext<TReceiptType>,
): ClawPumpBaseReceipt & { receipt_type: TReceiptType } {
  const proofState = inferProofState(args.meta, args.error);
  const sourceTimestamp = inferSourceTimestamp(args.meta, args.source_timestamp);
  const notes = [...(args.meta?.notes ?? [])];
  if (args.error) {
    notes.push(`partner_error:${args.error.kind}`);
  }

  return {
    receipt_id: [
      "attn",
      "clawpump",
      normalizeSegment(args.receipt_type),
      normalizeSegment(args.mint ?? args.wallet_query),
      normalizeSegment(args.meta?.partner_request_id),
      normalizeSegment(sourceTimestamp),
    ].join(":"),
    receipt_type: args.receipt_type,
    partner: "clawpump",
    mint: args.mint,
    wallet_query: args.wallet_query,
    partner_request_id: args.meta?.partner_request_id,
    source_timestamp: sourceTimestamp,
    received_at: args.received_at,
    proof_state: proofState,
    notes,
    raw_reference: args.meta?.raw_reference,
  };
}

export function createLaunchReceipt(args: Omit<ReceiptContext<"clawpump_launch_receipt">, "receipt_type" | "source_timestamp"> & { launch?: ClawPumpLaunch; launches?: ClawPumpLaunch[] }): ClawPumpLaunchReceipt {
  const launch = args.launch ?? args.launches?.[0];
  const base = createBaseReceipt({
    ...args,
    receipt_type: "clawpump_launch_receipt",
    source_timestamp: launch?.created_at,
  });
  return {
    ...base,
    launch_id: launch?.launch_id,
    cluster: launch?.cluster,
    creator_wallet: launch?.creator_wallet,
    launch_authority: launch?.launch_authority,
    launch_count: args.launches?.length,
  };
}

export function createPayoutTopologyReceipt(args: Omit<ReceiptContext<"clawpump_payout_topology_receipt">, "receipt_type" | "source_timestamp"> & { topology?: ClawPumpPayoutTopology }): ClawPumpPayoutTopologyReceipt {
  const topology = args.topology;
  const base = createBaseReceipt({
    ...args,
    receipt_type: "clawpump_payout_topology_receipt",
    source_timestamp: topology?.source_timestamp,
  });
  return {
    ...base,
    dev_wallet: topology?.dev_wallet,
    payout_mode: topology?.current_payout_mode,
    payout_edit_authority: topology?.payout_edit_authority,
    recipient_wallets: topology?.current_payout_recipients.map((recipient) => recipient.wallet),
  };
}

export function createCreatorFeeStateReceipt(args: Omit<ReceiptContext<"clawpump_creator_fee_state_receipt">, "receipt_type" | "source_timestamp"> & { fee_state?: ClawPumpCreatorFeeState }): ClawPumpCreatorFeeStateReceipt {
  const feeState = args.fee_state;
  const base = createBaseReceipt({
    ...args,
    receipt_type: "clawpump_creator_fee_state_receipt",
    source_timestamp: feeState?.source_timestamp,
  });
  return {
    ...base,
    current_creator_fee_recipient: feeState?.current_creator_fee_recipient,
    claimable_creator_fees_sol: feeState?.claimable_creator_fees_sol,
    claimed_creator_fees_sol: feeState?.claimed_creator_fees_sol,
  };
}

export function createRevenueEventsReceipt(args: Omit<ReceiptContext<"clawpump_revenue_events_receipt">, "receipt_type" | "source_timestamp"> & { events?: ClawPumpRevenueEvent[] }): ClawPumpRevenueEventsReceipt {
  const events = args.events ?? [];
  const latestEvent = events[0];
  const base = createBaseReceipt({
    ...args,
    receipt_type: "clawpump_revenue_events_receipt",
    source_timestamp: latestEvent?.block_time,
  });
  return {
    ...base,
    event_count: events.length,
    latest_event_id: latestEvent?.event_id,
  };
}

export function createRepaymentModeReceipt(args: Omit<ReceiptContext<"clawpump_repayment_mode_receipt">, "receipt_type" | "source_timestamp"> & { mode?: ClawPumpRepaymentMode }): ClawPumpRepaymentModeReceipt {
  const mode = args.mode;
  const base = createBaseReceipt({
    ...args,
    receipt_type: "clawpump_repayment_mode_receipt",
    source_timestamp: mode?.source_timestamp,
  });
  return {
    ...base,
    repayment_target: mode?.repayment_target,
    repayment_share_bps: mode?.repayment_share_bps,
    activated_by: mode?.activated_by,
    mode_state: mode?.mode_state ?? inferFallbackModeState(args.error),
  };
}

export function createReleaseModeReceipt(args: Omit<ReceiptContext<"clawpump_release_mode_receipt">, "receipt_type" | "source_timestamp"> & { mode?: ClawPumpRepaymentMode }): ClawPumpReleaseModeReceipt {
  const mode = args.mode;
  const base = createBaseReceipt({
    ...args,
    receipt_type: "clawpump_release_mode_receipt",
    source_timestamp: mode?.source_timestamp,
  });
  return {
    ...base,
    release_target: mode?.release_target,
    cleared_by: mode?.cleared_by,
    mode_state: mode?.mode_state ?? inferFallbackModeState(args.error),
  };
}

function inferFallbackModeState(error?: ClawPumpPartnerError): ClawPumpModeState {
  if (!error) return "pending_manual";
  return error.kind === "unsupported" ? "unsupported" : "pending_manual";
}

export function createPartnerError(args: {
  kind: ClawPumpPartnerError["kind"];
  message: string;
  retryable?: boolean;
  status_code?: number;
  code?: string;
  details?: Record<string, unknown>;
}): ClawPumpPartnerError {
  return {
    kind: args.kind,
    message: args.message,
    retryable: args.retryable ?? (args.kind === "unavailable"),
    status_code: args.status_code,
    code: args.code,
    details: args.details,
  };
}

export function createTransportMeta(args: {
  partner_request_id?: string;
  source_timestamp?: string;
  raw_reference?: ClawPumpRawReference;
  proof_state?: ClawPumpProofState;
  notes?: string[];
} = {}): ClawPumpTransportMeta {
  return {
    partner_request_id: args.partner_request_id,
    source_timestamp: args.source_timestamp,
    raw_reference: args.raw_reference,
    proof_state: args.proof_state,
    notes: args.notes ?? [],
  };
}

export function buildClawPumpRawReference(args: {
  request_id?: string;
  response_id?: string;
  signature?: string;
  event_ids?: string[];
  upstream_status?: number;
} = {}): ClawPumpRawReference | undefined {
  if (!args.request_id && !args.response_id && !args.signature && !args.event_ids?.length && args.upstream_status === undefined) {
    return undefined;
  }
  return {
    request_id: args.request_id,
    response_id: args.response_id,
    signature: args.signature,
    event_ids: args.event_ids,
    upstream_status: args.upstream_status,
  };
}

export function clusterProofState(cluster: ClawPumpCluster): ClawPumpProofState {
  return cluster === "mainnet-beta" ? "backend_readonly_proven" : "fixture_proven";
}
