import { z } from "zod";

import {
  CONTROL_PROFILE_IDS,
  CREATOR_INGRESS_MODES,
  PARTNER_AGENT_LANE_STATES,
  PARTNER_SDK_STAGES,
  SUPPORTED_CLUSTERS,
  type ControlProfileId,
  type CreatorIngressMode,
  type PartnerAgentLaneState,
  type PartnerSdkStage,
  type SupportedCluster,
} from "./schema";

export const ATTN_EIP8183_ROLE_MODES = ["hook_only", "hook_plus_router", "hook_router_evaluator"] as const;
export type AttnEip8183RoleMode = (typeof ATTN_EIP8183_ROLE_MODES)[number];

export const ATTN_EIP8183_REPAYMENT_CAPTURE_MODES = [
  "none",
  "completion_split",
  "payout_pull",
  "router_controlled",
] as const;
export type AttnEip8183RepaymentCaptureMode = (typeof ATTN_EIP8183_REPAYMENT_CAPTURE_MODES)[number];

export const EIP8183_JOB_STATES = ["open", "funded", "submitted", "completed", "rejected", "expired"] as const;
export type Eip8183JobState = (typeof EIP8183_JOB_STATES)[number];

export const EIP8183_ROUTER_CAPTURE_STATES = ["not_applicable", "pending", "captured", "skipped", "blocked"] as const;
export type Eip8183RouterCaptureState = (typeof EIP8183_ROUTER_CAPTURE_STATES)[number];

export const EIP8183_DEBT_STATES = ["none", "open", "repaid", "blocked"] as const;
export type Eip8183DebtState = (typeof EIP8183_DEBT_STATES)[number];

export const ATTN_EIP8183_METADATA_VERSION = "attn_eip8183_v1";
export const ATTN_EIP8183_SETTLEMENT_RECEIPT_TYPE = "attn_eip8183_settlement_receipt";

const zHex = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]*$/, "hex value must start with 0x and contain only hexadecimal characters");

const zAddress = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "address must be a 20-byte hex string");

export const zAttnEip8183RoleMode = z.enum(ATTN_EIP8183_ROLE_MODES);
export const zAttnEip8183RepaymentCaptureMode = z.enum(ATTN_EIP8183_REPAYMENT_CAPTURE_MODES);
export const zEip8183JobState = z.enum(EIP8183_JOB_STATES);
export const zEip8183RouterCaptureState = z.enum(EIP8183_ROUTER_CAPTURE_STATES);
export const zEip8183DebtState = z.enum(EIP8183_DEBT_STATES);

export const zAttnEip8183Metadata = z.object({
  version: z.literal(ATTN_EIP8183_METADATA_VERSION).default(ATTN_EIP8183_METADATA_VERSION),
  chain: z.literal("evm").default("evm"),
  cluster: z.enum(SUPPORTED_CLUSTERS).default("mainnet-beta"),
  preset_id: z.string().trim().min(1),
  creator_ingress_mode: z.enum(CREATOR_INGRESS_MODES),
  control_profile_id: z.enum(CONTROL_PROFILE_IDS),
  request_id: z.string().trim().min(1).optional(),
  sdk_stage: z.enum(PARTNER_SDK_STAGES).optional(),
  agent_lane_state: z.enum(PARTNER_AGENT_LANE_STATES).optional(),
  role_mode: zAttnEip8183RoleMode.default("hook_plus_router"),
  repayment_capture_mode: zAttnEip8183RepaymentCaptureMode.default("router_controlled"),
  hook_address: zAddress.optional(),
  settlement_router_address: zAddress.optional(),
  evaluator_address: zAddress.optional(),
  attn_quote_id: z.string().trim().min(1).optional(),
  attn_facility_ref: z.string().trim().min(1).optional(),
  borrower_wallet: zAddress.optional(),
  provider_wallet: zAddress.optional(),
  notes: z.array(z.string().trim().min(1)).default([]),
});

