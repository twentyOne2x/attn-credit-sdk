import type {
  AttnChain,
  PartnerActionContextRequest,
  PartnerActionRequest,
  PartnerActionResponse,
  PartnerApiResponse,
  PartnerBaseRequest,
  PartnerCatalogRequest,
  PartnerCatalogResponse,
  PartnerCapabilitiesRequest,
  PartnerCapabilitiesResponse,
  PartnerStageStatusRequest,
  PartnerStageStatusResponse,
} from "./schema";
import { inferChainFromPresetId, withPartnerDefaults } from "./schema";
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
      body: JSON.stringify(body),
    });
    return (await parseJson(response)) as TResponse;
  }

  async function get<TResponse extends Record<string, unknown>>(pathname: string, params?: Record<string, unknown>): Promise<TResponse> {
    const response = await fetchImpl(`${baseUrl}${pathname}${buildQuery(params ?? {})}`, {
      method: "GET",
      headers: {
        ...(options.headers ?? {}),
      },
    });
    return (await parseJson(response)) as TResponse;
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
