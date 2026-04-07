import type {
  AttnChain,
  ControlProfileId,
  CreatorIngressMode,
  PartnerActionName,
  SettlementCoreSummary,
  SettlementLedgerAccountScope,
  SettlementPolicyMode,
  SettlementReceiptKind,
  SettlementRouteScope,
  SettlementServiceModule,
  SettlementServiceModuleStatus,
  SettlementServiceModuleType,
  SettlementSourceModel,
  SettlementTargetOwnerMode,
  SupportedCluster,
} from "./schema";

function normalizeIdSegment(value: string | undefined): string {
  const normalized = (value ?? "unknown").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return normalized.length > 0 ? normalized : "unknown";
}

type SettlementCoreProjectionInput = {
  chain: AttnChain;
  cluster: SupportedCluster;
  preset_id: string;
  creator_ingress_mode: CreatorIngressMode;
  control_profile_id?: ControlProfileId;
  blocked: boolean;
  activated?: boolean;
  creditActive?: boolean;
  repayComplete?: boolean;
  offboardRecorded?: boolean;
  session_id?: string;
  facility_pubkey?: string;
  borrower_wallet?: string;
  request_id?: string;
  action?: PartnerActionName;
  tx_ids?: string[];
  source_model?: SettlementSourceModel;
  service_modules?: Array<{
    module_type: SettlementServiceModuleType;
    module_status?: SettlementServiceModuleStatus;
    notes?: string[];
  }>;
  target_owner_mode?: SettlementTargetOwnerMode;
  notes?: string[];
};

function serviceStateForType(moduleType: SettlementServiceModuleType) {
  switch (moduleType) {
    case "credit_line":
      return "credit_active" as const;
    case "reserve":
      return "reserve_active" as const;
    case "treasury":
      return "treasury_active" as const;
    case "custom":
      return "multi_service" as const;
  }
}

function buildServiceModules(input: SettlementCoreProjectionInput): SettlementServiceModule[] {
  const explicitModules =
    input.service_modules?.map((module) => ({
      module_type: module.module_type,
      module_status: module.module_status ?? "active",
      notes: [...(module.notes ?? [])],
    })) ?? [];

  const hasCreditModule = explicitModules.some((module) => module.module_type === "credit_line");
  if (input.creditActive && !hasCreditModule) {
    explicitModules.unshift({
      module_type: "credit_line",
      module_status: "active",
      notes: ["credit line service is currently intercepting revenue."],
    });
  } else if ((input.repayComplete || input.offboardRecorded) && !hasCreditModule) {
    explicitModules.unshift({
      module_type: "credit_line",
      module_status: "closed",
      notes: ["credit line service is closed; route defaults to pass-through unless a new service activates."],
    });
  }

  const activeTypes = new Set(
    explicitModules.filter((module) => module.module_status === "active").map((module) => module.module_type),
  );
  const sharedActiveState =
    activeTypes.size <= 1
      ? serviceStateForType(explicitModules.find((module) => module.module_status === "active")?.module_type ?? "custom")
      : ("multi_service" as const);

  return explicitModules.map((module) => ({
    module_id: "",
    module_type: module.module_type,
    module_status: module.module_status,
    service_state:
      module.module_status === "active"
        ? sharedActiveState
        : activeTypes.size > 0
          ? sharedActiveState
          : ("none" as const),
    notes: [...module.notes],
  }));
}

function inferSummaryStates(input: SettlementCoreProjectionInput) {
  const serviceModules = buildServiceModules(input);
  const activeModules = serviceModules.filter((module) => module.module_status === "active");
  const activeServiceModules = [...new Set(activeModules.map((module) => module.module_type))];
  const creditActive = activeServiceModules.includes("credit_line");
  const repayComplete = input.repayComplete === true;
  const offboardRecorded = input.offboardRecorded === true;
  const routeActivated = input.activated === true || activeServiceModules.length > 0 || repayComplete || offboardRecorded;

  const route_state = input.blocked
    ? "inactive"
    : activeServiceModules.length > 0
      ? "active_policy"
      : routeActivated
        ? "active_pass_through"
        : "inactive";

  const service_state =
    activeServiceModules.length === 0
      ? "none"
      : activeServiceModules.length > 1
        ? "multi_service"
        : serviceStateForType(activeServiceModules[0] ?? "custom");
  const waterfall_state = input.blocked
    ? "blocked"
    : activeServiceModules.length === 0
      ? "pass_through"
      : creditActive && activeServiceModules.length === 1
        ? "repay_first"
        : "split";
  const pass_through_state = input.blocked
    ? "not_ready"
    : activeServiceModules.length > 0
      ? "ready_after_service_close"
      : route_state === "active_pass_through"
        ? "active"
        : "not_ready";

  return {
    route_state,
    service_state,
    waterfall_state,
    pass_through_state,
    active_service_modules: activeServiceModules,
    service_modules: serviceModules,
    creditActive,
    repayComplete,
    offboardRecorded,
    routeActivated,
  } as const;
}

function inferRouteScope(input: SettlementCoreProjectionInput): SettlementRouteScope {
  if (input.facility_pubkey) return "facility_bound";
  if (input.session_id) return "session_bound";
  return "lane_template";
}

function inferAccountScope(input: SettlementCoreProjectionInput): SettlementLedgerAccountScope {
  if (input.facility_pubkey) return "facility_bound";
  if (input.session_id) return "session_bound";
  return "pending_context";
}

