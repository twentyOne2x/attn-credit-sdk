import type {
  AttnChain,
  ControlProfileId,
  CreatorIngressMode,
  PartnerActionContextRequest,
  PartnerActionName,
  PartnerActionRequest,
  PartnerActionResponse,
  PartnerApiResponse,
  PartnerBaseRequest,
  PartnerCatalogRequest,
  PartnerCatalogCurrentTruth,
  PartnerCatalogResponse,
  PartnerCapabilitiesRequest,
  PartnerCapabilitiesResponse,
  PartnerStageStatusRequest,
  PartnerStageStatusResponse,
  SupportedCluster,
} from "./schema";
import {
  creatorIngressModeFromTransport,
  creatorIngressModeToTransport,
  inferChainFromPresetId,
  partnerManagedClaimLevelFromTransport,
  partnerManagedRepaymentEnforcementClassFromTransport,
  presetIdFromTransport,
  presetIdToTransport,
  withPartnerDefaults,
} from "./schema";
import {
  buildAttnEip8183HookEnvelope,
  createAttnEip8183Metadata,
  createAttnEip8183SettlementReceipt,
  decodeAttnEip8183Metadata,
  encodeAttnEip8183Metadata,
} from "./eip8183";

export * from "./schema";
export * from "./eip8183";
export * from "./settlement";

export type AttnClientOptions = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  chain?: AttnChain;
};

export const attnEip8183Helpers = {
  createMetadata: createAttnEip8183Metadata,
  encodeMetadata: encodeAttnEip8183Metadata,
  decodeMetadata: decodeAttnEip8183Metadata,
  buildHookEnvelope: buildAttnEip8183HookEnvelope,
  createSettlementReceipt: createAttnEip8183SettlementReceipt,
};

export type AttnEip8183Helpers = typeof attnEip8183Helpers;

export const ATTN_AGENT_BORROWER_ACTION_ORDER = [
  "check_credit",
  "get_attn_alignment_offer",
  "accept_attn_alignment_offer",
  "start_onboarding",
  "get_stage_status",
  "execute_handoff",
  "open_credit_line",
  "repay",
  "offboard",
] as const;

export type AttnAgentBorrowerAction = (typeof ATTN_AGENT_BORROWER_ACTION_ORDER)[number];
export type AttnAgentDecisionStatus = "ready" | "await_human_signature" | "blocked" | "escalate";
export type AttnAgentCatalogSpeedPosture = "measured" | "partial" | "unproven";
export type AttnAgentCatalogHostedStatePosture =
  | "shared_kv_fail_closed"
  | "filesystem_active"
  | "unknown";
export type AttnAgentCatalogRecommendation =
  | "proceed_read_only"
  | "proceed_with_caution"
  | "escalate_or_block";

export type AttnAgentDecision = {
  status: AttnAgentDecisionStatus;
  must_stop: boolean;
  requires_human_signature: boolean;
  should_escalate: boolean;
  attempt_count: number;
  max_attempts: number;
  blockers: string[];
  next_actions: string[];
  agent_lane_state?: string;
  proof_state?: string;
  public_claim_state?: string;
};

export type AttnAgentActionOutcome = {
  action: PartnerActionName;
  response: PartnerActionResponse;
  decision: AttnAgentDecision;
};

export type AttnAgentCapabilitiesOutcome = {
  response: PartnerCapabilitiesResponse;
  ready_actions: PartnerActionName[];
  blocked_actions: PartnerActionName[];
  preview_actions: PartnerActionName[];
  context_required_actions: PartnerActionName[];
};

export type AttnAgentCatalogOutcome = {
  response: PartnerCatalogResponse;
  live_claim_scope: PartnerCatalogCurrentTruth["live_claim_scope"];
  real_credit_blockers: string[];
  closure_hosted_state: PartnerCatalogCurrentTruth["closure_hosted_state"] | null;
  first_private_lane_semantics:
    PartnerCatalogCurrentTruth["first_private_lane_semantics"] | null;
  pilot_path_truth: PartnerCatalogCurrentTruth["pilot_path_truth"] | null;
  private_parity_receipt:
    PartnerCatalogCurrentTruth["private_parity_receipt"] | null;
  hosted_state_posture: AttnAgentCatalogHostedStatePosture;
  dashboard_speed: NonNullable<PartnerCatalogCurrentTruth["dashboard_speed"]> | null;
  speed_posture: AttnAgentCatalogSpeedPosture;
  speed_blockers: string[];
};

