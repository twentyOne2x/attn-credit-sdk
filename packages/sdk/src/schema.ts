import { z } from "zod";

export const SUPPORTED_CLUSTERS = ["mainnet-beta", "devnet"] as const;
export type SupportedCluster = (typeof SUPPORTED_CLUSTERS)[number];

export const ATTN_CHAINS = ["solana", "evm"] as const;
export type AttnChain = (typeof ATTN_CHAINS)[number];

export const CREATOR_INGRESS_MODES = ["via-borrower", "direct-to-swig"] as const;
export type CreatorIngressMode = (typeof CREATOR_INGRESS_MODES)[number];

export const CONTROL_PROFILE_IDS = ["none", "attn_default", "partner_managed_light", "partner_managed_firm"] as const;
export type ControlProfileId = (typeof CONTROL_PROFILE_IDS)[number];

export const PARTNER_CONTROL_SURFACE_MODES = [
  "attn_safe_backend",
  "partner_managed_wallet_infra",
] as const;
export type PartnerControlSurfaceMode = (typeof PARTNER_CONTROL_SURFACE_MODES)[number];

export const PARTNER_WALLET_OPERATOR_MODELS = [
  "single_platform_signer",
  "quorum_or_policy_engine",
  "unknown",
] as const;
export type PartnerWalletOperatorModel = (typeof PARTNER_WALLET_OPERATOR_MODELS)[number];

export const PRIVATE_TREASURY_FINANCING_STATES = [
  "not_financed",
  "manual_operator_release",
  "automated_treasury",
] as const;
export type PrivateTreasuryFinancingState = (typeof PRIVATE_TREASURY_FINANCING_STATES)[number];

export const PARTNER_MANAGED_REPAYMENT_ENFORCEMENT_CLASSES = [
  "partner_policy_only",
  "partner_policy_plus_attn_verifier",
  "swig_equivalent_partner_control",
] as const;
export type PartnerManagedRepaymentEnforcementClass =
  (typeof PARTNER_MANAGED_REPAYMENT_ENFORCEMENT_CLASSES)[number];

export const PARTNER_WALLET_POLICY_REQUIREMENT_IDS = [
  "authoritative_revenue_source_attribution",
  "authoritative_revenue_scope_mapping",
  "authoritative_wallet_topology",
  "authoritative_payout_state",
  "authoritative_revenue_event_feed",
  "repayment_target_invariant",
  "payout_edit_authority_separation",
  "debt_open_change_control",
  "release_and_offboard_semantics",
  "private_treasury_funding_receipts",
  "attn_readback_and_audit_receipts",
  "incident_freeze_and_quarantine",
] as const;
export type PartnerWalletPolicyRequirementId =
  (typeof PARTNER_WALLET_POLICY_REQUIREMENT_IDS)[number];

export const PARTNER_WALLET_POLICY_REQUIREMENT_STATES = [
  "missing",
  "partial",
  "verified",
] as const;
export type PartnerWalletPolicyRequirementState =
  (typeof PARTNER_WALLET_POLICY_REQUIREMENT_STATES)[number];

export const PARTNER_MANAGED_INTEGRATION_STAGES = [
  "stage_0_truth_discovery",
  "stage_1_platform_counterparty_mvp",
  "stage_2_observable_payout_path_mvp",
  "stage_3_policy_bounded_first_pilot",
  "stage_4_full_partner_managed_standard",
] as const;
export type PartnerManagedIntegrationStage =
  (typeof PARTNER_MANAGED_INTEGRATION_STAGES)[number];

export const PARTNER_MANAGED_CLAIM_LEVELS = [
  "compatibility_only",
  "underwriting_compatible",
  "repayment_control_compatible",
  "swig_equivalent_partner_control_compatible",
] as const;
export type PartnerManagedClaimLevel = (typeof PARTNER_MANAGED_CLAIM_LEVELS)[number];

export const PARTNER_MANAGED_REVENUE_SCOPE_MODELS = [
  "creator_fees",
  "service_fees",
  "usage_fees",
  "subscription_revenue",
  "creator_and_service_fees",
  "service_and_usage_fees",
  "custom",
] as const;
export type PartnerManagedRevenueScopeModel =
  (typeof PARTNER_MANAGED_REVENUE_SCOPE_MODELS)[number];

export const PARTNER_MANAGED_READBACK_SOURCE_KINDS = [
  "api",
  "webhook",
  "signed_receipt",
  "dashboard_export",
  "database_export",
  "manual_attestation",
] as const;
export type PartnerManagedReadbackSourceKind =
  (typeof PARTNER_MANAGED_READBACK_SOURCE_KINDS)[number];

export const PARTNER_MANAGED_READBACK_KINDS = [
  "payout_topology",
  "debt_open_routing",
  "change_authority",
  "incident_state",
] as const;
export type PartnerManagedReadbackKind = (typeof PARTNER_MANAGED_READBACK_KINDS)[number];

export const PARTNER_MANAGED_ROUTING_STATES = [
  "unknown",
  "inactive",
  "observable",
  "enforced",
] as const;
export type PartnerManagedRoutingState = (typeof PARTNER_MANAGED_ROUTING_STATES)[number];

export const PARTNER_MANAGED_CHANGE_AUTHORITY_KINDS = [
  "single_signer",
  "quorum",
  "policy_engine",
  "unknown",
] as const;
export type PartnerManagedChangeAuthorityKind =
  (typeof PARTNER_MANAGED_CHANGE_AUTHORITY_KINDS)[number];

export const PARTNER_MANAGED_INCIDENT_STATES = [
  "unknown",
  "not_supported",
  "available",
  "active",
] as const;
export type PartnerManagedIncidentState = (typeof PARTNER_MANAGED_INCIDENT_STATES)[number];

export const PARTNER_MANAGED_RECEIPT_TYPES = [
  "partner_managed_payout_topology_receipt",
  "partner_managed_revenue_events_receipt",
  "partner_managed_debt_open_routing_receipt",
  "partner_managed_change_event_receipt",
  "partner_managed_release_offboard_receipt",
  "partner_managed_incident_state_receipt",
] as const;
export type PartnerManagedReceiptType = (typeof PARTNER_MANAGED_RECEIPT_TYPES)[number];

export const PARTNER_MANAGED_DRIFT_SEVERITIES = ["info", "warn", "critical"] as const;
export type PartnerManagedDriftSeverity = (typeof PARTNER_MANAGED_DRIFT_SEVERITIES)[number];

export const SESSION_AUTH_CHAIN_FAMILIES = ["solana", "evm"] as const;
export type SessionAuthChainFamily = (typeof SESSION_AUTH_CHAIN_FAMILIES)[number];