export type AttnEip8183Metadata = {
  version: typeof ATTN_EIP8183_METADATA_VERSION;
  chain: "evm";
  cluster: SupportedCluster;
  preset_id: string;
  creator_ingress_mode: CreatorIngressMode;
  control_profile_id: ControlProfileId;
  request_id?: string;
  sdk_stage?: PartnerSdkStage;
  agent_lane_state?: PartnerAgentLaneState;
  role_mode: AttnEip8183RoleMode;
  repayment_capture_mode: AttnEip8183RepaymentCaptureMode;
  hook_address?: string;
  settlement_router_address?: string;
  evaluator_address?: string;
  attn_quote_id?: string;
  attn_facility_ref?: string;
  borrower_wallet?: string;
  provider_wallet?: string;
  notes: string[];
};

export const zAttnEip8183SettlementReceipt = z.object({
  receipt_type: z.literal(ATTN_EIP8183_SETTLEMENT_RECEIPT_TYPE),
  chain: z.literal("evm").default("evm"),
  cluster: z.enum(SUPPORTED_CLUSTERS).default("mainnet-beta"),
  request_id: z.string().trim().min(1).optional(),
  job_id: z.string().trim().min(1),
  job_state: zEip8183JobState,
  role_mode: zAttnEip8183RoleMode,
  repayment_capture_mode: zAttnEip8183RepaymentCaptureMode,
  router_capture_state: zEip8183RouterCaptureState,
  debt_state: zEip8183DebtState,
  hook_address: zAddress.optional(),
  settlement_router_address: zAddress.optional(),
  evaluator_address: zAddress.optional(),
  metadata_hex: zHex.optional(),
  metadata: zAttnEip8183Metadata,
  blocker_codes: z.array(z.string().trim().min(1)).default([]),
  blockers: z.array(z.string().trim().min(1)).default([]),
  next_actions: z.array(z.string().trim().min(1)).default([]),
  capture_amount: z.string().trim().min(1).optional(),
  pass_through_amount: z.string().trim().min(1).optional(),
});

export type AttnEip8183SettlementReceipt = z.infer<typeof zAttnEip8183SettlementReceipt>;

type AttnEip8183MetadataInput = Omit<AttnEip8183Metadata, "version" | "chain" | "notes"> & {
  notes?: string[];
};

type AttnEip8183SettlementReceiptInput = Omit<
  AttnEip8183SettlementReceipt,
  "receipt_type" | "chain" | "metadata" | "metadata_hex"
> & {
  metadata: AttnEip8183Metadata | AttnEip8183MetadataInput;
  metadata_hex?: string;
};

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJsonStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createAttnEip8183Metadata(input: AttnEip8183MetadataInput): AttnEip8183Metadata {
  return zAttnEip8183Metadata.parse(input) as AttnEip8183Metadata;
}

export function encodeAttnEip8183Metadata(input: AttnEip8183Metadata | AttnEip8183MetadataInput): string {
  const metadata = createAttnEip8183Metadata(input);
  return `0x${Buffer.from(stableJsonStringify(metadata), "utf8").toString("hex")}`;
}

export function decodeAttnEip8183Metadata(encoded: string): AttnEip8183Metadata {
  const normalized = zHex.parse(encoded);
  const raw = normalized.slice(2);
  const json = Buffer.from(raw, "hex").toString("utf8");
  return zAttnEip8183Metadata.parse(JSON.parse(json)) as AttnEip8183Metadata;
}

export function buildAttnEip8183HookEnvelope(input: AttnEip8183Metadata | AttnEip8183MetadataInput) {
  const metadata = createAttnEip8183Metadata(input);
  return {
    role_mode: metadata.role_mode,
    repayment_capture_mode: metadata.repayment_capture_mode,
    metadata,
    metadata_hex: encodeAttnEip8183Metadata(metadata),
  };
}

export function createAttnEip8183SettlementReceipt(
  input: AttnEip8183SettlementReceiptInput,
): AttnEip8183SettlementReceipt {
  const metadata = createAttnEip8183Metadata(input.metadata);
  return zAttnEip8183SettlementReceipt.parse({
    ...input,
    receipt_type: ATTN_EIP8183_SETTLEMENT_RECEIPT_TYPE,
    chain: "evm",
    metadata,
    metadata_hex: input.metadata_hex ?? encodeAttnEip8183Metadata(metadata),
  });
}