export type AttnAgentCatalogRecommendationOutcome = AttnAgentCatalogOutcome & {
  recommendation: AttnAgentCatalogRecommendation;
  recommendation_reasons: string[];
};

export type AttnAgentDefaults = {
  preset_id: string;
  cluster?: SupportedCluster;
  creator_ingress_mode?: CreatorIngressMode;
  control_profile_id?: ControlProfileId;
};

export type AttnAgentLoanToolsOptions = {
  client: ReturnType<typeof createAttnClient>;
  chain: AttnChain;
  defaults: AttnAgentDefaults;
  maxAttemptsPerAction?: number;
};

export const ATTN_PUMP_AGENT_BORROWER_DEFAULTS = {
  cluster: "mainnet-beta" as SupportedCluster,
  preset_id: "solana_borrower_attn_hosted",
  creator_ingress_mode: "managed_destination" as CreatorIngressMode,
  control_profile_id: "attn_default" as ControlProfileId,
};

export type AttnPumpAgentBorrowerToolsOptions = {
  client: ReturnType<typeof createAttnClient>;
  cluster?: SupportedCluster;
  control_profile_id?: ControlProfileId;
  maxAttemptsPerAction?: number;
};

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (typeof value === "boolean") {
      search.set(key, value ? "1" : "0");
      continue;
    }
    if (typeof value === "string" || typeof value === "number") {
      search.set(key, String(value));
    }
  }
  const serialized = search.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

function normalizeTransportScalar(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;

  if (key === "creator_ingress_mode") {
    return creatorIngressModeFromTransport(value) ?? value;
  }
  if (key === "preset_id") {
    return presetIdFromTransport(value);
  }
  if (key === "repayment_enforcement_class") {
    return partnerManagedRepaymentEnforcementClassFromTransport(value) ?? value;
  }
  if (key === "claim_level") {
    return partnerManagedClaimLevelFromTransport(value) ?? value;
  }
  return value;
}

function normalizeTransportPayload<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeTransportPayload(entry)) as T;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) {
      normalized[key] = normalizeTransportScalar(
        key,
        normalizeTransportPayload(entry),
      );
    }
    return normalized as T;
  }
  return value;
}

function serializeTransportScalar(key: string, value: unknown): unknown {
  if (key === "preset_id" && typeof value === "string") {
    return presetIdToTransport(value);
  }
  if (key === "creator_ingress_mode" && typeof value === "string") {
    return creatorIngressModeToTransport(value);
  }
  return value;
}

function serializeTransportPayload<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => serializeTransportPayload(entry)) as T;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const serialized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) {
      serialized[key] = serializeTransportScalar(
        key,
        serializeTransportPayload(entry),
      );
    }
    return serialized as T;
  }
  return value;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

function executionModeFromResponse(response: PartnerActionResponse): string | null {
  const result = response.result;
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }
  const executionMode = (result as Record<string, unknown>).execution_mode;
  return typeof executionMode === "string" ? executionMode : null;
}

function verificationStateFromResponse(response: PartnerActionResponse): string | null {
  const result = response.result;
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }
  const verificationState = (result as Record<string, unknown>).verification_state;
  return typeof verificationState === "string" ? verificationState : null;
}

function replayedFromResponse(response: PartnerActionResponse): boolean {
  const result = response.result;
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return false;
  }
  return (result as Record<string, unknown>).replayed === true;
}

function classifyCatalogSpeedPosture(
  dashboardSpeed: PartnerCatalogCurrentTruth["dashboard_speed"] | null | undefined,
): AttnAgentCatalogSpeedPosture {
  if (!dashboardSpeed) return "unproven";
  if (
    dashboardSpeed.borrower_measured_receipt_count > 0 &&
    dashboardSpeed.lender_measured_receipt_count > 0
  ) {
    return "measured";
  }
  if (
    dashboardSpeed.borrower_measured_receipt_count > 0 ||
    dashboardSpeed.lender_measured_receipt_count > 0
  ) {
    return "partial";
  }
  return "unproven";
}