export const PARTNER_ACTIONS = [
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
export type PartnerActionName = (typeof PARTNER_ACTIONS)[number];

export const PARTNER_CAPABILITY_STATES = ["ready", "context_required", "preview_only", "blocked"] as const;
export type PartnerCapabilityState = (typeof PARTNER_CAPABILITY_STATES)[number];

export const PARTNER_EXECUTION_MODES = [
  "read_only",
  "transact_approved",
  "manual_client_signature_required",
  "blocked",
] as const;
export type PartnerExecutionMode = (typeof PARTNER_EXECUTION_MODES)[number];

export const PARTNER_DEPENDENCY_STATES = ["healthy", "degraded", "missing", "unknown", "not_applicable"] as const;
export type PartnerDependencyState = (typeof PARTNER_DEPENDENCY_STATES)[number];

export const PARTNER_SDK_STAGES = ["session", "evidence", "preflight", "activation", "funding", "active", "repay", "offboard"] as const;
export type PartnerSdkStage = (typeof PARTNER_SDK_STAGES)[number];

export const PARTNER_AGENT_TOOL_MODES = ["read_only", "transact_approved", "blocked"] as const;
export type PartnerAgentToolMode = (typeof PARTNER_AGENT_TOOL_MODES)[number];

export const PARTNER_AGENT_LANE_STATES = [
  "quote_only",
  "onboarding",
  "activation_ready",
  "funding_pending",
  "active",
  "repay_ready",
  "close_ready",
  "offboard_ready",
  "blocked",
] as const;
export type PartnerAgentLaneState = (typeof PARTNER_AGENT_LANE_STATES)[number];

export const PARTNER_CATALOG_ROUTE_METHODS = ["GET", "POST"] as const;
export type PartnerCatalogRouteMethod = (typeof PARTNER_CATALOG_ROUTE_METHODS)[number];

export const PARTNER_CATALOG_ROUTE_CATEGORIES = ["catalog", "read", "mutation", "operator"] as const;
export type PartnerCatalogRouteCategory = (typeof PARTNER_CATALOG_ROUTE_CATEGORIES)[number];

export const PARTNER_CATALOG_MCP_STATES = ["not_shipped", "wrapper_ready"] as const;
export type PartnerCatalogMcpState = (typeof PARTNER_CATALOG_MCP_STATES)[number];

export const PARTNER_CATALOG_OPERABILITY_STATES = ["discovery_only", "endpoint_operable", "funded_live_ready"] as const;
export type PartnerCatalogOperabilityState = (typeof PARTNER_CATALOG_OPERABILITY_STATES)[number];

export const SETTLEMENT_ROUTE_STATES = ["inactive", "active_pass_through", "active_policy"] as const;
export type SettlementRouteState = (typeof SETTLEMENT_ROUTE_STATES)[number];

export const SETTLEMENT_SERVICE_STATES = ["none", "credit_active", "reserve_active", "treasury_active", "multi_service"] as const;
export type SettlementServiceState = (typeof SETTLEMENT_SERVICE_STATES)[number];

export const SETTLEMENT_WATERFALL_STATES = ["pass_through", "repay_first", "split", "blocked"] as const;
export type SettlementWaterfallState = (typeof SETTLEMENT_WATERFALL_STATES)[number];

export const SETTLEMENT_LEDGER_STATES = ["shadow_lane_specific", "canonical_shared"] as const;
export type SettlementLedgerState = (typeof SETTLEMENT_LEDGER_STATES)[number];

export const SETTLEMENT_PASS_THROUGH_STATES = ["not_ready", "ready_after_service_close", "active"] as const;
export type SettlementPassThroughState = (typeof SETTLEMENT_PASS_THROUGH_STATES)[number];

export const SETTLEMENT_ROUTE_SCOPES = ["lane_template", "session_bound", "facility_bound"] as const;
export type SettlementRouteScope = (typeof SETTLEMENT_ROUTE_SCOPES)[number];

export const SETTLEMENT_LEDGER_ACCOUNT_SCOPES = ["pending_context", "session_bound", "facility_bound"] as const;
export type SettlementLedgerAccountScope = (typeof SETTLEMENT_LEDGER_ACCOUNT_SCOPES)[number];

export const SETTLEMENT_SOURCE_MODELS = ["lane_projection", "shared_runtime"] as const;
export type SettlementSourceModel = (typeof SETTLEMENT_SOURCE_MODELS)[number];

export const SETTLEMENT_TARGET_OWNER_MODES = ["unknown", "attn_controlled", "partner_managed"] as const;
export type SettlementTargetOwnerMode = (typeof SETTLEMENT_TARGET_OWNER_MODES)[number];

export const SETTLEMENT_POLICY_MODES = ["pass_through_default", "credit_repay_first", "service_split", "blocked"] as const;
export type SettlementPolicyMode = (typeof SETTLEMENT_POLICY_MODES)[number];

export const SETTLEMENT_SERVICE_MODULE_TYPES = ["credit_line", "reserve", "treasury", "custom"] as const;
export type SettlementServiceModuleType = (typeof SETTLEMENT_SERVICE_MODULE_TYPES)[number];

export const SETTLEMENT_SERVICE_MODULE_STATUSES = ["inactive", "active", "closed"] as const;
export type SettlementServiceModuleStatus = (typeof SETTLEMENT_SERVICE_MODULE_STATUSES)[number];

export const SETTLEMENT_RECEIPT_KINDS = [
  "route_projection",
  "activation_projection",
  "credit_projection",
  "repay_projection",
  "offboard_projection",
] as const;
export type SettlementReceiptKind = (typeof SETTLEMENT_RECEIPT_KINDS)[number];

export const SETTLEMENT_RECEIPT_STATES = ["projected", "verified", "blocked"] as const;
export type SettlementReceiptState = (typeof SETTLEMENT_RECEIPT_STATES)[number];

export const PROOF_STATES = ["spec_only", "code_shipped", "contract_proven", "proof_backed", "current"] as const;
export type ProofState = (typeof PROOF_STATES)[number];

export const PUBLIC_CLAIM_STATES = ["internal_only", "github_ready", "public_doc_ready", "current"] as const;
export type PublicClaimState = (typeof PUBLIC_CLAIM_STATES)[number];

export const PARTNER_CAPABILITIES_RECEIPT_TYPE = "partner_capabilities_receipt";
export const PARTNER_STAGE_STATUS_RECEIPT_TYPE = "partner_stage_status_receipt";
export const PARTNER_ACTION_RECEIPT_TYPE = "partner_action_receipt";
export const PARTNER_ERROR_RECEIPT_TYPE = "partner_error_receipt";

export const PARTNER_RECEIPT_TYPES = [
  PARTNER_CAPABILITIES_RECEIPT_TYPE,
  PARTNER_STAGE_STATUS_RECEIPT_TYPE,
  PARTNER_ACTION_RECEIPT_TYPE,
  PARTNER_ERROR_RECEIPT_TYPE,
] as const;
export type PartnerReceiptType = (typeof PARTNER_RECEIPT_TYPES)[number];

export type PartnerReceiptRoute = "capabilities" | "stage_status" | "action";

export const PARTNER_ROUTE_DEFAULTS = {
  chain: "solana" as AttnChain,
  cluster: "mainnet-beta" as SupportedCluster,
  creator_ingress_mode: "via-borrower" as CreatorIngressMode,
  control_profile_id: "attn_default" as ControlProfileId,
};

export const SDK_CLIENT_DEFAULTS = {
  chain: "solana" as AttnChain,
  cluster: "mainnet-beta" as SupportedCluster,
  creator_ingress_mode: "direct-to-swig" as CreatorIngressMode,
  control_profile_id: "partner_managed_light" as ControlProfileId,
};

function normalizeCreatorIngressMode(value: string): string {
  return value.replace(/_/g, "-").toLowerCase();
}

export const zAttnChain = z.enum(ATTN_CHAINS);
export const zSupportedCluster = z.enum(SUPPORTED_CLUSTERS);
export const zProofState = z.enum(PROOF_STATES);
export const zPublicClaimState = z.enum(PUBLIC_CLAIM_STATES);
export const zPartnerWalletOperatorModel = z.enum(PARTNER_WALLET_OPERATOR_MODELS);
export const zPrivateTreasuryFinancingState = z.enum(PRIVATE_TREASURY_FINANCING_STATES);
export const zPartnerManagedRepaymentEnforcementClass = z.enum(
  PARTNER_MANAGED_REPAYMENT_ENFORCEMENT_CLASSES,
);
export const zPartnerWalletPolicyRequirementId = z.enum(
  PARTNER_WALLET_POLICY_REQUIREMENT_IDS,
);
export const zPartnerWalletPolicyRequirementState = z.enum(
  PARTNER_WALLET_POLICY_REQUIREMENT_STATES,
);
export const zPartnerManagedIntegrationStage = z.enum(PARTNER_MANAGED_INTEGRATION_STAGES);
export const zPartnerManagedClaimLevel = z.enum(PARTNER_MANAGED_CLAIM_LEVELS);
export const zPartnerManagedRevenueScopeModel = z.enum(PARTNER_MANAGED_REVENUE_SCOPE_MODELS);
export const zPartnerManagedReadbackSourceKind = z.enum(
  PARTNER_MANAGED_READBACK_SOURCE_KINDS,
);
export const zPartnerManagedReadbackKind = z.enum(PARTNER_MANAGED_READBACK_KINDS);
export const zPartnerManagedRoutingState = z.enum(PARTNER_MANAGED_ROUTING_STATES);
export const zPartnerManagedChangeAuthorityKind = z.enum(
  PARTNER_MANAGED_CHANGE_AUTHORITY_KINDS,
);
export const zPartnerManagedIncidentState = z.enum(PARTNER_MANAGED_INCIDENT_STATES);
export const zPartnerManagedReceiptType = z.enum(PARTNER_MANAGED_RECEIPT_TYPES);
export const zPartnerManagedDriftSeverity = z.enum(PARTNER_MANAGED_DRIFT_SEVERITIES);

export const zCreatorIngressMode = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeCreatorIngressMode)
  .refine(
    (value): value is CreatorIngressMode =>
      value === "via-borrower" || value === "direct-to-swig",
    "creator_ingress_mode must be via-borrower or direct-to-swig",
  );

export const zControlProfileId = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase())
  .pipe(z.enum(CONTROL_PROFILE_IDS));

export const zPartnerAction = z.enum(PARTNER_ACTIONS);

export type SessionAuthProof = {
  wallet: string;
  chain_family?: SessionAuthChainFamily;
  issued_at: string;
  signature: string;
};

