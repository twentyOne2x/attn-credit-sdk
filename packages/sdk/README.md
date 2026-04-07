# `@attn-credit/sdk`

Typed TypeScript surfaces for partner-managed attn credit integrations.

## Partner-managed integration reference

If you are evaluating a partner-managed creator-fee lane with custom wallet or payout infrastructure, this README is the mechanics companion to the public integration guide.

Use the split like this:

1. the public doc explains guarantees, stages, evidence, and policy thresholds
2. this README explains the exact interface and payload surfaces attn expects

The public doc should answer:

1. what this setup is for
2. what is required to move between stages
3. what attn can honestly claim at each stage
4. what evidence the partner needs to provide

This README should answer:

1. which typed objects describe the lane
2. which readbacks and receipts attn expects
3. how attn classifies the lane
4. how attn packages evidence and drift signals

### Partner-managed interface at a glance

The reusable SDK contract is:

1. `PartnerManagedWalletPolicySummary`
2. `PartnerManagedIntegrationDescriptor`
3. `PartnerManagedReadbackSnapshot`
4. `PartnerManagedReceipt`
5. `PartnerManagedStageAssessment`
6. `PartnerManagedEvidencePack`
7. `PartnerManagedDriftSignal`

The main helpers are:

1. `createPartnerManagedWalletPolicyTemplate(...)`
2. `createPartnerManagedIntegrationDescriptor(...)`
3. `classifyPartnerManagedLane(...)`
4. `createPartnerManagedEvidencePack(...)`
5. canonical receipt builders for payout topology, revenue events, debt-open routing, change events, release/offboard, and incident state
6. `createPartnerManagedDriftSignal(...)`
7. zod-backed parsers for the external contract:
   - `parsePartnerManagedWalletPolicySummary(...)`
   - `parsePartnerManagedIntegrationDescriptor(...)`
   - `parsePartnerManagedEvidencePack(...)`
   - `parsePartnerManagedDriftSignal(...)`

### What partners need to supply

The SDK helps standardize interface shape. It does not guess partner truths.

The partner-specific inputs are:

1. named revenue scope
2. payout topology and current recipients
3. debt-open routing behavior
4. payout-change authority
5. release/offboard behavior
6. incident and freeze posture
7. retained evidence or exports supporting those claims

### What attn standardizes in the SDK

The SDK now standardizes:

1. descriptor shape
2. readback shape
3. receipt shape
4. evidence-pack shape
5. stage-classification output
6. drift-signal output
7. parser and validation behavior

The SDK does not standardize:

1. payout authority in the partner's own systems
2. debt-open enforcement in the partner's own systems
3. counterparty responsibility
4. signer or operator integrity
5. truthful partner readback

### Minimal workflow

Use the contract in this order:

1. describe the current lane with `createPartnerManagedIntegrationDescriptor(...)`
2. express current requirement coverage with `createPartnerManagedWalletPolicyTemplate(...)`
3. attach retained readbacks and receipts
4. classify the current stage with `classifyPartnerManagedLane(...)`
5. package one reviewable artifact with `createPartnerManagedEvidencePack(...)`
6. emit `createPartnerManagedDriftSignal(...)` when debt-open routing, payout authority, or incident posture changes materially

### Compact partner-managed example

