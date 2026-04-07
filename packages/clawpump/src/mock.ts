import {
  buildClawPumpRawReference,
  clusterProofState,
  createPartnerError,
  createTransportMeta,
} from "./receipts";
import { createClawPumpClient } from "./client";
import type {
  ClawPumpClient,
  ClawPumpClearRepaymentModeInput,
  ClawPumpCreatorFeeState,
  ClawPumpLaunch,
  ClawPumpPartnerError,
  ClawPumpPayoutTopology,
  ClawPumpRepaymentMode,
  ClawPumpRevenueEvent,
  ClawPumpRevenueEventsQuery,
  ClawPumpSetRepaymentModeInput,
  ClawPumpProofState,
  ClawPumpTransport,
  ClawPumpTransportFailure,
  ClawPumpTransportResult,
  ClawPumpTransportSuccess,
} from "./types";

export type ClawPumpMockOperation =
  | "getLaunch"
  | "listLaunchesByWallet"
  | "getPayoutTopology"
  | "getCreatorFeeState"
  | "listRevenueEvents"
  | "getRepaymentMode"
  | "setRepaymentMode"
  | "clearRepaymentMode";

export type ClawPumpMockFailure =
  | ClawPumpPartnerError
  | {
      kind: ClawPumpPartnerError["kind"];
      message?: string;
      retryable?: boolean;
      status_code?: number;
      code?: string;
    };

export type ClawPumpMockFixtures = {
  launches: Record<string, ClawPumpLaunch>;
  wallet_launches: Record<string, string[]>;
  payout_topologies: Record<string, ClawPumpPayoutTopology>;
  creator_fee_states: Record<string, ClawPumpCreatorFeeState>;
  revenue_events: Record<string, ClawPumpRevenueEvent[]>;
  repayment_modes: Record<string, ClawPumpRepaymentMode>;
};

export type ClawPumpMockOptions = {
  fixtures?: Partial<ClawPumpMockFixtures>;
  failures?: Partial<Record<ClawPumpMockOperation, ClawPumpMockFailure>>;
  request_prefix?: string;
};

const DEFAULT_MINT = "clawmint11111111111111111111111111111111";
const DEFAULT_WALLET = "agentwallet111111111111111111111111111111";
const DEFAULT_DEV_WALLET = "devwallet11111111111111111111111111111111";
const DEFAULT_TREASURY = "clawtreasury1111111111111111111111111111";
const DEFAULT_ATTN_TARGET = "attnrepay111111111111111111111111111111";

export function createDefaultClawPumpFixtures(now = "2026-03-18T12:00:00.000Z"): ClawPumpMockFixtures {
  const launch: ClawPumpLaunch = {
    mint: DEFAULT_MINT,
    launch_id: "claw_launch_001",
    launcher_platform: "clawpump",
    creator_wallet: DEFAULT_WALLET,
    launch_authority: DEFAULT_DEV_WALLET,
    created_at: "2026-03-18T10:00:00.000Z",
    cluster: "mainnet-beta",
    agent_id: "agent_001",
  };
  const payoutTopology: ClawPumpPayoutTopology = {
    mint: DEFAULT_MINT,
    dev_wallet: DEFAULT_DEV_WALLET,
    gas_sponsor_wallet: "gassponsor11111111111111111111111111111",
    agent_rewards_wallet: DEFAULT_WALLET,
    platform_treasury_wallet: DEFAULT_TREASURY,
    current_payout_mode: "claim_and_stream",
    current_payout_recipients: [
      { wallet: DEFAULT_WALLET, label: "agent_rewards", share_bps: 8500 },
      { wallet: DEFAULT_TREASURY, label: "platform_treasury", share_bps: 1500 },
    ],
    payout_edit_authority: "claw_backend",
    platform_controls_dev_wallet: true,
    control_model: "platform_owned",
    source_timestamp: now,
  };
  const feeState: ClawPumpCreatorFeeState = {
    mint: DEFAULT_MINT,
    current_creator_fee_recipient: DEFAULT_WALLET,
    accrued_creator_fees_sol: 18.4,
    claimed_creator_fees_sol: 12.9,
    claimable_creator_fees_sol: 5.5,
    last_claim_at: "2026-03-18T11:30:00.000Z",
    last_claim_signature: "lastclaimsig111111111111111111111111111111",
    source_timestamp: now,
  };
  const events: ClawPumpRevenueEvent[] = [
    {
      event_id: "evt_003",
      mint: DEFAULT_MINT,
      event_type: "creator_fee_distributed",
      amount_sol: 1.25,
      recipient: DEFAULT_WALLET,
      signature: "distsig3333333333333333333333333333333333",
      slot: 321003,
      block_time: "2026-03-18T11:31:00.000Z",
    },
    {
      event_id: "evt_002",
      mint: DEFAULT_MINT,
      event_type: "creator_fee_claimed",
      amount_sol: 2.1,
      recipient: DEFAULT_DEV_WALLET,
      signature: "claimsig22222222222222222222222222222222",
      slot: 321002,
      block_time: "2026-03-18T11:30:00.000Z",
    },
    {
      event_id: "evt_001",
      mint: DEFAULT_MINT,
      event_type: "creator_fee_accrued",
      amount_sol: 5.5,
      recipient: DEFAULT_DEV_WALLET,
      signature: "accruesig1111111111111111111111111111111",
      slot: 321001,
      block_time: "2026-03-18T11:00:00.000Z",
    },
  ];
  const repaymentMode: ClawPumpRepaymentMode = {
    mint: DEFAULT_MINT,
    mode_state: "cleared",
    release_target: DEFAULT_WALLET,
    cleared_by: "attn_operator",
    cleared_at: "2026-03-18T09:00:00.000Z",
    source_timestamp: now,
  };

  return {
    launches: { [DEFAULT_MINT]: launch },
    wallet_launches: { [DEFAULT_WALLET]: [DEFAULT_MINT] },
    payout_topologies: { [DEFAULT_MINT]: payoutTopology },
    creator_fee_states: { [DEFAULT_MINT]: feeState },
    revenue_events: { [DEFAULT_MINT]: events },
    repayment_modes: { [DEFAULT_MINT]: repaymentMode },
  };
}