export type PartnerBaseRequest = {
  chain?: AttnChain;
  cluster?: SupportedCluster;
  preset_id: string;
  creator_ingress_mode?: CreatorIngressMode;
  control_profile_id?: ControlProfileId;
};

export type PartnerWalletPolicyRequirement = {
  requirement_id: PartnerWalletPolicyRequirementId;
  state: PartnerWalletPolicyRequirementState;
  note?: string;
};

export type PartnerManagedWalletPolicySummary = {
  control_surface_mode: "partner_managed_wallet_infra";
  wallet_operator_model: PartnerWalletOperatorModel;
  private_treasury_financing: PrivateTreasuryFinancingState;
  repayment_enforcement_class: PartnerManagedRepaymentEnforcementClass;
  requirements: PartnerWalletPolicyRequirement[];
  downgrade_if_missing: string[];
};

export type PartnerManagedReadbackSource = {
  source_id: string;
  source_kind: PartnerManagedReadbackSourceKind;
  observed_at: string;
  freshness_seconds?: number | null;
  proof_state?: ProofState;
  notes?: string[];
};

export type PartnerManagedIntegrationDescriptor = {
  partner_id: string;
  display_name: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  control_surface_mode: "partner_managed_wallet_infra";
  revenue_scope_model: PartnerManagedRevenueScopeModel;
  revenue_scope_notes: string[];
  payout_topology_source: PartnerManagedReadbackSource;
  debt_open_routing_source: PartnerManagedReadbackSource;
  readback_support: {
    payout_topology: boolean;
    revenue_events: boolean;
    debt_open_routing: boolean;
    change_authority: boolean;
    incident_state: boolean;
    release_state: boolean;
  };
  incident_support: {
    freeze_supported: boolean;
    quarantine_supported: boolean;
    session_revocation_supported: boolean;
  };
  release_support: {
    release_mode_supported: boolean;
    offboard_receipt_supported: boolean;
  };
  notes: string[];
};

export type PartnerManagedPayoutTopologyReadback = {
  source: PartnerManagedReadbackSource;
  payout_mode: string;
  recipient_wallets: string[];
  payout_edit_authority: string | null;
  operator_model: PartnerWalletOperatorModel;
  drift_detection_supported: boolean;
  notes: string[];
};

export type PartnerManagedDebtOpenRoutingReadback = {
  source: PartnerManagedReadbackSource;
  route_state: PartnerManagedRoutingState;
  repayment_target: string | null;
  release_target: string | null;
  repayment_share_bps?: number | null;
  unilateral_change_possible: boolean | "unknown";
  notes: string[];
};

export type PartnerManagedChangeAuthorityReadback = {
  source: PartnerManagedReadbackSource;
  authority_kind: PartnerManagedChangeAuthorityKind;
  authority_ref: string | null;
  change_receipts_supported: boolean;
  notes: string[];
};

export type PartnerManagedIncidentStateReadback = {
  source: PartnerManagedReadbackSource;
  incident_state: PartnerManagedIncidentState;
  freeze_supported: boolean;
  quarantine_supported: boolean;
  session_revocation_supported: boolean;
  notes: string[];
};

export type PartnerManagedReadbackSnapshot = {
  payout_topology?: PartnerManagedPayoutTopologyReadback;
  debt_open_routing?: PartnerManagedDebtOpenRoutingReadback;
  change_authority?: PartnerManagedChangeAuthorityReadback;
  incident_state?: PartnerManagedIncidentStateReadback;
};

export type PartnerManagedReadbackAdapter<TResult> = {
  adapter_id: string;
  readback_kind: PartnerManagedReadbackKind;
  source: PartnerManagedReadbackSource;
  read(): Promise<TResult> | TResult;
};

export type PartnerManagedBaseReceipt = {
  receipt_id: string;
  receipt_type: PartnerManagedReceiptType;
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  proof_state: ProofState;
  source_timestamp: string;
  received_at: string;
  notes: string[];
};

export type PartnerManagedPayoutTopologyReceipt = PartnerManagedBaseReceipt & {
  receipt_type: "partner_managed_payout_topology_receipt";
  payout_mode: string;
  recipient_wallets: string[];
  payout_edit_authority: string | null;
  operator_model: PartnerWalletOperatorModel;
};

export type PartnerManagedRevenueEventsReceipt = PartnerManagedBaseReceipt & {
  receipt_type: "partner_managed_revenue_events_receipt";
  revenue_unit: string;
  event_count: number;
  event_ids: string[];
};

export type PartnerManagedDebtOpenRoutingReceipt = PartnerManagedBaseReceipt & {
  receipt_type: "partner_managed_debt_open_routing_receipt";
  route_state: PartnerManagedRoutingState;
  repayment_target: string | null;
  release_target: string | null;
  repayment_share_bps?: number | null;
};

export type PartnerManagedChangeEventReceipt = PartnerManagedBaseReceipt & {
  receipt_type: "partner_managed_change_event_receipt";
  authority_kind: PartnerManagedChangeAuthorityKind;
  authority_ref: string | null;
  change_kind: string;
  changed_by: string | null;
};

export type PartnerManagedReleaseOffboardReceipt = PartnerManagedBaseReceipt & {
  receipt_type: "partner_managed_release_offboard_receipt";
  release_target: string | null;
  offboard_supported: boolean;
};

export type PartnerManagedIncidentStateReceipt = PartnerManagedBaseReceipt & {
  receipt_type: "partner_managed_incident_state_receipt";
  incident_state: PartnerManagedIncidentState;
  freeze_supported: boolean;
  quarantine_supported: boolean;
  session_revocation_supported: boolean;
};

export type PartnerManagedReceipt =
  | PartnerManagedPayoutTopologyReceipt
  | PartnerManagedRevenueEventsReceipt
  | PartnerManagedDebtOpenRoutingReceipt
  | PartnerManagedChangeEventReceipt
  | PartnerManagedReleaseOffboardReceipt
  | PartnerManagedIncidentStateReceipt;

export type PartnerManagedStageAssessment = {
  stage: PartnerManagedIntegrationStage;
  claim_level: PartnerManagedClaimLevel;
  verified_requirement_ids: PartnerWalletPolicyRequirementId[];
  partial_requirement_ids: PartnerWalletPolicyRequirementId[];
  missing_requirement_ids: PartnerWalletPolicyRequirementId[];
  next_requirement_ids: PartnerWalletPolicyRequirementId[];
  residual_risk_codes: string[];
  notes: string[];
};

export type PartnerManagedEvidencePack = {
  descriptor: PartnerManagedIntegrationDescriptor;
  policy: PartnerManagedWalletPolicySummary;
  assessment: PartnerManagedStageAssessment;
  readbacks: PartnerManagedReadbackSnapshot;
  receipts: PartnerManagedReceipt[];
  evidence_refs: string[];
  required_partner_inputs: PartnerWalletPolicyRequirementId[];
};

export type PartnerManagedDriftSignal = {
  signal_id: string;
  signal_code: string;
  severity: PartnerManagedDriftSeverity;
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  observed_at: string;
  affected_requirement_ids: PartnerWalletPolicyRequirementId[];
  summary: string;
  evidence_refs: string[];
  notes: string[];
};

export const zPartnerWalletPolicyRequirement = z.object({
  requirement_id: zPartnerWalletPolicyRequirementId,
  state: zPartnerWalletPolicyRequirementState,
  note: z.string().optional(),
});

export const zPartnerManagedWalletPolicySummary = z.object({
  control_surface_mode: z.literal("partner_managed_wallet_infra"),
  wallet_operator_model: zPartnerWalletOperatorModel,
  private_treasury_financing: zPrivateTreasuryFinancingState,
  repayment_enforcement_class: zPartnerManagedRepaymentEnforcementClass,
  requirements: z.array(zPartnerWalletPolicyRequirement),
  downgrade_if_missing: z.array(z.string()),
});

export const zPartnerManagedReadbackSource = z.object({
  source_id: z.string(),
  source_kind: zPartnerManagedReadbackSourceKind,
  observed_at: z.string(),
  freshness_seconds: z.number().nullable().optional(),
  proof_state: zProofState.optional(),
  notes: z.array(z.string()).optional(),
});

export const zPartnerManagedIntegrationDescriptor = z.object({
  partner_id: z.string(),
  display_name: z.string(),
  chain: zAttnChain,
  cluster: zSupportedCluster,
  control_surface_mode: z.literal("partner_managed_wallet_infra"),
  revenue_scope_model: zPartnerManagedRevenueScopeModel,
  revenue_scope_notes: z.array(z.string()),
  payout_topology_source: zPartnerManagedReadbackSource,
  debt_open_routing_source: zPartnerManagedReadbackSource,
  readback_support: z.object({
    payout_topology: z.boolean(),
    revenue_events: z.boolean(),
    debt_open_routing: z.boolean(),
    change_authority: z.boolean(),
    incident_state: z.boolean(),
    release_state: z.boolean(),
  }),
  incident_support: z.object({
    freeze_supported: z.boolean(),
    quarantine_supported: z.boolean(),
    session_revocation_supported: z.boolean(),
  }),
  release_support: z.object({
    release_mode_supported: z.boolean(),
    offboard_receipt_supported: z.boolean(),
  }),
  notes: z.array(z.string()),
});