function inferReceiptKind(input: SettlementCoreProjectionInput, states: ReturnType<typeof inferSummaryStates>): SettlementReceiptKind {
  if (states.offboardRecorded || input.action === "offboard") return "offboard_projection";
  if (states.repayComplete || input.action === "repay") return "repay_projection";
  if (states.creditActive || input.action === "open_credit_line") return "credit_projection";
  if (states.routeActivated || input.action === "execute_handoff") return "activation_projection";
  return "route_projection";
}

function inferPolicyMode(input: SettlementCoreProjectionInput, states: ReturnType<typeof inferSummaryStates>): SettlementPolicyMode {
  if (input.blocked) return "blocked";
  if (states.active_service_modules.length === 0) return "pass_through_default";
  if (states.creditActive && states.active_service_modules.length === 1) return "credit_repay_first";
  return "service_split";
}

function inferTargetOwnerMode(input: SettlementCoreProjectionInput, states: ReturnType<typeof inferSummaryStates>): SettlementTargetOwnerMode {
  if (input.target_owner_mode) return input.target_owner_mode;
  if (input.blocked || !states.routeActivated) return "unknown";
  return "attn_controlled";
}

export function createSettlementCoreProjection(input: SettlementCoreProjectionInput): SettlementCoreSummary {
  const source_model = input.source_model ?? "lane_projection";
  const states = inferSummaryStates(input);
  const notes = [
    input.chain === "solana"
      ? "settlement core is projected from lane-specific Solana borrower/runtime receipts."
      : "settlement core is projected from lane-specific EVM partner/runtime receipts.",
    ...(input.notes ?? []),
  ];

  if (input.creator_ingress_mode === "via-borrower") {
    notes.push("via-borrower routing remains cohort- and preflight-dependent.");
  }
  if (input.blocked) {
    notes.push("settlement route remains inactive until lane blockers clear.");
  } else if (states.creditActive) {
    notes.push("credit service is active, so repayment waterfall takes precedence over pass-through.");
  } else if (states.route_state === "active_pass_through") {
    notes.push("no active service is intercepting funds; default pass-through applies.");
  } else {
    notes.push("no settlement route is active yet.");
  }

  const routeScope = inferRouteScope(input);
  const accountScope = inferAccountScope(input);
  const subjectRef = input.facility_pubkey ?? input.session_id ?? input.borrower_wallet ?? input.preset_id;
  const route_id = [
    "attn",
    "route",
    normalizeIdSegment(input.chain),
    normalizeIdSegment(input.cluster),
    normalizeIdSegment(input.preset_id),
    normalizeIdSegment(input.creator_ingress_mode),
  ].join(":");
  const account_id = [
    "attn",
    "ledger",
    normalizeIdSegment(input.chain),
    normalizeIdSegment(subjectRef),
  ].join(":");
  const policy_id = [
    "attn",
    "policy",
    normalizeIdSegment(route_id),
    normalizeIdSegment(inferPolicyMode(input, states)),
  ].join(":");
  const receiptKind = inferReceiptKind(input, states);
  const receipt_id = [
    "attn",
    "receipt",
    normalizeIdSegment(route_id),
    normalizeIdSegment(receiptKind),
    normalizeIdSegment(input.request_id),
  ].join(":");

  const service_modules = states.service_modules.map((module) => ({
    ...module,
    module_id: `${policy_id}:${module.module_type}`,
  }));

  return {
    route_state: states.route_state,
    service_state: states.service_state,
    waterfall_state: states.waterfall_state,
    ledger_state: "canonical_shared",
    pass_through_state: states.pass_through_state,
    active_service_modules: states.active_service_modules,
    notes,
    route: {
      route_id,
      route_scope: routeScope,
      chain: input.chain,
      cluster: input.cluster,
      preset_id: input.preset_id,
      creator_ingress_mode: input.creator_ingress_mode,
      control_profile_id: input.control_profile_id ?? "unknown",
      route_state: states.route_state,
      target_owner_mode: inferTargetOwnerMode(input, states),
      source_model,
      notes: [...notes],
    },
    ledger_account: {
      account_id,
      account_scope: accountScope,
      ledger_state: "canonical_shared",
      source_model,
      chain: input.chain,
      subject_ref: subjectRef,
      session_id: input.session_id,
      facility_pubkey: input.facility_pubkey,
      borrower_wallet: input.borrower_wallet,
      credit_open: states.creditActive,
      notes: ["shared settlement entities are canonical, but current state is still projected from lane-specific receipts where applicable."],
    },
    policy: {
      policy_id,
      policy_mode: inferPolicyMode(input, states),
      service_state: states.service_state,
      waterfall_state: states.waterfall_state,
      pass_through_state: states.pass_through_state,
      default_after_close: "pass_through",
      active_service_modules: states.active_service_modules,
      source_model,
      notes: [
        states.creditActive
          ? "repay-first policy is active while debt remains open."
          : "default pass-through applies when no active service is intercepting funds.",
      ],
    },
    service_modules,
    latest_receipt: {
      receipt_type: "attn_settlement_projection_receipt",
      receipt_id,
      request_id: input.request_id,
      kind: receiptKind,
      state: input.blocked ? "blocked" : states.routeActivated || Boolean(input.action) ? "verified" : "projected",
      chain: input.chain,
      cluster: input.cluster,
      action: input.action,
      source_model,
      route_id,
      account_id,
      policy_id,
      tx_ids: input.tx_ids ?? [],
      credit_open: states.creditActive,
      repay_complete: states.repayComplete,
      offboard_recorded: states.offboardRecorded,
      notes: [
        input.blocked
          ? "current lifecycle step is blocked; receipt captures the fail-closed projection."
          : "receipt captures the canonical shared projection for this lifecycle step.",
      ],
    },
  };
}

export type { SettlementCoreProjectionInput };
