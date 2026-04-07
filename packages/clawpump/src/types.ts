export const CLAWPUMP_CLUSTERS = ["mainnet-beta", "devnet"] as const;
export type ClawPumpCluster = (typeof CLAWPUMP_CLUSTERS)[number];

export const CLAWPUMP_PAYOUT_MODES = ["claim_and_stream", "direct_fee_recipient", "hybrid", "unknown"] as const;
export type ClawPumpPayoutMode = (typeof CLAWPUMP_PAYOUT_MODES)[number];

export const CLAWPUMP_CONTROL_MODELS = ["platform_owned", "borrower_owned", "delegatable", "unknown"] as const;
export type ClawPumpControlModel = (typeof CLAWPUMP_CONTROL_MODELS)[number];

export const CLAWPUMP_REVENUE_EVENT_TYPES = [
  "creator_fee_accrued",
  "creator_fee_claimed",
  "creator_fee_distributed",
  "recipient_changed",
] as const;
export type ClawPumpRevenueEventType = (typeof CLAWPUMP_REVENUE_EVENT_TYPES)[number];

export const CLAWPUMP_MODE_STATES = ["active", "cleared", "unsupported", "pending_manual"] as const;
export type ClawPumpModeState = (typeof CLAWPUMP_MODE_STATES)[number];

export const CLAWPUMP_PROOF_STATES = [
  "spec_only",
  "fixture_proven",
  "backend_readonly_proven",
  "repayment_mode_proven",
  "blocked_partner_access",
  "blocked_partner_capability",
] as const;
export type ClawPumpProofState = (typeof CLAWPUMP_PROOF_STATES)[number];

export const CLAWPUMP_RECEIPT_TYPES = [
  "clawpump_launch_receipt",
  "clawpump_payout_topology_receipt",
  "clawpump_creator_fee_state_receipt",
  "clawpump_revenue_events_receipt",
  "clawpump_repayment_mode_receipt",
  "clawpump_release_mode_receipt",
] as const;
export type ClawPumpReceiptType = (typeof CLAWPUMP_RECEIPT_TYPES)[number];

export const CLAWPUMP_ERROR_KINDS = [
  "unsupported",
  "unavailable",
  "unauthorized",
  "not_found",
  "invalid_response",
] as const;
export type ClawPumpErrorKind = (typeof CLAWPUMP_ERROR_KINDS)[number];

export type ClawPumpPartnerError = {
  kind: ClawPumpErrorKind;
  message: string;
  retryable: boolean;
  status_code?: number;
  code?: string;
  details?: Record<string, unknown>;
};

export type ClawPumpRawReference = {
  request_id?: string;
  response_id?: string;
  signature?: string;
  event_ids?: string[];
  upstream_status?: number;
};

export type ClawPumpLaunch = {
  mint: string;
  launch_id: string;
  launcher_platform: "clawpump";
  creator_wallet: string;
  launch_authority: string;
  created_at: string;
  cluster: ClawPumpCluster;
  agent_id?: string;
};

export type ClawPumpPayoutRecipient = {
  wallet: string;
  label?: string;
  share_bps: number;
};

export type ClawPumpPayoutTopology = {
  mint: string;
  dev_wallet: string;
  gas_sponsor_wallet?: string;
  agent_rewards_wallet?: string;
  platform_treasury_wallet?: string;
  current_payout_mode: ClawPumpPayoutMode;
  current_payout_recipients: ClawPumpPayoutRecipient[];
  payout_edit_authority: string;
  platform_controls_dev_wallet: boolean | "unknown";
  control_model?: ClawPumpControlModel;
  source_timestamp: string;
};

export type ClawPumpCreatorFeeState = {
  mint: string;
  current_creator_fee_recipient: string;
  accrued_creator_fees_sol: number;
  claimed_creator_fees_sol: number;
  claimable_creator_fees_sol: number;
  last_claim_at?: string;
  last_claim_signature?: string;
  source_timestamp: string;
};

export type ClawPumpRevenueEvent = {
  event_id: string;
  mint: string;
  event_type: ClawPumpRevenueEventType;
  amount_sol: number;
  recipient?: string;
  signature?: string;
  slot?: number;
  block_time: string;
};

export type ClawPumpRepaymentMode = {
  mint: string;
  mode_state: ClawPumpModeState;
  repayment_target?: string;
  repayment_share_bps?: number;
  activated_at?: string;
  cleared_at?: string;
  activated_by?: string;
  cleared_by?: string;
  release_target?: string;
  source_timestamp: string;
};

export type ClawPumpRevenueEventsQuery = {
  since?: string;
  limit?: number;
};

export type ClawPumpSetRepaymentModeInput = {
  mint: string;
  repayment_target: string;
  repayment_share_bps: number;
  activated_by: string;
  note?: string;
};

export type ClawPumpClearRepaymentModeInput = {
  mint: string;
  cleared_by: string;
  release_target?: string;
  note?: string;
};

export type ClawPumpTransportMeta = {
  partner_request_id?: string;
  source_timestamp?: string;
  raw_reference?: ClawPumpRawReference;
  proof_state?: ClawPumpProofState;
  notes?: string[];
};

export type ClawPumpTransportSuccess<T> = {
  ok: true;
  data: T;
  meta?: ClawPumpTransportMeta;
};

export type ClawPumpTransportFailure = {
  ok: false;
  error: ClawPumpPartnerError;
  meta?: ClawPumpTransportMeta;
};