export const zPartnerManagedPayoutTopologyReadback = z.object({
  source: zPartnerManagedReadbackSource,
  payout_mode: z.string(),
  recipient_wallets: z.array(z.string()),
  payout_edit_authority: z.string().nullable(),
  operator_model: zPartnerWalletOperatorModel,
  drift_detection_supported: z.boolean(),
  notes: z.array(z.string()),
});

export const zPartnerManagedDebtOpenRoutingReadback = z.object({
  source: zPartnerManagedReadbackSource,
  route_state: zPartnerManagedRoutingState,
  repayment_target: z.string().nullable(),
  release_target: z.string().nullable(),
  repayment_share_bps: z.number().nullable().optional(),
  unilateral_change_possible: z.union([z.boolean(), z.literal("unknown")]),
  notes: z.array(z.string()),
});

export const zPartnerManagedChangeAuthorityReadback = z.object({
  source: zPartnerManagedReadbackSource,
  authority_kind: zPartnerManagedChangeAuthorityKind,
  authority_ref: z.string().nullable(),
  change_receipts_supported: z.boolean(),
  notes: z.array(z.string()),
});

export const zPartnerManagedIncidentStateReadback = z.object({
  source: zPartnerManagedReadbackSource,
  incident_state: zPartnerManagedIncidentState,
  freeze_supported: z.boolean(),
  quarantine_supported: z.boolean(),
  session_revocation_supported: z.boolean(),
  notes: z.array(z.string()),
});

export const zPartnerManagedReadbackSnapshot = z.object({
  payout_topology: zPartnerManagedPayoutTopologyReadback.optional(),
  debt_open_routing: zPartnerManagedDebtOpenRoutingReadback.optional(),
  change_authority: zPartnerManagedChangeAuthorityReadback.optional(),
  incident_state: zPartnerManagedIncidentStateReadback.optional(),
});

export const zPartnerManagedBaseReceipt = z.object({
  receipt_id: z.string(),
  receipt_type: zPartnerManagedReceiptType,
  partner_id: z.string(),
  chain: zAttnChain,
  cluster: zSupportedCluster,
  proof_state: zProofState,
  source_timestamp: z.string(),
  received_at: z.string(),
  notes: z.array(z.string()),
});

export const zPartnerManagedPayoutTopologyReceipt = zPartnerManagedBaseReceipt.extend({
  receipt_type: z.literal("partner_managed_payout_topology_receipt"),
  payout_mode: z.string(),
  recipient_wallets: z.array(z.string()),
  payout_edit_authority: z.string().nullable(),
  operator_model: zPartnerWalletOperatorModel,
});

export const zPartnerManagedRevenueEventsReceipt = zPartnerManagedBaseReceipt.extend({
  receipt_type: z.literal("partner_managed_revenue_events_receipt"),
  revenue_unit: z.string(),
  event_count: z.number(),
  event_ids: z.array(z.string()),
});

export const zPartnerManagedDebtOpenRoutingReceipt = zPartnerManagedBaseReceipt.extend({
  receipt_type: z.literal("partner_managed_debt_open_routing_receipt"),
  route_state: zPartnerManagedRoutingState,
  repayment_target: z.string().nullable(),
  release_target: z.string().nullable(),
  repayment_share_bps: z.number().nullable().optional(),
});

export const zPartnerManagedChangeEventReceipt = zPartnerManagedBaseReceipt.extend({
  receipt_type: z.literal("partner_managed_change_event_receipt"),
  authority_kind: zPartnerManagedChangeAuthorityKind,
  authority_ref: z.string().nullable(),
  change_kind: z.string(),
  changed_by: z.string().nullable(),
});

export const zPartnerManagedReleaseOffboardReceipt = zPartnerManagedBaseReceipt.extend({
  receipt_type: z.literal("partner_managed_release_offboard_receipt"),
  release_target: z.string().nullable(),
  offboard_supported: z.boolean(),
});

export const zPartnerManagedIncidentStateReceipt = zPartnerManagedBaseReceipt.extend({
  receipt_type: z.literal("partner_managed_incident_state_receipt"),
  incident_state: zPartnerManagedIncidentState,
  freeze_supported: z.boolean(),
  quarantine_supported: z.boolean(),
  session_revocation_supported: z.boolean(),
});

export const zPartnerManagedReceipt = z.discriminatedUnion("receipt_type", [
  zPartnerManagedPayoutTopologyReceipt,
  zPartnerManagedRevenueEventsReceipt,
  zPartnerManagedDebtOpenRoutingReceipt,
  zPartnerManagedChangeEventReceipt,
  zPartnerManagedReleaseOffboardReceipt,
  zPartnerManagedIncidentStateReceipt,
]);

export const zPartnerManagedStageAssessment = z.object({
  stage: zPartnerManagedIntegrationStage,
  claim_level: zPartnerManagedClaimLevel,
  verified_requirement_ids: z.array(zPartnerWalletPolicyRequirementId),
  partial_requirement_ids: z.array(zPartnerWalletPolicyRequirementId),
  missing_requirement_ids: z.array(zPartnerWalletPolicyRequirementId),
  next_requirement_ids: z.array(zPartnerWalletPolicyRequirementId),
  residual_risk_codes: z.array(z.string()),
  notes: z.array(z.string()),
});

export const zPartnerManagedEvidencePack = z.object({
  descriptor: zPartnerManagedIntegrationDescriptor,
  policy: zPartnerManagedWalletPolicySummary,
  assessment: zPartnerManagedStageAssessment,
  readbacks: zPartnerManagedReadbackSnapshot,
  receipts: z.array(zPartnerManagedReceipt),
  evidence_refs: z.array(z.string()),
  required_partner_inputs: z.array(zPartnerWalletPolicyRequirementId),
});

export const zPartnerManagedDriftSignal = z.object({
  signal_id: z.string(),
  signal_code: z.string(),
  severity: zPartnerManagedDriftSeverity,
  partner_id: z.string(),
  chain: zAttnChain,
  cluster: zSupportedCluster,
  observed_at: z.string(),
  affected_requirement_ids: z.array(zPartnerWalletPolicyRequirementId),
  summary: z.string(),
  evidence_refs: z.array(z.string()),
  notes: z.array(z.string()),
});

export type PartnerCapabilitiesRequest = PartnerBaseRequest & {
  include_dependency_checks?: boolean;
};

export type PartnerStageStatusRequest = PartnerBaseRequest & {
  payload: Record<string, unknown>;
};

export type PartnerActionRequest = PartnerBaseRequest & {
  action: PartnerActionName;
  payload?: Record<string, unknown>;
  session_id?: string;
  session_token?: string;
  auth?: SessionAuthProof;
  mint?: string;
  borrower_wallet?: string;
  facility_pubkey?: string;
  window?: "30d" | "90d" | "all";
  target_wallet?: string;
  tx_signatures?: string[];
  mints?: string[];
};

export type PartnerActionContextRequest = Omit<PartnerActionRequest, "action">;

export type PartnerActionCapability = {
  state: PartnerCapabilityState;
  execution_mode: PartnerExecutionMode;
  context_requirements: string[];
  blockers: string[];
  next_actions: string[];
};

export type SettlementCoreRoute = {
  route_id: string;
  route_scope: SettlementRouteScope;
  chain: AttnChain;
  cluster: SupportedCluster;
  preset_id: string;
  creator_ingress_mode: CreatorIngressMode;
  control_profile_id: ControlProfileId | "unknown";
  route_state: SettlementRouteState;
  target_owner_mode: SettlementTargetOwnerMode;
  source_model: SettlementSourceModel;
  notes: string[];
};

export type SettlementLedgerAccount = {
  account_id: string;
  account_scope: SettlementLedgerAccountScope;
  ledger_state: SettlementLedgerState;
  source_model: SettlementSourceModel;
  chain: AttnChain;
  subject_ref: string;
  session_id?: string;
  facility_pubkey?: string;
  borrower_wallet?: string;
  credit_open: boolean;
  notes: string[];
};

export type SettlementPolicy = {
  policy_id: string;
  policy_mode: SettlementPolicyMode;
  service_state: SettlementServiceState;
  waterfall_state: SettlementWaterfallState;
  pass_through_state: SettlementPassThroughState;
  default_after_close: "pass_through";
  active_service_modules: string[];
  source_model: SettlementSourceModel;
  notes: string[];
};