function normalizeWallet(value: string): string {
  return value.trim().toLowerCase();
}

function resolveFailure(value: ClawPumpMockFailure | undefined): ClawPumpPartnerError | null {
  if (!value) return null;
  return createPartnerError({
    kind: value.kind,
    message: value.message ?? `mocked ${value.kind} failure`,
    retryable: value.retryable,
    status_code: value.status_code,
    code: value.code,
  });
}

function success<T>(
  data: T,
  args: {
    requestId: string;
    sourceTimestamp?: string;
    signature?: string;
    eventIds?: string[];
    note?: string;
    proof_state?: ClawPumpProofState;
  },
): ClawPumpTransportSuccess<T> {
  return {
    ok: true,
    data,
    meta: createTransportMeta({
      partner_request_id: args.requestId,
      source_timestamp: args.sourceTimestamp,
      raw_reference: buildClawPumpRawReference({
        request_id: args.requestId,
        signature: args.signature,
        event_ids: args.eventIds,
      }),
      proof_state: args.proof_state,
      notes: args.note ? [args.note] : [],
    }),
  };
}

function failure(error: ClawPumpPartnerError, requestId: string): ClawPumpTransportFailure {
  return {
    ok: false,
    error,
    meta: createTransportMeta({
      partner_request_id: requestId,
      raw_reference: buildClawPumpRawReference({ request_id: requestId, upstream_status: error.status_code }),
      notes: [`mocked_failure:${error.kind}`],
    }),
  };
}