export type ClawPumpTransportResult<T> = ClawPumpTransportSuccess<T> | ClawPumpTransportFailure;

export type ClawPumpTransport = {
  getLaunch(mint: string): Promise<ClawPumpTransportResult<ClawPumpLaunch>>;
  listLaunchesByWallet(wallet: string): Promise<ClawPumpTransportResult<ClawPumpLaunch[]>>;
  getPayoutTopology(mint: string): Promise<ClawPumpTransportResult<ClawPumpPayoutTopology>>;
  getCreatorFeeState(mint: string): Promise<ClawPumpTransportResult<ClawPumpCreatorFeeState>>;
  listRevenueEvents(mint: string, query?: ClawPumpRevenueEventsQuery): Promise<ClawPumpTransportResult<ClawPumpRevenueEvent[]>>;
  getRepaymentMode(mint: string): Promise<ClawPumpTransportResult<ClawPumpRepaymentMode>>;
  setRepaymentMode(input: ClawPumpSetRepaymentModeInput): Promise<ClawPumpTransportResult<ClawPumpRepaymentMode>>;
  clearRepaymentMode(input: ClawPumpClearRepaymentModeInput): Promise<ClawPumpTransportResult<ClawPumpRepaymentMode>>;
};

export type ClawPumpBaseReceipt = {
  receipt_id: string;
  receipt_type: ClawPumpReceiptType;
  partner: "clawpump";
  mint?: string;
  wallet_query?: string;
  partner_request_id?: string;
  source_timestamp: string;
  received_at: string;
  proof_state: ClawPumpProofState;
  notes: string[];
  raw_reference?: ClawPumpRawReference;
};

export type ClawPumpLaunchReceipt = ClawPumpBaseReceipt & {
  receipt_type: "clawpump_launch_receipt";
  launch_id?: string;
  cluster?: ClawPumpCluster;
  creator_wallet?: string;
  launch_authority?: string;
  launch_count?: number;
};

export type ClawPumpPayoutTopologyReceipt = ClawPumpBaseReceipt & {
  receipt_type: "clawpump_payout_topology_receipt";
  dev_wallet?: string;
  payout_mode?: ClawPumpPayoutMode;
  payout_edit_authority?: string;
  recipient_wallets?: string[];
};

export type ClawPumpCreatorFeeStateReceipt = ClawPumpBaseReceipt & {
  receipt_type: "clawpump_creator_fee_state_receipt";
  current_creator_fee_recipient?: string;
  claimable_creator_fees_sol?: number;
  claimed_creator_fees_sol?: number;
};

export type ClawPumpRevenueEventsReceipt = ClawPumpBaseReceipt & {
  receipt_type: "clawpump_revenue_events_receipt";
  event_count: number;
  latest_event_id?: string;
};

export type ClawPumpRepaymentModeReceipt = ClawPumpBaseReceipt & {
  receipt_type: "clawpump_repayment_mode_receipt";
  repayment_target?: string;
  repayment_share_bps?: number;
  activated_by?: string;
  mode_state: ClawPumpModeState;
};

export type ClawPumpReleaseModeReceipt = ClawPumpBaseReceipt & {
  receipt_type: "clawpump_release_mode_receipt";
  release_target?: string;
  cleared_by?: string;
  mode_state: ClawPumpModeState;
};

export type ClawPumpReceipt =
  | ClawPumpLaunchReceipt
  | ClawPumpPayoutTopologyReceipt
  | ClawPumpCreatorFeeStateReceipt
  | ClawPumpRevenueEventsReceipt
  | ClawPumpRepaymentModeReceipt
  | ClawPumpReleaseModeReceipt;

export type ClawPumpSuccess<T, TReceipt extends ClawPumpReceipt> = {
  ok: true;
  data: T;
  receipt: TReceipt;
};

export type ClawPumpFailure<TReceipt extends ClawPumpReceipt> = {
  ok: false;
  error: ClawPumpPartnerError;
  receipt: TReceipt;
};

export type ClawPumpResult<T, TReceipt extends ClawPumpReceipt> = ClawPumpSuccess<T, TReceipt> | ClawPumpFailure<TReceipt>;

export type ClawPumpClient = {
  getLaunch(mint: string): Promise<ClawPumpResult<ClawPumpLaunch, ClawPumpLaunchReceipt>>;
  listLaunchesByWallet(wallet: string): Promise<ClawPumpResult<ClawPumpLaunch[], ClawPumpLaunchReceipt>>;
  getPayoutTopology(mint: string): Promise<ClawPumpResult<ClawPumpPayoutTopology, ClawPumpPayoutTopologyReceipt>>;
  getCreatorFeeState(mint: string): Promise<ClawPumpResult<ClawPumpCreatorFeeState, ClawPumpCreatorFeeStateReceipt>>;
  listRevenueEvents(mint: string, query?: ClawPumpRevenueEventsQuery): Promise<ClawPumpResult<ClawPumpRevenueEvent[], ClawPumpRevenueEventsReceipt>>;
  getRepaymentMode(mint: string): Promise<ClawPumpResult<ClawPumpRepaymentMode, ClawPumpRepaymentModeReceipt>>;
  setRepaymentMode(input: ClawPumpSetRepaymentModeInput): Promise<ClawPumpResult<ClawPumpRepaymentMode, ClawPumpRepaymentModeReceipt>>;
  clearRepaymentMode(input: ClawPumpClearRepaymentModeInput): Promise<ClawPumpResult<ClawPumpRepaymentMode, ClawPumpReleaseModeReceipt>>;
};