export type SettlementServiceModule = {
  module_id: string;
  module_type: SettlementServiceModuleType;
  module_status: SettlementServiceModuleStatus;
  service_state: SettlementServiceState;
  notes: string[];
};

export type SettlementProjectionReceipt = {
  receipt_type: "attn_settlement_projection_receipt";
  receipt_id: string;
  request_id?: string;
  kind: SettlementReceiptKind;
  state: SettlementReceiptState;
  chain: AttnChain;
  cluster: SupportedCluster;
  action?: PartnerActionName;
  source_model: SettlementSourceModel;
  route_id: string;
  account_id: string;
  policy_id: string;
  tx_ids: string[];
  credit_open: boolean;
  repay_complete: boolean;
  offboard_recorded: boolean;
  notes: string[];
};

export type SettlementCoreSummary = {
  route_state: SettlementRouteState;
  service_state: SettlementServiceState;
  waterfall_state: SettlementWaterfallState;
  ledger_state: SettlementLedgerState;
  pass_through_state: SettlementPassThroughState;
  active_service_modules: string[];
  notes: string[];
  route?: SettlementCoreRoute;
  ledger_account?: SettlementLedgerAccount;
  policy?: SettlementPolicy;
  service_modules?: SettlementServiceModule[];
  latest_receipt?: SettlementProjectionReceipt;
};

export type PartnerApiResponse = {
  ok: boolean;
  receipt_type: PartnerReceiptType;
  request_id: string;
  chain?: AttnChain;
  cluster?: SupportedCluster;
  proof_state?: ProofState;
  public_claim_state?: PublicClaimState;
  state?: string;
  blockers?: string[];
  blocker_codes?: string[];
  next_actions?: string[];
  settlement_core?: SettlementCoreSummary;
  [key: string]: unknown;
};

export type PartnerCapabilitiesResponse = PartnerApiResponse & {
  receipt_type: typeof PARTNER_CAPABILITIES_RECEIPT_TYPE;
  actions: Record<PartnerActionName, PartnerActionCapability>;
};