export function createMockClawPumpTransport(options: ClawPumpMockOptions = {}): ClawPumpTransport {
  const defaults = createDefaultClawPumpFixtures();
  const fixtures: ClawPumpMockFixtures = {
    launches: { ...defaults.launches, ...(options.fixtures?.launches ?? {}) },
    wallet_launches: { ...defaults.wallet_launches, ...(options.fixtures?.wallet_launches ?? {}) },
    payout_topologies: { ...defaults.payout_topologies, ...(options.fixtures?.payout_topologies ?? {}) },
    creator_fee_states: { ...defaults.creator_fee_states, ...(options.fixtures?.creator_fee_states ?? {}) },
    revenue_events: { ...defaults.revenue_events, ...(options.fixtures?.revenue_events ?? {}) },
    repayment_modes: { ...defaults.repayment_modes, ...(options.fixtures?.repayment_modes ?? {}) },
  };
  const failures = options.failures ?? {};
  const prefix = options.request_prefix ?? "mock_clawpump";
  let counter = 0;

  const nextRequestId = (operation: ClawPumpMockOperation) => `${prefix}:${operation}:${String(++counter).padStart(4, "0")}`;

  return {
    async getLaunch(mint) {
      const requestId = nextRequestId("getLaunch");
      const mocked = resolveFailure(failures.getLaunch);
      if (mocked) return failure(mocked, requestId);
      const launch = fixtures.launches[mint];
      if (!launch) {
        return failure(createPartnerError({ kind: "not_found", message: `launch not found for mint ${mint}`, retryable: false }), requestId);
      }
      return success(launch, {
        requestId,
        sourceTimestamp: launch.created_at,
        proof_state: clusterProofState(launch.cluster),
      });
    },

    async listLaunchesByWallet(wallet) {
      const requestId = nextRequestId("listLaunchesByWallet");
      const mocked = resolveFailure(failures.listLaunchesByWallet);
      if (mocked) return failure(mocked, requestId);
      const mintIds = fixtures.wallet_launches[wallet] ?? fixtures.wallet_launches[normalizeWallet(wallet)] ?? [];
      const launches = mintIds.map((mint) => fixtures.launches[mint]).filter((entry): entry is ClawPumpLaunch => Boolean(entry));
      return success(launches, {
        requestId,
        sourceTimestamp: launches[0]?.created_at,
        proof_state: launches.length > 0 ? clusterProofState(launches[0].cluster) : "fixture_proven",
      });
    },

    async getPayoutTopology(mint) {
      const requestId = nextRequestId("getPayoutTopology");
      const mocked = resolveFailure(failures.getPayoutTopology);
      if (mocked) return failure(mocked, requestId);
      const topology = fixtures.payout_topologies[mint];
      if (!topology) {
        return failure(createPartnerError({ kind: "not_found", message: `payout topology not found for mint ${mint}`, retryable: false }), requestId);
      }
      return success(topology, {
        requestId,
        sourceTimestamp: topology.source_timestamp,
        proof_state: "fixture_proven",
      });
    },

    async getCreatorFeeState(mint) {
      const requestId = nextRequestId("getCreatorFeeState");
      const mocked = resolveFailure(failures.getCreatorFeeState);
      if (mocked) return failure(mocked, requestId);
      const feeState = fixtures.creator_fee_states[mint];
      if (!feeState) {
        return failure(createPartnerError({ kind: "not_found", message: `creator fee state not found for mint ${mint}`, retryable: false }), requestId);
      }
      return success(feeState, {
        requestId,
        sourceTimestamp: feeState.source_timestamp,
        signature: feeState.last_claim_signature,
        proof_state: "fixture_proven",
      });
    },

    async listRevenueEvents(mint, query?: ClawPumpRevenueEventsQuery) {
      const requestId = nextRequestId("listRevenueEvents");
      const mocked = resolveFailure(failures.listRevenueEvents);
      if (mocked) return failure(mocked, requestId);
      let events = [...(fixtures.revenue_events[mint] ?? [])];
      if (query?.since) {
        events = events.filter((event) => event.block_time >= query.since!);
      }
      if (query?.limit && query.limit > 0) {
        events = events.slice(0, query.limit);
      }
      return success(events, {
        requestId,
        sourceTimestamp: events[0]?.block_time,
        eventIds: events.map((event) => event.event_id),
        proof_state: "fixture_proven",
      });
    },

    async getRepaymentMode(mint) {
      const requestId = nextRequestId("getRepaymentMode");
      const mocked = resolveFailure(failures.getRepaymentMode);
      if (mocked) return failure(mocked, requestId);
      const mode = fixtures.repayment_modes[mint];
      if (!mode) {
        return failure(createPartnerError({ kind: "not_found", message: `repayment mode not found for mint ${mint}`, retryable: false }), requestId);
      }
      return success(mode, {
        requestId,
        sourceTimestamp: mode.source_timestamp,
        proof_state: mode.mode_state === "active" ? "repayment_mode_proven" : "fixture_proven",
      });
    },

    async setRepaymentMode(input: ClawPumpSetRepaymentModeInput) {
      const requestId = nextRequestId("setRepaymentMode");
      const mocked = resolveFailure(failures.setRepaymentMode);
      if (mocked) return failure(mocked, requestId);
      const updated: ClawPumpRepaymentMode = {
        mint: input.mint,
        mode_state: "active",
        repayment_target: input.repayment_target,
        repayment_share_bps: input.repayment_share_bps,
        activated_at: "2026-03-18T12:30:00.000Z",
        activated_by: input.activated_by,
        source_timestamp: "2026-03-18T12:30:00.000Z",
      };
      fixtures.repayment_modes[input.mint] = updated;
      return success(updated, {
        requestId,
        sourceTimestamp: updated.source_timestamp,
        proof_state: "repayment_mode_proven",
        note: input.note,
      });
    },

    async clearRepaymentMode(input: ClawPumpClearRepaymentModeInput) {
      const requestId = nextRequestId("clearRepaymentMode");
      const mocked = resolveFailure(failures.clearRepaymentMode);
      if (mocked) return failure(mocked, requestId);
      const existing = fixtures.repayment_modes[input.mint];
      const updated: ClawPumpRepaymentMode = {
        mint: input.mint,
        mode_state: "cleared",
        repayment_target: existing?.repayment_target,
        repayment_share_bps: existing?.repayment_share_bps,
        activated_by: existing?.activated_by,
        activated_at: existing?.activated_at,
        cleared_at: "2026-03-18T12:45:00.000Z",
        cleared_by: input.cleared_by,
        release_target: input.release_target,
        source_timestamp: "2026-03-18T12:45:00.000Z",
      };
      fixtures.repayment_modes[input.mint] = updated;
      return success(updated, {
        requestId,
        sourceTimestamp: updated.source_timestamp,
        proof_state: "repayment_mode_proven",
        note: input.note,
      });
    },
  };
}

export function createMockClawPumpClient(options?: ClawPumpMockOptions): ClawPumpClient {
  return createClawPumpClient(createMockClawPumpTransport(options));
}