function classifyCatalogHostedStatePosture(
  closureHostedState: PartnerCatalogCurrentTruth["closure_hosted_state"] | null | undefined,
): AttnAgentCatalogHostedStatePosture {
  if (!closureHostedState) return "unknown";
  if (
    closureHostedState.durable_state_backend === "shared_system_kv" &&
    closureHostedState.runtime_fallback_state === "fail_closed"
  ) {
    return "shared_kv_fail_closed";
  }
  if (
    closureHostedState.durable_state_backend === "filesystem_json" &&
    closureHostedState.runtime_fallback_state === "filesystem_active"
  ) {
    return "filesystem_active";
  }
  return "unknown";
}

function mergeDefaults<T extends DefaultableInput | Partial<DefaultableInput>>(
  defaults: AttnAgentDefaults,
  input: T,
): T & DefaultableInput {
  return {
    ...input,
    cluster: input.cluster ?? defaults.cluster,
    preset_id: input.preset_id ?? defaults.preset_id,
    creator_ingress_mode: input.creator_ingress_mode ?? defaults.creator_ingress_mode,
    control_profile_id: input.control_profile_id ?? defaults.control_profile_id,
  } as T & DefaultableInput;
}

export function createAttnClient(options: AttnClientOptions) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("fetch implementation is required");
  }

  async function post<TResponse extends PartnerApiResponse>(pathname: string, body: unknown): Promise<TResponse> {
    const response = await fetchImpl(`${baseUrl}${pathname}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(options.headers ?? {}),
      },
      body: JSON.stringify(serializeTransportPayload(body)),
    });
    return normalizeTransportPayload((await parseJson(response)) as TResponse);
  }

  async function get<TResponse extends Record<string, unknown>>(pathname: string, params?: Record<string, unknown>): Promise<TResponse> {
    const response = await fetchImpl(
      `${baseUrl}${pathname}${buildQuery(serializeTransportPayload(params ?? {}))}`,
      {
      method: "GET",
      headers: {
        ...(options.headers ?? {}),
      },
    },
    );
    return normalizeTransportPayload((await parseJson(response)) as TResponse);
  }

  function createBaseAdapter(defaultChain?: AttnChain) {
    function withCatalogDefaults(input?: PartnerCatalogRequest) {
      const chain =
        input?.chain ??
        (typeof input?.preset_id === "string" ? inferChainFromPresetId(input.preset_id) : null) ??
        defaultChain;
      return {
        ...input,
        chain,
      };
    }

    function withAdapterDefaults<T extends PartnerCapabilitiesRequest | PartnerStageStatusRequest | PartnerActionRequest | PartnerActionContextRequest>(input: T) {
      return withPartnerDefaults({
        ...input,
        chain: input.chain ?? defaultChain,
      });
    }

    async function action<TResponse extends PartnerActionResponse>(input: PartnerActionRequest): Promise<TResponse> {
      return post<TResponse>("/api/partner/credit/action", withAdapterDefaults(input));
    }

    return {
      capabilities(input: PartnerCapabilitiesRequest): Promise<PartnerCapabilitiesResponse> {
        return post<PartnerCapabilitiesResponse>("/api/partner/credit/capabilities", withAdapterDefaults(input));
      },
      catalog(input?: PartnerCatalogRequest): Promise<PartnerCatalogResponse> {
        return get<PartnerCatalogResponse>("/api/partner/credit/catalog", withCatalogDefaults(input));
      },
      stageStatus(input: PartnerStageStatusRequest): Promise<PartnerStageStatusResponse> {
        return post<PartnerStageStatusResponse>("/api/partner/credit/stage-status", withAdapterDefaults(input));
      },
      action,
      checkCredit(input: Omit<PartnerActionContextRequest, "payload" | "session_id" | "session_token" | "target_wallet" | "tx_signatures" | "mints">): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "check_credit",
        });
      },
      getAttnAlignmentOffer(input: Omit<PartnerActionContextRequest, "payload" | "session_id" | "session_token" | "mint" | "borrower_wallet" | "facility_pubkey" | "target_wallet" | "tx_signatures" | "mints">): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "get_attn_alignment_offer",
        });
      },
      acceptAttnAlignmentOffer(input: Omit<PartnerActionContextRequest, "payload" | "session_id" | "session_token" | "mint" | "borrower_wallet" | "facility_pubkey" | "target_wallet" | "tx_signatures" | "mints">): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "accept_attn_alignment_offer",
        });
      },
      startOnboarding(input: Omit<PartnerActionContextRequest, "session_id" | "session_token" | "mint" | "borrower_wallet" | "facility_pubkey" | "target_wallet" | "tx_signatures" | "mints"> & { payload: Record<string, unknown> }): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "start_onboarding",
        });
      },
      getStageStatus(input: Omit<PartnerActionContextRequest, "payload" | "mint" | "borrower_wallet" | "facility_pubkey" | "target_wallet" | "tx_signatures" | "mints"> & { session_id: string }): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "get_stage_status",
        });
      },
      executeHandoff(input: Omit<PartnerActionContextRequest, "payload" | "mint" | "borrower_wallet" | "facility_pubkey" | "target_wallet" | "tx_signatures" | "mints"> & { session_id: string }): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "execute_handoff",
        });
      },
      openCreditLine(
        input: Omit<PartnerActionContextRequest, "payload" | "mint" | "borrower_wallet" | "target_wallet" | "mints"> & {
          session_id?: string;
          facility_pubkey: string;
          tx_signatures?: string[];
        },
      ): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "open_credit_line",
        });
      },
      repay(
        input: Omit<PartnerActionContextRequest, "payload" | "mint" | "borrower_wallet" | "target_wallet" | "mints"> & {
          session_id?: string;
          facility_pubkey: string;
          tx_signatures?: string[];
        },
      ): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "repay",
        });
      },
      offboard(input: Omit<PartnerActionContextRequest, "payload" | "mint" | "borrower_wallet"> & {
        session_id: string;
        facility_pubkey: string;
        target_wallet?: string;
        tx_signatures?: string[];
        mints?: string[];
      }): Promise<PartnerActionResponse> {
        return action({
          ...withAdapterDefaults(input),
          action: "offboard",
        });
      },
    };
  }

  type BaseChainAdapter = ReturnType<typeof createBaseAdapter>;
  type EvmChainAdapter = BaseChainAdapter & { eip8183: AttnEip8183Helpers };
  type ChainAdapter<T extends AttnChain | undefined> = T extends "evm" ? EvmChainAdapter : BaseChainAdapter;

  function createChainAdapter<T extends AttnChain | undefined>(chain: T): ChainAdapter<T> {
    const adapter = createBaseAdapter(chain);
    if (chain === "evm") {
      return {
        ...adapter,
        eip8183: attnEip8183Helpers,
      } as ChainAdapter<T>;
    }
    return adapter as ChainAdapter<T>;
  }

  const defaultAdapter = createChainAdapter(options.chain);

  return {
    chain: options.chain ?? null,
    forChain<T extends AttnChain>(chain: T): ChainAdapter<T> {
      return createChainAdapter(chain);
    },
    solana: createChainAdapter("solana"),
    evm: createChainAdapter("evm"),
    ...defaultAdapter,
  };
}

type ActionInput = Omit<PartnerActionContextRequest, "chain">;
type DefaultableInput = Pick<
  ActionInput,
  "cluster" | "preset_id" | "creator_ingress_mode" | "control_profile_id"
>;
type CapabilitiesInput = Partial<DefaultableInput>;
type CatalogInput = PartnerCatalogRequest;

export function classifyPartnerActionOutcome(args: {
  action: PartnerActionName;
  response: PartnerActionResponse;
  attemptCount?: number;
  maxAttempts?: number;
}): AttnAgentDecision {
  const attemptCount = Math.max(1, args.attemptCount ?? 1);
  const maxAttempts = Math.max(1, args.maxAttempts ?? 2);
  const blockers = asStringArray(args.response.blockers);
  const nextActions = asStringArray(args.response.next_actions);
  const executionMode = executionModeFromResponse(args.response);
  const verificationState = verificationStateFromResponse(args.response);
  const replayed = replayedFromResponse(args.response);
  const explicitlyBlocked =
    args.response.ok !== true ||
    args.response.state === "blocked" ||
    args.response.agent_tool_mode === "blocked";
  const verificationSatisfied =
    verificationState === "evidence_verified" ||
    verificationState === "release_verified" ||
    replayed;

  let status: AttnAgentDecisionStatus = "ready";
  if (explicitlyBlocked) {
    status = attemptCount >= maxAttempts ? "escalate" : "blocked";
  } else if (verificationSatisfied) {
    status = "ready";
  } else if (executionMode === "manual_client_signature_required") {
    status = "await_human_signature";
  }

  return {
    status,
    must_stop: status !== "ready",
    requires_human_signature: status === "await_human_signature",
    should_escalate: status === "escalate",
    attempt_count: attemptCount,
    max_attempts: maxAttempts,
    blockers,
    next_actions: nextActions,
    agent_lane_state: args.response.agent_lane_state,
    proof_state: args.response.proof_state,
    public_claim_state: args.response.public_claim_state,
  };
}

export function summarizeCapabilities(
  response: PartnerCapabilitiesResponse,
): AttnAgentCapabilitiesOutcome {
  const ready_actions: PartnerActionName[] = [];
  const blocked_actions: PartnerActionName[] = [];
  const preview_actions: PartnerActionName[] = [];
  const context_required_actions: PartnerActionName[] = [];

  for (const [action, capability] of Object.entries(response.actions) as Array<
    [PartnerActionName, PartnerCapabilitiesResponse["actions"][PartnerActionName]]
  >) {
    if (capability.state === "ready") ready_actions.push(action);
    if (capability.state === "blocked") blocked_actions.push(action);
    if (capability.state === "preview_only") preview_actions.push(action);
    if (capability.state === "context_required") context_required_actions.push(action);
  }

  return {
    response,
    ready_actions,
    blocked_actions,
    preview_actions,
    context_required_actions,
  };
}

export function summarizeCatalog(response: PartnerCatalogResponse): AttnAgentCatalogOutcome {
  const currentTruth = response.current_truth ?? null;
  if (!currentTruth) {
    const responseRecord = response as unknown as Record<string, unknown>;
    const errorBlockers = Array.from(
      new Set(
        [
          ...asStringArray(responseRecord.blocker_codes),
          ...asStringArray(responseRecord.blockers),
          typeof responseRecord.code === "string" ? responseRecord.code : null,
          typeof responseRecord.message === "string" ? responseRecord.message : null,
        ].filter((value): value is string => Boolean(value && value.trim().length > 0)),
      ),
    );

    return {
      response,
      live_claim_scope: "none",
      real_credit_blockers:
        errorBlockers.length > 0 ? errorBlockers : ["catalog_current_truth_missing"],
      closure_hosted_state: null,
      first_private_lane_semantics: null,
      pilot_path_truth: null,
      private_parity_receipt: null,
      hosted_state_posture: "unknown",
      dashboard_speed: null,
      speed_posture: "unproven",
      speed_blockers: ["catalog_dashboard_speed_missing"],
    };
  }

  const closureHostedState = currentTruth.closure_hosted_state ?? null;
  const firstPrivateLaneSemantics =
    currentTruth.first_private_lane_semantics ?? null;
  const pilotPathTruth = currentTruth.pilot_path_truth ?? null;
  const privateParityReceipt = currentTruth.private_parity_receipt ?? null;
  const dashboardSpeed = currentTruth.dashboard_speed ?? null;
  const speedBlockers = Array.from(
    new Set(
      [
        ...(dashboardSpeed?.borrower_blockers ?? []),
        ...(dashboardSpeed?.lender_blockers ?? []),
      ].filter((value) => value.trim().length > 0),
    ),
  );

  return {
    response,
    live_claim_scope: currentTruth.live_claim_scope,
    real_credit_blockers: asStringArray(currentTruth.real_credit_blockers),
    closure_hosted_state: closureHostedState,
    first_private_lane_semantics: firstPrivateLaneSemantics,
    pilot_path_truth: pilotPathTruth,
    private_parity_receipt: privateParityReceipt,
    hosted_state_posture: classifyCatalogHostedStatePosture(closureHostedState),
    dashboard_speed: dashboardSpeed,
    speed_posture: classifyCatalogSpeedPosture(dashboardSpeed),
    speed_blockers: speedBlockers,
  };
}

export function recommendCatalogAction(
  summary: AttnAgentCatalogOutcome,
): AttnAgentCatalogRecommendationOutcome {
  const recommendationReasons = Array.from(
    new Set([...summary.real_credit_blockers, ...summary.speed_blockers]),
  );

  if (summary.live_claim_scope === "none") {
    recommendationReasons.push("live_claim_scope_none");
  } else if (summary.live_claim_scope === "callable_fallback_only") {
    recommendationReasons.push("live_claim_scope_callable_fallback_only");
  }

  if (summary.speed_posture !== "measured") {
    recommendationReasons.push(`speed_posture_${summary.speed_posture}`);
  }

  if (summary.hosted_state_posture !== "shared_kv_fail_closed") {
    recommendationReasons.push(
      `hosted_state_posture_${summary.hosted_state_posture}`,
    );
  }

  let recommendation: AttnAgentCatalogRecommendation = "proceed_read_only";
  if (summary.live_claim_scope === "none" || summary.real_credit_blockers.length > 0) {
    recommendation = "escalate_or_block";
  } else if (
    summary.live_claim_scope === "callable_fallback_only" ||
    summary.speed_posture !== "measured" ||
    summary.speed_blockers.length > 0 ||
    summary.hosted_state_posture !== "shared_kv_fail_closed"
  ) {
    recommendation = "proceed_with_caution";
  }

  return {
    ...summary,
    recommendation,
    recommendation_reasons: recommendationReasons,
  };
}

export function createAttnAgentLoanTools(options: AttnAgentLoanToolsOptions) {
  const adapter = options.client.forChain(options.chain);
  const maxAttempts = Math.max(1, options.maxAttemptsPerAction ?? 2);

  async function runAction(
    action: PartnerActionName,
    execute: () => Promise<PartnerActionResponse>,
    attemptCount?: number,
  ): Promise<AttnAgentActionOutcome> {
    const response = await execute();
    return {
      action,
      response,
      decision: classifyPartnerActionOutcome({
        action,
        response,
        attemptCount,
        maxAttempts,
      }),
    };
  }

  return {
    actionOrder: [...ATTN_AGENT_BORROWER_ACTION_ORDER],
    catalog(input?: CatalogInput): Promise<PartnerCatalogResponse> {
      return options.client.catalog({
        ...mergeDefaults(options.defaults, input ?? {}),
        chain: options.chain,
      });
    },
    async summarizeCatalog(input?: CatalogInput) {
      return summarizeCatalog(
        await options.client.catalog({
          ...mergeDefaults(options.defaults, input ?? {}),
          chain: options.chain,
        }),
      );
    },
    async recommendCatalogAction(input?: CatalogInput) {
      return recommendCatalogAction(await this.summarizeCatalog(input));
    },
    capabilities(input?: CapabilitiesInput) {
      return adapter.capabilities(mergeDefaults(options.defaults, input ?? {}));
    },
    async summarizeCapabilities(input?: CapabilitiesInput) {
      return summarizeCapabilities(
        await adapter.capabilities(mergeDefaults(options.defaults, input ?? {})),
      );
    },
    checkCredit(
      input: Omit<
        ActionInput,
        | "payload"
        | "session_id"
        | "session_token"
        | "target_wallet"
        | "tx_signatures"
        | "mints"
      >,
      attemptCount?: number,
    ) {
      return runAction(
        "check_credit",
        () => adapter.checkCredit(mergeDefaults(options.defaults, input)),
        attemptCount,
      );
    },
    getAttnAlignmentOffer(
      input: Omit<
        ActionInput,
        | "payload"
        | "session_id"
        | "session_token"
        | "mint"
        | "borrower_wallet"
        | "facility_pubkey"
        | "target_wallet"
        | "tx_signatures"
        | "mints"
      >,
      attemptCount?: number,
    ) {
      return runAction(
        "get_attn_alignment_offer",
        () => adapter.getAttnAlignmentOffer(mergeDefaults(options.defaults, input)),
        attemptCount,
      );
    },
    acceptAttnAlignmentOffer(
      input: Omit<
        ActionInput,
        | "payload"
        | "session_id"
        | "session_token"
        | "mint"
        | "borrower_wallet"
        | "facility_pubkey"
        | "target_wallet"
        | "tx_signatures"
        | "mints"
      >,
      attemptCount?: number,
    ) {
      return runAction(
        "accept_attn_alignment_offer",
        () =>
          adapter.acceptAttnAlignmentOffer(mergeDefaults(options.defaults, input)),
        attemptCount,
      );
    },
    startOnboarding(
      input: Omit<
        ActionInput,
        | "session_id"
        | "session_token"
        | "mint"
        | "borrower_wallet"
        | "facility_pubkey"
        | "target_wallet"
        | "tx_signatures"
        | "mints"
      > & { payload: Record<string, unknown> },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction(
        "start_onboarding",
        () => adapter.startOnboarding(request),
        attemptCount,
      );
    },
    getStageStatus(
      input: Omit<
        ActionInput,
        | "payload"
        | "mint"
        | "borrower_wallet"
        | "facility_pubkey"
        | "target_wallet"
        | "tx_signatures"
        | "mints"
      > & { session_id: string },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction(
        "get_stage_status",
        () => adapter.getStageStatus(request),
        attemptCount,
      );
    },
    executeHandoff(
      input: Omit<
        ActionInput,
        | "payload"
        | "mint"
        | "borrower_wallet"
        | "facility_pubkey"
        | "target_wallet"
        | "tx_signatures"
        | "mints"
      > & { session_id: string },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction(
        "execute_handoff",
        () => adapter.executeHandoff(request),
        attemptCount,
      );
    },
    openCreditLine(
      input: Omit<
        ActionInput,
        "payload" | "mint" | "borrower_wallet" | "target_wallet" | "mints"
      > & { facility_pubkey: string; tx_signatures?: string[] },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction(
        "open_credit_line",
        () => adapter.openCreditLine(request),
        attemptCount,
      );
    },
    prepareCreditLine(
      input: Omit<
        ActionInput,
        | "payload"
        | "mint"
        | "borrower_wallet"
        | "target_wallet"
        | "mints"
        | "tx_signatures"
      > & { facility_pubkey: string },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, {
        ...input,
        tx_signatures: [],
      });
      return runAction(
        "open_credit_line",
        () => adapter.openCreditLine(request),
        attemptCount,
      );
    },
    verifyCreditLine(
      input: Omit<
        ActionInput,
        "payload" | "mint" | "borrower_wallet" | "target_wallet" | "mints"
      > & { facility_pubkey: string; tx_signatures: string[] },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction(
        "open_credit_line",
        () => adapter.openCreditLine(request),
        attemptCount,
      );
    },
    repay(
      input: Omit<
        ActionInput,
        "payload" | "mint" | "borrower_wallet" | "target_wallet" | "mints"
      > & { facility_pubkey: string; tx_signatures?: string[] },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction("repay", () => adapter.repay(request), attemptCount);
    },
    prepareRepay(
      input: Omit<
        ActionInput,
        | "payload"
        | "mint"
        | "borrower_wallet"
        | "target_wallet"
        | "mints"
        | "tx_signatures"
      > & { facility_pubkey: string },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, {
        ...input,
        tx_signatures: [],
      });
      return runAction("repay", () => adapter.repay(request), attemptCount);
    },
    verifyRepay(
      input: Omit<
        ActionInput,
        "payload" | "mint" | "borrower_wallet" | "target_wallet" | "mints"
      > & { facility_pubkey: string; tx_signatures: string[] },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction("repay", () => adapter.repay(request), attemptCount);
    },
    offboard(
      input: Omit<ActionInput, "payload" | "mint" | "borrower_wallet"> & {
        session_id: string;
        facility_pubkey: string;
        target_wallet?: string;
        tx_signatures?: string[];
        mints?: string[];
      },
      attemptCount?: number,
    ) {
      const request = mergeDefaults(options.defaults, input);
      return runAction("offboard", () => adapter.offboard(request), attemptCount);
    },
  };
}

export const createAttnAgentTools = createAttnAgentLoanTools;

export function createPumpAgentBorrowerTools(
  options: AttnPumpAgentBorrowerToolsOptions,
) {
  return createAttnAgentLoanTools({
    client: options.client,
    chain: "solana",
    defaults: {
      ...ATTN_PUMP_AGENT_BORROWER_DEFAULTS,
      cluster: options.cluster ?? ATTN_PUMP_AGENT_BORROWER_DEFAULTS.cluster,
      control_profile_id:
        options.control_profile_id ??
        ATTN_PUMP_AGENT_BORROWER_DEFAULTS.control_profile_id,
    },
    maxAttemptsPerAction: options.maxAttemptsPerAction,
  });
}