```ts
import {
  classifyPartnerManagedLane,
  createPartnerManagedDebtOpenRoutingReceipt,
  createPartnerManagedEvidencePack,
  createPartnerManagedIntegrationDescriptor,
  createPartnerManagedPayoutTopologyReceipt,
  createPartnerManagedWalletPolicyTemplate,
} from "@attn-credit/sdk";

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
    repayment_target_invariant: "partial",
    debt_open_change_control: "partial",
  },
});

const descriptor = createPartnerManagedIntegrationDescriptor({
  partner_id: "partner_demo",
  display_name: "Partner Demo",
  chain: "solana",
  cluster: "mainnet-beta",
  revenue_scope_model: "creator_and_service_fees",
  payout_topology_source: {
    source_id: "partner_demo/api/payout_topology",
    source_kind: "api",
    observed_at: "2026-04-07T10:00:00.000Z",
    proof_state: "contract_proven",
  },
  debt_open_routing_source: {
    source_id: "partner_demo/api/repayment_mode",
    source_kind: "api",
    observed_at: "2026-04-07T10:00:00.000Z",
    proof_state: "contract_proven",
  },
  readback_support: {
    payout_topology: true,
    revenue_events: true,
    debt_open_routing: true,
    change_authority: true,
    incident_state: true,
    release_state: true,
  },
});

const assessment = classifyPartnerManagedLane({ policy });

const evidencePack = createPartnerManagedEvidencePack({
  descriptor,
  policy,
  assessment,
  receipts: [
    createPartnerManagedPayoutTopologyReceipt({
      partner_id: "partner_demo",
      chain: "solana",
      cluster: "mainnet-beta",
      source_timestamp: "2026-04-07T10:00:00.000Z",
      payout_mode: "claim_and_stream",
      recipient_wallets: ["wallet_creator", "wallet_attn"],
      payout_edit_authority: "partner_policy_engine",
      operator_model: "quorum_or_policy_engine",
      proof_state: "contract_proven",
    }),
    createPartnerManagedDebtOpenRoutingReceipt({
      partner_id: "partner_demo",
      chain: "solana",
      cluster: "mainnet-beta",
      source_timestamp: "2026-04-07T10:00:00.000Z",
      route_state: "observable",
      repayment_target: "attn_repayment_wallet",
      release_target: "creator_wallet",
      repayment_share_bps: 6000,
      proof_state: "contract_proven",
    }),
  ],
});
```

For one concrete backend-native mapping into this generic contract, use [`@attn-credit/clawpump`](../clawpump/README.md) and its bridge helpers in [`sdkBridge.ts`](../clawpump/src/sdkBridge.ts).

Quick start:

```ts
import { createAttnClient } from "@attn-credit/sdk";

const client = createAttnClient({
  baseUrl: "http://localhost:3000",
});

const capabilities = await client.solana.capabilities({
  cluster: "mainnet-beta",
  preset_id: "solana_borrower_privy_only",
  creator_ingress_mode: "direct-to-swig",
  control_profile_id: "partner_managed_light",
});

const quote = await client.solana.checkCredit({
  cluster: "mainnet-beta",
  preset_id: "solana_borrower_privy_only",
  creator_ingress_mode: "direct-to-swig",
  control_profile_id: "partner_managed_light",
  mint: "Eg2ymQ2aQqjMcibnmTt8erC6Tvk9PVpJZCxvVPJz2agu",
});
```

For partner-managed wallet infra, the canonical external contract now consists of:
1. one policy summary
2. one integration descriptor
3. zero or more retained receipts
4. one stage assessment
5. one evidence pack
6. zero or more drift signals

Compact example:

```ts
import {
  classifyPartnerManagedLane,
  createPartnerManagedDebtOpenRoutingReceipt,
  createPartnerManagedDriftSignal,
  createPartnerManagedEvidencePack,
  createPartnerManagedIntegrationDescriptor,
  createPartnerManagedPayoutTopologyReceipt,
  createPartnerManagedWalletPolicyTemplate,
  parsePartnerManagedEvidencePack,
} from "@attn-credit/sdk";

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
    attn_readback_and_audit_receipts: "partial",
    repayment_target_invariant: "partial",
  },
});

const descriptor = createPartnerManagedIntegrationDescriptor({
  partner_id: "partner_demo",
  display_name: "Partner Demo",
  chain: "solana",
  cluster: "mainnet-beta",
  revenue_scope_model: "creator_and_service_fees",
  payout_topology_source: {
    source_id: "partner_demo/api/payout_topology",
    source_kind: "api",
    observed_at: "2026-04-07T10:00:00.000Z",
    proof_state: "contract_proven",
  },
  debt_open_routing_source: {
    source_id: "partner_demo/api/repayment_mode",
    source_kind: "api",
    observed_at: "2026-04-07T10:00:00.000Z",
    proof_state: "contract_proven",
  },
  readback_support: {
    payout_topology: true,
    revenue_events: true,
    debt_open_routing: true,
    change_authority: true,
    incident_state: true,
    release_state: true,
  },
  incident_support: {
    freeze_supported: true,
    quarantine_supported: true,
    session_revocation_supported: true,
  },
  release_support: {
    release_mode_supported: true,
    offboard_receipt_supported: true,
  },
});

const assessment = classifyPartnerManagedLane({ policy });

const evidencePack = createPartnerManagedEvidencePack({
  descriptor,
  policy,
  receipts: [
    createPartnerManagedPayoutTopologyReceipt({
      partner_id: "partner_demo",
      chain: "solana",
      cluster: "mainnet-beta",
      source_timestamp: "2026-04-07T10:00:00.000Z",
      payout_mode: "claim_and_stream",
      recipient_wallets: ["wallet_creator", "wallet_attn"],
      payout_edit_authority: "partner_policy_engine",
      operator_model: "quorum_or_policy_engine",
      proof_state: "contract_proven",
    }),
    createPartnerManagedDebtOpenRoutingReceipt({
      partner_id: "partner_demo",
      chain: "solana",
      cluster: "mainnet-beta",
      source_timestamp: "2026-04-07T10:00:00.000Z",
      route_state: "observable",
      repayment_target: "attn_repayment_wallet",
      release_target: "creator_wallet",
      repayment_share_bps: 6000,
      proof_state: "contract_proven",
    }),
  ],
  evidence_refs: ["partner_demo://pilot-review/evidence-pack"],
});

const driftSignal = createPartnerManagedDriftSignal({
  partner_id: "partner_demo",
  chain: "solana",
  cluster: "mainnet-beta",
  signal_code: "repayment_target_changed",
  summary: "Debt-open routing changed outside the approved review window.",
  affected_requirement_ids: ["repayment_target_invariant", "debt_open_change_control"],
});

parsePartnerManagedEvidencePack(evidencePack);
```

Use this contract to standardize the reusable mechanics before the partner provides live truths about payout topology, routing, change authority, incident posture, and retained evidence.

Important truth:
1. these helpers are a qualification/evidence contract, not proof that the runtime lane is already shipped
2. the SDK can standardize descriptor shape, receipts, evidence packaging, and stage classification, but it cannot remove counterparty risk, payout-control risk, or signer/operator risk
3. the partner still has to supply truthful payout, routing, authority, incident, and release facts for a real lane review
4. because the low-level mechanics now live in the SDK interface, the public guide can stay focused on guarantees, claim boundaries, and required evidence

Docs can now omit these mechanics and point here instead:
1. exact descriptor object shape
2. exact receipt object shape
3. exact evidence-pack shape
4. exact stage-classification payload shape
5. exact drift-signal payload shape
6. parser/validation details for partner submissions

The SDK preserves the route truth:

1. `request_id`
2. `receipt_type`
3. `chain`
4. `cluster`
5. `settlement_core` when the route can derive it honestly
6. `proof_state`
7. `public_claim_state`
8. `state`
9. `blockers`
10. `next_actions`
11. `execution_mode` where present

`settlement_core` is still additive, but it now emits canonical shared route/ledger/policy/receipt objects while keeping the provenance honest through `source_model = "lane_projection"` where the runtime is still projecting from lane-specific receipts.

Client defaults are exported from the shared schema:

```ts
import { SDK_CLIENT_DEFAULTS, partnerReceiptTypeForRoute } from "@attn-credit/sdk";

console.log(SDK_CLIENT_DEFAULTS.chain); // solana
console.log(SDK_CLIENT_DEFAULTS.creator_ingress_mode); // direct-to-swig
console.log(partnerReceiptTypeForRoute("action")); // partner_action_receipt
```

The public client is now explicitly chain-aware without flattening the adapters into one execution engine:

```ts
const evmClient = client.forChain("evm");
const evmCapabilities = await evmClient.capabilities({
  preset_id: "evm_borrower_privy_only",
  creator_ingress_mode: "direct-to-swig",
  control_profile_id: "partner_managed_light",
});
```

If you are integrating the Safe-backed EVM preset, keep its truth narrow:

```ts
const safeCapabilities = await client.evm.capabilities({
  preset_id: "evm_borrower_privy_safe",
  creator_ingress_mode: "direct-to-swig",
  control_profile_id: "partner_managed_firm",
});

console.log(safeCapabilities.proof_state); // code_shipped
console.log(safeCapabilities.public_claim_state); // internal_only
```

Do not treat `evm_borrower_privy_safe` as public-doc-ready or pair it with `creator_ingress_mode="via-borrower"`. The currently shipped Safe lane is an internal onboarding/activation surface, not a public self-serve lifecycle lane.

For the ACP / `EIP-8183` lane, the SDK also exposes a first-class namespace on the EVM adapter:

```ts
const envelope = client.evm.eip8183.buildHookEnvelope({
  cluster: "mainnet-beta",
  preset_id: "evm_borrower_privy_only",
  creator_ingress_mode: "direct-to-swig",
  control_profile_id: "partner_managed_light",
  role_mode: "hook_plus_router",
  repayment_capture_mode: "router_controlled",
});

const receipt = client.evm.eip8183.createSettlementReceipt({
  cluster: "mainnet-beta",
  job_id: "job_123",
  job_state: "completed",
  role_mode: envelope.role_mode,
  repayment_capture_mode: envelope.repayment_capture_mode,
  router_capture_state: "captured",
  debt_state: "open",
  metadata: envelope.metadata,
});
```

This is the first shipped SDK/runtime layer for the EVM `EIP-8183` lane. It does not yet claim the onchain hook bytecode itself is fully shipped or proven in this repo.

For the reference Solidity hook/router/evaluator package, use [`@attn-credit/eip8183`](/Users/user/PycharmProjects/attn-credit/packages/eip8183/README.md).

For a bounded external-agent wrapper over the same API, use [`@attn-credit/agent-tools`](/Users/user/PycharmProjects/attn-credit/packages/agent-tools/README.md).

When the caller needs one compact discovery/truth surface instead of reconstructing raw catalog fields, use the agent-tools wrapper on top of the SDK:

```ts
import { createAttnClient } from "@attn-credit/sdk";
import { createPumpAgentBorrowerTools } from "@attn-credit/agent-tools";

const client = createAttnClient({
  baseUrl: "http://localhost:3000",
});

const tools = createPumpAgentBorrowerTools({ client });
const catalogSummary = await tools.summarizeCatalog();

console.log(catalogSummary.live_claim_scope);
console.log(catalogSummary.real_credit_blockers);
console.log(catalogSummary.first_private_lane_semantics);
console.log(catalogSummary.pilot_path_truth);
console.log(catalogSummary.dashboard_speed);
console.log(catalogSummary.speed_posture); // measured | partial | unproven
```

That helper preserves the claim-boundary fields from the catalog, including `first_private_lane_semantics` and `pilot_path_truth`, alongside `current_truth.dashboard_speed` without inventing durations or healthy defaults. Use those fields to keep the self-funded private-pilot scope separate from independent-lender or prod claims.

Canonical cross-chain truth and operator sequencing live in [PARTNER_CREDIT_CROSS_CHAIN.md](/Users/user/PycharmProjects/attn-credit/docs/runbooks/PARTNER_CREDIT_CROSS_CHAIN.md).