export type PartnerStageStatusResponse = PartnerApiResponse & {
  receipt_type: typeof PARTNER_STAGE_STATUS_RECEIPT_TYPE;
  control_plane?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type PartnerActionResponse = PartnerApiResponse & {
  receipt_type: typeof PARTNER_ACTION_RECEIPT_TYPE;
  action: PartnerActionName;
  sdk_stage?: PartnerSdkStage;
  agent_tool_mode?: PartnerAgentToolMode;
  agent_lane_state?: PartnerAgentLaneState;
  dependency_health?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type PartnerCatalogRequest = Partial<PartnerBaseRequest> & {
  include_closure_truth?: boolean;
};

export type PartnerCatalogRouteDefinition = {
  route_id: string;
  method: PartnerCatalogRouteMethod;
  path: string;
  category: PartnerCatalogRouteCategory;
  description: string;
  human_gate: "none" | "session_context" | "operator_token";
  request_template?: Record<string, unknown>;
};

export type PartnerCatalogPrimaryLaneReadinessState =
  | "migration_required"
  | "blocked_non_sol_dependency"
  | "proof_only"
  | "live";
export type PartnerCatalogPublicMarketReadinessState =
  | "blocked_primary_lane"
  | "blocked_pool_capital"
  | "blocked_borrower_proof"
  | "blocked_operator_visibility"
  | "live";
export type PartnerCatalogLiveClaimScope = "none" | "callable_fallback_only" | "literal_sol_only" | "primary_lane";

export type PartnerCatalogClosureEvidenceInventorySummary = {
  evidence_count: number;
  retained_evidence_count: number;
  open_incident_count: number;
  latest_evidence_captured_at: string | null;
  release_rollback_count?: number;
  vendor_dependency_count?: number;
  drilled_incident_chain_count?: number;
  release_approval_state?: string;
  vendor_inventory_state?: string;
  rollback_state?: string;
  incident_response_state?: string;
  protected_endpoint_inventory_state?: string;
  targeted_intrusion_evidence_state?: string;
  endpoint_quarantine_state?: string;
  targeted_intrusion_signal_codes?: string[];
};

export type PartnerCatalogClosureSafeSignerReviewSummary = {
  review_count: number;
  approved_review_count: number;
  latest_change_review_state: string | null;
  latest_change_class?: string | null;
  latest_review_verdict?: string | null;
  latest_review_timing?: string | null;
  latest_simulation_state?: string | null;
  has_post_change_verifier_receipt: boolean;
  post_change_verifier_confirmed: boolean;
};

export type PartnerCatalogClosureOperatorVisibilitySummary = {
  surface_state: string;
  alert_chain_state: string;
  receipt_chain?: {
    transport_status: string;
    degraded_reasons: string[];
    acknowledgement?: {
      state: string;
      acknowledged_at?: string | null;
      acknowledged_by?: string | null;
      receipt_id?: string | null;
    } | null;
    escalation?: {
      state: string;
      escalated_at?: string | null;
      escalated_by?: string | null;
      target?: string | null;
      receipt_id?: string | null;
    } | null;
    servicing_linkage?: {
      state: string;
      servicing_case_id?: string | null;
      linked_at?: string | null;
      linked_by?: string | null;
      receipt_id?: string | null;
    } | null;
  } | null;
  direct_control_audit_state: string;
  direct_control_audit_missing_routes: string[];
  delivery_state: string;
  acknowledgement_state: string;
};

export type PartnerCatalogClosureProofContractSummary = {
  safe_signer_review_summary?: PartnerCatalogClosureSafeSignerReviewSummary | null;
  evidence_inventory_summary: PartnerCatalogClosureEvidenceInventorySummary;
  operator_visibility_summary?: PartnerCatalogClosureOperatorVisibilitySummary | null;
};

export type PartnerCatalogDashboardSpeedSummary = {
  supplied: boolean;
  borrower_measured_receipt_count: number;
  lender_measured_receipt_count: number;
  borrower_blockers: string[];
  lender_blockers: string[];
};

export type PartnerCatalogClosureHostedState = {
  storage_mode: "filesystem" | "database";
  datasource_env_state: "configured" | "missing" | "not_required";
  durable_state_backend: "filesystem_json" | "shared_system_kv";
  persistence_topology: "filesystem_only" | "mixed_persistence";
  runtime_fallback_state: "filesystem_active" | "fail_closed";
};

export type PartnerCatalogFirstPrivateLaneSemantics = {
  lane_status:
    | "internally_implemented_only"
    | "self_funded_pilot_proof_backed"
    | "independent_external_lender_validated";
  capital_source_label:
    | "unknown"
    | "operator_managed_partner_pool"
    | "operator_treasury_wallet"
    | "external_lender_warehouse_spv"
    | "capital_source_mismatch";
  lender_demand_proof_state: string;
  proof_scope:
    | "implementation_and_internal_receipts_only"
    | "self_funded_pilot_proof_only"
    | "independent_external_lender_validated";
  roadmap_closure_semantics:
    | "not_closed"
    | "closes_self_funded_first_lane_only"
    | "closes_with_independent_external_lender_validation";
  stage_status_headline: string;
  stage_status_summary: string;
};

export type PartnerCatalogPilotPathTruthSummary = {
  fastest_path: "self_funded_private_pilot";
  repo_truth_state: "code_shipped_internal_only";
  self_funded_private_pilot_gap_codes: string[];
  post_self_funded_pilot_gap_codes: string[];
  post_self_funded_pilot_blocked_claim_codes: string[];
};

export type PartnerCatalogPrivateParityHeadlineSummary = {
  private_operator_evm_safe: string | null;
  private_borrower_evm_safe: string | null;
  private_lender_evm_safe: string | null;
};

export type PartnerCatalogPrivateParityReceipt = {
  source: "provided_receipt" | "local_command";
  receipt_path: string | null;
  ok: boolean;
  first_lane_status_headlines: PartnerCatalogPrivateParityHeadlineSummary;
};

export type PartnerCatalogClosureProofArtifact = {
  label: string;
  description: string | null;
  base_url: string | null;
  artifact_path?: string | null;
  passed: boolean | null;
  skipped: boolean | null;
};

export type PartnerCatalogCurrentTruth = {
  can_agent_discover_lane_now: boolean;
  can_agent_start_onboarding_now: boolean;
  can_agent_complete_primary_lane_now: boolean;
  can_agent_complete_real_credit_now: boolean;
  can_agent_complete_public_market_now: boolean;
  primary_lane_readiness_state: PartnerCatalogPrimaryLaneReadinessState;
  primary_lane_blockers: string[];
  public_market_readiness_state: PartnerCatalogPublicMarketReadinessState;
  public_market_blockers: string[];
  real_credit_blockers: string[];
  live_claim_scope: PartnerCatalogLiveClaimScope;
  closure_summary_path: string | null;
  proof_contract_summary: PartnerCatalogClosureProofContractSummary | null;
  first_private_lane_semantics?: PartnerCatalogFirstPrivateLaneSemantics | null;
  pilot_path_truth?: PartnerCatalogPilotPathTruthSummary | null;
  private_parity_receipt?: PartnerCatalogPrivateParityReceipt | null;
  closure_hosted_state?: PartnerCatalogClosureHostedState | null;
  proof_contract_summary_source?: string | null;
  closure_proofs?: PartnerCatalogClosureProofArtifact[];
  dashboard_speed?: PartnerCatalogDashboardSpeedSummary | null;
  closure_pack_artifacts?: {
    manifest_path: string | null;
    index_path: string | null;
    verifier_path?: string | null;
    human_intake_checklist_ref?: string | null;
    targeted_intrusion_working_pack_ref?: string | null;
  } | null;
  mcp_transport_state: PartnerCatalogMcpState;
  agent_operability_state: PartnerCatalogOperabilityState;
  recommended_package: string;
  recommended_wrapper: string;
  skill_surface_path: string;
  runbook_surface_path: string;
};

export type PartnerCatalogLane = {
  lane_id: string;
  title: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  preset_id: string;
  creator_ingress_mode: CreatorIngressMode;
  control_profile_id: ControlProfileId;
  capital_source: string;
  funding_mode: string;
  production_truth: string;
  lane_contract_state: string;
  revenue_source: string;
  revenue_unit: string;
  repayment_source: string;
  primary_debt_unit: string;
  current_callable_debt_unit: string;
  primary_lane_contract: string;
  current_callable_lane_contract: string;
  coexistence_state: string;
  proof_state: ProofState;
  public_claim_state: PublicClaimState;
  blockers: string[];
  blocker_codes: string[];
  next_actions: string[];
  notes: string[];
};

export type PartnerCatalogResponse = {
  ok: true;
  catalog_version: "v1";
  lane: PartnerCatalogLane;
  current_truth: PartnerCatalogCurrentTruth;
  action_order: PartnerActionName[];
  routes: PartnerCatalogRouteDefinition[];
};

export function inferChainFromPresetId(presetId: string): AttnChain | null {
  const normalized = presetId.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("solana_")) return "solana";
  if (normalized.startsWith("evm_")) return "evm";
  return null;
}

export function withPartnerDefaults<T extends PartnerBaseRequest>(
  value: T,
  defaults: Required<Pick<PartnerBaseRequest, "chain" | "cluster" | "creator_ingress_mode" | "control_profile_id">> = SDK_CLIENT_DEFAULTS,
): T & Required<Pick<PartnerBaseRequest, "chain" | "cluster" | "creator_ingress_mode" | "control_profile_id">> {
  const inferredChain = value.chain ?? inferChainFromPresetId(value.preset_id) ?? defaults.chain;
  return {
    ...defaults,
    ...value,
    chain: inferredChain,
  };
}

export function partnerReceiptTypeForRoute(route: PartnerReceiptRoute): PartnerReceiptType {
  switch (route) {
    case "capabilities":
      return PARTNER_CAPABILITIES_RECEIPT_TYPE;
    case "stage_status":
      return PARTNER_STAGE_STATUS_RECEIPT_TYPE;
    case "action":
      return PARTNER_ACTION_RECEIPT_TYPE;
  }
}

const PARTNER_MANAGED_STAGE_1_REQUIREMENT_IDS: PartnerWalletPolicyRequirementId[] = [
  "authoritative_revenue_source_attribution",
  "authoritative_revenue_scope_mapping",
  "authoritative_wallet_topology",
];

const PARTNER_MANAGED_STAGE_2_REQUIREMENT_IDS: PartnerWalletPolicyRequirementId[] = [
  "authoritative_payout_state",
  "authoritative_revenue_event_feed",
  "repayment_target_invariant",
  "attn_readback_and_audit_receipts",
];

const PARTNER_MANAGED_STAGE_3_REQUIREMENT_IDS: PartnerWalletPolicyRequirementId[] = [
  "payout_edit_authority_separation",
  "debt_open_change_control",
  "release_and_offboard_semantics",
  "private_treasury_funding_receipts",
  "incident_freeze_and_quarantine",
];

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function uniqueRequirementIds(
  values: ReadonlyArray<PartnerWalletPolicyRequirementId>,
): PartnerWalletPolicyRequirementId[] {
  return Array.from(new Set(values));
}

function partnerPolicyStateRank(state: PartnerWalletPolicyRequirementState): number {
  switch (state) {
    case "missing":
      return 0;
    case "partial":
      return 1;
    case "verified":
      return 2;
  }
}

function mapPartnerRequirementStates(
  summary: PartnerManagedWalletPolicySummary,
): Record<PartnerWalletPolicyRequirementId, PartnerWalletPolicyRequirementState> {
  const stateByRequirementId = Object.fromEntries(
    PARTNER_WALLET_POLICY_REQUIREMENT_IDS.map((requirementId) => [requirementId, "missing"]),
  ) as Record<PartnerWalletPolicyRequirementId, PartnerWalletPolicyRequirementState>;

  for (const requirement of summary.requirements) {
    stateByRequirementId[requirement.requirement_id] = requirement.state;
  }

  return stateByRequirementId;
}

function requirementMeetsMinimum(
  stateByRequirementId: Record<
    PartnerWalletPolicyRequirementId,
    PartnerWalletPolicyRequirementState
  >,
  requirementId: PartnerWalletPolicyRequirementId,
  minimumState: PartnerWalletPolicyRequirementState,
): boolean {
  return (
    partnerPolicyStateRank(stateByRequirementId[requirementId]) >=
    partnerPolicyStateRank(minimumState)
  );
}

function missingOrPartialRequirementIds(
  stateByRequirementId: Record<
    PartnerWalletPolicyRequirementId,
    PartnerWalletPolicyRequirementState
  >,
  requirementIds: ReadonlyArray<PartnerWalletPolicyRequirementId>,
): PartnerWalletPolicyRequirementId[] {
  return requirementIds.filter(
    (requirementId) => stateByRequirementId[requirementId] !== "verified",
  );
}

function defaultPartnerManagedNotes(
  stage: PartnerManagedIntegrationStage,
  claimLevel: PartnerManagedClaimLevel,
): string[] {
  const notes = [
    "SDK-standardized receipts and readbacks do not remove real counterparty or payout-control risk by themselves.",
  ];

  switch (stage) {
    case "stage_0_truth_discovery":
      notes.push(
        "Keep the lane in truth-discovery until revenue-source attribution, revenue scope, and wallet topology are at least partially supplied.",
      );
      break;
    case "stage_1_platform_counterparty_mvp":
      notes.push(
        "The platform can be evaluated as the operating counterparty, but borrower-level repayment control is not yet established.",
      );
      break;
    case "stage_2_observable_payout_path_mvp":
      notes.push(
        "Repayment-relevant routing is observable enough for underwriting discussion, but payout policy is not yet strongly bounded.",
      );
      break;
    case "stage_3_policy_bounded_first_pilot":
      notes.push(
        "One bounded first pilot can be reviewed with real control, readback, and incident posture, but the lane is not public-live by default.",
      );
      break;
    case "stage_4_full_partner_managed_standard":
      notes.push(
        "The partner-managed lane satisfies the full stricter control standard, but broader public or open-lender readiness still needs separate proof.",
      );
      break;
  }

  if (claimLevel === "compatibility_only") {
    notes.push("Do not claim financing readiness or Swig-equivalent control from this package.");
  }

  return notes;
}

function defaultPartnerManagedReceiptId(args: {
  partner_id: string;
  receipt_type: PartnerManagedReceiptType;
  source_timestamp: string;
}): string {
  return `${args.partner_id}_${args.receipt_type}_${args.source_timestamp}`.replace(
    /[^a-zA-Z0-9_]+/g,
    "_",
  );
}

function buildPartnerManagedBaseReceipt(args: {
  receipt_type: PartnerManagedReceiptType;
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  source_timestamp: string;
  received_at?: string;
  proof_state?: ProofState;
  notes?: string[];
  receipt_id?: string;
}): PartnerManagedBaseReceipt {
  return {
    receipt_id:
      args.receipt_id ??
      defaultPartnerManagedReceiptId({
        partner_id: args.partner_id,
        receipt_type: args.receipt_type,
        source_timestamp: args.source_timestamp,
      }),
    receipt_type: args.receipt_type,
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    proof_state: args.proof_state ?? "spec_only",
    source_timestamp: args.source_timestamp,
    received_at: args.received_at ?? args.source_timestamp,
    notes: args.notes ?? [],
  };
}

export function createPartnerManagedWalletPolicyTemplate(args: {
  wallet_operator_model?: PartnerWalletOperatorModel;
  private_treasury_financing?: Exclude<PrivateTreasuryFinancingState, "not_financed">;
  repayment_enforcement_class?: PartnerManagedRepaymentEnforcementClass;
  stateByRequirementId?: Partial<
    Record<PartnerWalletPolicyRequirementId, PartnerWalletPolicyRequirementState>
  >;
  noteByRequirementId?: Partial<Record<PartnerWalletPolicyRequirementId, string>>;
  downgrade_if_missing?: string[];
} = {}): PartnerManagedWalletPolicySummary {
  const requirements: PartnerWalletPolicyRequirement[] =
    PARTNER_WALLET_POLICY_REQUIREMENT_IDS.map((requirement_id) => ({
      requirement_id,
      state: args.stateByRequirementId?.[requirement_id] ?? "missing",
      ...(args.noteByRequirementId?.[requirement_id]
        ? { note: args.noteByRequirementId[requirement_id] }
        : {}),
    }));

  return {
    control_surface_mode: "partner_managed_wallet_infra",
    wallet_operator_model: args.wallet_operator_model ?? "unknown",
    private_treasury_financing:
      args.private_treasury_financing ?? "manual_operator_release",
    repayment_enforcement_class:
      args.repayment_enforcement_class ?? "partner_policy_plus_attn_verifier",
    requirements,
    downgrade_if_missing:
      args.downgrade_if_missing ?? [
        "keep the lane compatibility_only or underwriting_compatible",
        "do not claim Swig-equivalent control",
        "keep the first lane private-treasury and operator-gated",
        "do not claim public or prod readiness",
      ],
  };
}

export function createPartnerManagedIntegrationDescriptor(args: {
  partner_id: string;
  display_name: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  revenue_scope_model: PartnerManagedRevenueScopeModel;
  payout_topology_source: PartnerManagedReadbackSource;
  debt_open_routing_source: PartnerManagedReadbackSource;
  readback_support?: Partial<PartnerManagedIntegrationDescriptor["readback_support"]>;
  incident_support?: Partial<PartnerManagedIntegrationDescriptor["incident_support"]>;
  release_support?: Partial<PartnerManagedIntegrationDescriptor["release_support"]>;
  revenue_scope_notes?: string[];
  notes?: string[];
}): PartnerManagedIntegrationDescriptor {
  return {
    partner_id: args.partner_id,
    display_name: args.display_name,
    chain: args.chain,
    cluster: args.cluster,
    control_surface_mode: "partner_managed_wallet_infra",
    revenue_scope_model: args.revenue_scope_model,
    revenue_scope_notes: args.revenue_scope_notes ?? [],
    payout_topology_source: args.payout_topology_source,
    debt_open_routing_source: args.debt_open_routing_source,
    readback_support: {
      payout_topology: false,
      revenue_events: false,
      debt_open_routing: false,
      change_authority: false,
      incident_state: false,
      release_state: false,
      ...(args.readback_support ?? {}),
    },
    incident_support: {
      freeze_supported: false,
      quarantine_supported: false,
      session_revocation_supported: false,
      ...(args.incident_support ?? {}),
    },
    release_support: {
      release_mode_supported: false,
      offboard_receipt_supported: false,
      ...(args.release_support ?? {}),
    },
    notes: args.notes ?? [],
  };
}

export function classifyPartnerManagedLane(args: {
  policy: PartnerManagedWalletPolicySummary;
}): PartnerManagedStageAssessment {
  const stateByRequirementId = mapPartnerRequirementStates(args.policy);

  const verifiedRequirementIds = PARTNER_WALLET_POLICY_REQUIREMENT_IDS.filter(
    (requirementId) => stateByRequirementId[requirementId] === "verified",
  );
  const partialRequirementIds = PARTNER_WALLET_POLICY_REQUIREMENT_IDS.filter(
    (requirementId) => stateByRequirementId[requirementId] === "partial",
  );
  const missingRequirementIds = PARTNER_WALLET_POLICY_REQUIREMENT_IDS.filter(
    (requirementId) => stateByRequirementId[requirementId] === "missing",
  );

  const reachedStage1 = PARTNER_MANAGED_STAGE_1_REQUIREMENT_IDS.every((requirementId) =>
    requirementMeetsMinimum(stateByRequirementId, requirementId, "partial"),
  );
  const reachedStage2 =
    reachedStage1 &&
    PARTNER_MANAGED_STAGE_2_REQUIREMENT_IDS.every((requirementId) =>
      requirementMeetsMinimum(stateByRequirementId, requirementId, "partial"),
    );
  const reachedStage3 =
    reachedStage2 &&
    PARTNER_MANAGED_STAGE_3_REQUIREMENT_IDS.every((requirementId) =>
      requirementMeetsMinimum(stateByRequirementId, requirementId, "partial"),
    );
  const reachedStage4 = PARTNER_WALLET_POLICY_REQUIREMENT_IDS.every(
    (requirementId) => stateByRequirementId[requirementId] === "verified",
  );

  let stage: PartnerManagedIntegrationStage = "stage_0_truth_discovery";
  let claimLevel: PartnerManagedClaimLevel = "compatibility_only";

  if (reachedStage1) {
    stage = "stage_1_platform_counterparty_mvp";
  }
  if (reachedStage2) {
    stage = "stage_2_observable_payout_path_mvp";
    claimLevel = "underwriting_compatible";
  }
  if (reachedStage3) {
    stage = "stage_3_policy_bounded_first_pilot";
    claimLevel = "repayment_control_compatible";
  }
  if (reachedStage4) {
    stage = "stage_4_full_partner_managed_standard";
    claimLevel = "swig_equivalent_partner_control_compatible";
  }

  let nextRequirementIds: PartnerWalletPolicyRequirementId[] = [];
  switch (stage) {
    case "stage_0_truth_discovery":
      nextRequirementIds = missingOrPartialRequirementIds(
        stateByRequirementId,
        PARTNER_MANAGED_STAGE_1_REQUIREMENT_IDS,
      );
      break;
    case "stage_1_platform_counterparty_mvp":
      nextRequirementIds = missingOrPartialRequirementIds(
        stateByRequirementId,
        PARTNER_MANAGED_STAGE_2_REQUIREMENT_IDS,
      );
      break;
    case "stage_2_observable_payout_path_mvp":
      nextRequirementIds = missingOrPartialRequirementIds(
        stateByRequirementId,
        PARTNER_MANAGED_STAGE_3_REQUIREMENT_IDS,
      );
      break;
    case "stage_3_policy_bounded_first_pilot":
      nextRequirementIds = missingOrPartialRequirementIds(
        stateByRequirementId,
        PARTNER_WALLET_POLICY_REQUIREMENT_IDS,
      );
      break;
    case "stage_4_full_partner_managed_standard":
      nextRequirementIds = [];
      break;
  }

  const residualRiskCodes = uniqueStrings([
    ...missingRequirementIds.map((requirementId) => `${requirementId}_missing`),
    ...partialRequirementIds.map((requirementId) => `${requirementId}_partial`),
  ]);

  return {
    stage,
    claim_level: claimLevel,
    verified_requirement_ids: verifiedRequirementIds,
    partial_requirement_ids: partialRequirementIds,
    missing_requirement_ids: missingRequirementIds,
    next_requirement_ids: uniqueRequirementIds(nextRequirementIds),
    residual_risk_codes: residualRiskCodes,
    notes: defaultPartnerManagedNotes(stage, claimLevel),
  };
}

export function createPartnerManagedPayoutTopologyReceipt(args: {
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  source_timestamp: string;
  payout_mode: string;
  recipient_wallets: string[];
  payout_edit_authority?: string | null;
  operator_model?: PartnerWalletOperatorModel;
  proof_state?: ProofState;
  notes?: string[];
  receipt_id?: string;
  received_at?: string;
}): PartnerManagedPayoutTopologyReceipt {
  const base = buildPartnerManagedBaseReceipt({
    receipt_type: "partner_managed_payout_topology_receipt",
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    source_timestamp: args.source_timestamp,
    received_at: args.received_at,
    proof_state: args.proof_state,
    notes: args.notes,
    receipt_id: args.receipt_id,
  });

  return {
    ...base,
    receipt_type: "partner_managed_payout_topology_receipt",
    payout_mode: args.payout_mode,
    recipient_wallets: args.recipient_wallets,
    payout_edit_authority: args.payout_edit_authority ?? null,
    operator_model: args.operator_model ?? "unknown",
  };
}

export function createPartnerManagedRevenueEventsReceipt(args: {
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  source_timestamp: string;
  revenue_unit: string;
  event_count: number;
  event_ids?: string[];
  proof_state?: ProofState;
  notes?: string[];
  receipt_id?: string;
  received_at?: string;
}): PartnerManagedRevenueEventsReceipt {
  const base = buildPartnerManagedBaseReceipt({
    receipt_type: "partner_managed_revenue_events_receipt",
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    source_timestamp: args.source_timestamp,
    received_at: args.received_at,
    proof_state: args.proof_state,
    notes: args.notes,
    receipt_id: args.receipt_id,
  });

  return {
    ...base,
    receipt_type: "partner_managed_revenue_events_receipt",
    revenue_unit: args.revenue_unit,
    event_count: args.event_count,
    event_ids: args.event_ids ?? [],
  };
}

export function createPartnerManagedDebtOpenRoutingReceipt(args: {
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  source_timestamp: string;
  route_state: PartnerManagedRoutingState;
  repayment_target?: string | null;
  release_target?: string | null;
  repayment_share_bps?: number | null;
  proof_state?: ProofState;
  notes?: string[];
  receipt_id?: string;
  received_at?: string;
}): PartnerManagedDebtOpenRoutingReceipt {
  const base = buildPartnerManagedBaseReceipt({
    receipt_type: "partner_managed_debt_open_routing_receipt",
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    source_timestamp: args.source_timestamp,
    received_at: args.received_at,
    proof_state: args.proof_state,
    notes: args.notes,
    receipt_id: args.receipt_id,
  });

  return {
    ...base,
    receipt_type: "partner_managed_debt_open_routing_receipt",
    route_state: args.route_state,
    repayment_target: args.repayment_target ?? null,
    release_target: args.release_target ?? null,
    repayment_share_bps: args.repayment_share_bps ?? null,
  };
}

export function createPartnerManagedChangeEventReceipt(args: {
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  source_timestamp: string;
  authority_kind: PartnerManagedChangeAuthorityKind;
  authority_ref?: string | null;
  change_kind: string;
  changed_by?: string | null;
  proof_state?: ProofState;
  notes?: string[];
  receipt_id?: string;
  received_at?: string;
}): PartnerManagedChangeEventReceipt {
  const base = buildPartnerManagedBaseReceipt({
    receipt_type: "partner_managed_change_event_receipt",
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    source_timestamp: args.source_timestamp,
    received_at: args.received_at,
    proof_state: args.proof_state,
    notes: args.notes,
    receipt_id: args.receipt_id,
  });

  return {
    ...base,
    receipt_type: "partner_managed_change_event_receipt",
    authority_kind: args.authority_kind,
    authority_ref: args.authority_ref ?? null,
    change_kind: args.change_kind,
    changed_by: args.changed_by ?? null,
  };
}

export function createPartnerManagedReleaseOffboardReceipt(args: {
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  source_timestamp: string;
  release_target?: string | null;
  offboard_supported?: boolean;
  proof_state?: ProofState;
  notes?: string[];
  receipt_id?: string;
  received_at?: string;
}): PartnerManagedReleaseOffboardReceipt {
  const base = buildPartnerManagedBaseReceipt({
    receipt_type: "partner_managed_release_offboard_receipt",
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    source_timestamp: args.source_timestamp,
    received_at: args.received_at,
    proof_state: args.proof_state,
    notes: args.notes,
    receipt_id: args.receipt_id,
  });

  return {
    ...base,
    receipt_type: "partner_managed_release_offboard_receipt",
    release_target: args.release_target ?? null,
    offboard_supported: args.offboard_supported ?? false,
  };
}

export function createPartnerManagedIncidentStateReceipt(args: {
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  source_timestamp: string;
  incident_state: PartnerManagedIncidentState;
  freeze_supported?: boolean;
  quarantine_supported?: boolean;
  session_revocation_supported?: boolean;
  proof_state?: ProofState;
  notes?: string[];
  receipt_id?: string;
  received_at?: string;
}): PartnerManagedIncidentStateReceipt {
  const base = buildPartnerManagedBaseReceipt({
    receipt_type: "partner_managed_incident_state_receipt",
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    source_timestamp: args.source_timestamp,
    received_at: args.received_at,
    proof_state: args.proof_state,
    notes: args.notes,
    receipt_id: args.receipt_id,
  });

  return {
    ...base,
    receipt_type: "partner_managed_incident_state_receipt",
    incident_state: args.incident_state,
    freeze_supported: args.freeze_supported ?? false,
    quarantine_supported: args.quarantine_supported ?? false,
    session_revocation_supported: args.session_revocation_supported ?? false,
  };
}

export function createPartnerManagedEvidencePack(args: {
  descriptor: PartnerManagedIntegrationDescriptor;
  policy: PartnerManagedWalletPolicySummary;
  readbacks?: PartnerManagedReadbackSnapshot;
  receipts?: PartnerManagedReceipt[];
  evidence_refs?: string[];
  assessment?: PartnerManagedStageAssessment;
}): PartnerManagedEvidencePack {
  const assessment = args.assessment ?? classifyPartnerManagedLane({ policy: args.policy });
  const residualRiskCodes = uniqueStrings([
    ...assessment.residual_risk_codes,
    ...(args.descriptor.readback_support.payout_topology
      ? []
      : ["payout_topology_readback_missing"]),
    ...(args.descriptor.readback_support.debt_open_routing
      ? []
      : ["debt_open_routing_readback_missing"]),
    ...(args.descriptor.readback_support.change_authority
      ? []
      : ["change_authority_readback_missing"]),
    ...(args.descriptor.readback_support.incident_state
      ? []
      : ["incident_state_readback_missing"]),
    ...(args.descriptor.readback_support.release_state
      ? []
      : ["release_state_readback_missing"]),
    ...(args.descriptor.incident_support.freeze_supported ? [] : ["freeze_support_missing"]),
    ...(args.descriptor.release_support.release_mode_supported
      ? []
      : ["release_mode_support_missing"]),
    ...(args.readbacks?.payout_topology || !args.descriptor.readback_support.payout_topology
      ? []
      : ["payout_topology_snapshot_missing"]),
    ...(args.readbacks?.debt_open_routing || !args.descriptor.readback_support.debt_open_routing
      ? []
      : ["debt_open_routing_snapshot_missing"]),
  ]);

  return {
    descriptor: args.descriptor,
    policy: args.policy,
    assessment: {
      ...assessment,
      residual_risk_codes: residualRiskCodes,
    },
    readbacks: args.readbacks ?? {},
    receipts: args.receipts ?? [],
    evidence_refs: args.evidence_refs ?? [],
    required_partner_inputs: assessment.next_requirement_ids,
  };
}

export function createPartnerManagedDriftSignal(args: {
  partner_id: string;
  chain: AttnChain;
  cluster: SupportedCluster;
  signal_code: string;
  summary: string;
  affected_requirement_ids: PartnerWalletPolicyRequirementId[];
  evidence_refs?: string[];
  notes?: string[];
  severity?: PartnerManagedDriftSeverity;
  observed_at?: string;
  signal_id?: string;
}): PartnerManagedDriftSignal {
  const observedAt = args.observed_at ?? new Date().toISOString();
  return {
    signal_id:
      args.signal_id ??
      `${args.partner_id}_${args.signal_code}_${observedAt}`.replace(
        /[^a-zA-Z0-9_]+/g,
        "_",
      ),
    signal_code: args.signal_code,
    severity: args.severity ?? "warn",
    partner_id: args.partner_id,
    chain: args.chain,
    cluster: args.cluster,
    observed_at: observedAt,
    affected_requirement_ids: uniqueRequirementIds(args.affected_requirement_ids),
    summary: args.summary,
    evidence_refs: args.evidence_refs ?? [],
    notes: args.notes ?? [],
  };
}

export function parsePartnerManagedWalletPolicySummary(
  value: unknown,
): PartnerManagedWalletPolicySummary {
  return zPartnerManagedWalletPolicySummary.parse(value);
}

export function parsePartnerManagedIntegrationDescriptor(
  value: unknown,
): PartnerManagedIntegrationDescriptor {
  return zPartnerManagedIntegrationDescriptor.parse(value);
}

export function parsePartnerManagedEvidencePack(value: unknown): PartnerManagedEvidencePack {
  return zPartnerManagedEvidencePack.parse(value);
}

export function parsePartnerManagedDriftSignal(value: unknown): PartnerManagedDriftSignal {
  return zPartnerManagedDriftSignal.parse(value);
}
