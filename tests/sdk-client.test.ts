import assert from "node:assert/strict";
import test from "node:test";

import {
  PARTNER_WALLET_POLICY_REQUIREMENT_IDS,
  PARTNER_ACTION_RECEIPT_TYPE,
  PARTNER_CAPABILITIES_RECEIPT_TYPE,
  SDK_CLIENT_DEFAULTS,
  buildAttnEip8183HookEnvelope,
  createPartnerManagedWalletPolicyTemplate,
  createPartnerManagedIntegrationDescriptor,
  createPartnerManagedEvidencePack,
  createPartnerManagedPayoutTopologyReceipt,
  createPartnerManagedDebtOpenRoutingReceipt,
  createPartnerManagedDriftSignal,
  parsePartnerManagedIntegrationDescriptor,
  parsePartnerManagedEvidencePack,
  parsePartnerManagedDriftSignal,
  parsePartnerManagedWalletPolicySummary,
  createAttnEip8183SettlementReceipt,
  createAttnClient,
  classifyPartnerManagedLane,
  decodeAttnEip8183Metadata,
  partnerReceiptTypeForRoute,
} from "../packages/sdk/src";

test("sdk exposes canonical defaults and receipt mapping", () => {
  assert.deepEqual(SDK_CLIENT_DEFAULTS, {
    chain: "solana",
    cluster: "mainnet-beta",
    creator_ingress_mode: "direct-to-swig",
    control_profile_id: "partner_managed_light",
  });
  assert.equal(partnerReceiptTypeForRoute("capabilities"), PARTNER_CAPABILITIES_RECEIPT_TYPE);
  assert.equal(partnerReceiptTypeForRoute("action"), PARTNER_ACTION_RECEIPT_TYPE);
});

test("sdk exposes a partner-managed wallet policy template for private-treasury qualification", () => {
  const template = createPartnerManagedWalletPolicyTemplate({
    wallet_operator_model: "quorum_or_policy_engine",
    private_treasury_financing: "manual_operator_release",
    repayment_enforcement_class: "partner_policy_plus_attn_verifier",
    stateByRequirementId: {
      authoritative_revenue_source_attribution: "verified",
      repayment_target_invariant: "partial",
    },
    noteByRequirementId: {
      repayment_target_invariant: "awaiting retained repayment-mode receipt",
    },
  });

  assert.equal(template.control_surface_mode, "partner_managed_wallet_infra");
  assert.equal(template.wallet_operator_model, "quorum_or_policy_engine");
  assert.equal(template.private_treasury_financing, "manual_operator_release");
  assert.equal(template.repayment_enforcement_class, "partner_policy_plus_attn_verifier");
  assert.equal(template.requirements.length, 12);
  assert.deepEqual(
    template.requirements.find((entry) => entry.requirement_id === "authoritative_revenue_source_attribution"),
    {
      requirement_id: "authoritative_revenue_source_attribution",
      state: "verified",
    },
  );
  assert.deepEqual(
    template.requirements.find((entry) => entry.requirement_id === "repayment_target_invariant"),
    {
      requirement_id: "repayment_target_invariant",
      state: "partial",
      note: "awaiting retained repayment-mode receipt",
    },
  );
  assert.match(template.downgrade_if_missing[0]!, /compatibility_only|underwriting_compatible/);
});

test("sdk classifies the highest honest partner-managed stage from requirement truth", () => {
  const template = createPartnerManagedWalletPolicyTemplate({
    wallet_operator_model: "quorum_or_policy_engine",
    private_treasury_financing: "manual_operator_release",
    repayment_enforcement_class: "partner_policy_plus_attn_verifier",
    stateByRequirementId: {
      authoritative_revenue_source_attribution: "verified",
      authoritative_revenue_scope_mapping: "verified",
      authoritative_wallet_topology: "verified",
      authoritative_payout_state: "verified",
      authoritative_revenue_event_feed: "verified",
      repayment_target_invariant: "partial",
      attn_readback_and_audit_receipts: "partial",
    },
  });

  const assessment = classifyPartnerManagedLane({ policy: template });

  assert.equal(assessment.stage, "stage_2_observable_payout_path_mvp");
  assert.equal(assessment.claim_level, "underwriting_compatible");
  assert.deepEqual(assessment.missing_requirement_ids.includes("payout_edit_authority_separation"), true);
  assert.deepEqual(assessment.next_requirement_ids.includes("payout_edit_authority_separation"), true);
  assert.match(assessment.residual_risk_codes.join(","), /repayment_target_invariant_partial/);
});

test("sdk builds a partner-managed evidence pack and drift signal without implying runtime-live support", () => {
  const allVerifiedStates = Object.fromEntries(
    PARTNER_WALLET_POLICY_REQUIREMENT_IDS.map((requirementId) => [requirementId, "verified"]),
  ) as Record<
    (typeof PARTNER_WALLET_POLICY_REQUIREMENT_IDS)[number],
    "verified"
  >;

  const policy = createPartnerManagedWalletPolicyTemplate({
    wallet_operator_model: "quorum_or_policy_engine",
    private_treasury_financing: "manual_operator_release",
    repayment_enforcement_class: "swig_equivalent_partner_control",
    stateByRequirementId: allVerifiedStates,
  });

  const descriptor = createPartnerManagedIntegrationDescriptor({
    partner_id: "partner_demo",
    display_name: "Partner Demo",
    chain: "solana",
    cluster: "mainnet-beta",
    revenue_scope_model: "service_and_usage_fees",
    payout_topology_source: {
      source_id: "partner_api/payout_topology",
      source_kind: "api",
      observed_at: "2026-04-07T10:00:00.000Z",
      proof_state: "contract_proven",
    },
    debt_open_routing_source: {
      source_id: "partner_api/repayment_mode",
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

  const pack = createPartnerManagedEvidencePack({
    descriptor,
    policy,
    readbacks: {
      payout_topology: {
        source: descriptor.payout_topology_source,
        payout_mode: "claim_and_stream",
        recipient_wallets: ["wallet_a", "wallet_b"],
        payout_edit_authority: "policy_engine",
        operator_model: "quorum_or_policy_engine",
        drift_detection_supported: true,
        notes: [],
      },
      debt_open_routing: {
        source: descriptor.debt_open_routing_source,
        route_state: "enforced",
        repayment_target: "attn_target_wallet",
        release_target: "borrower_wallet",
        repayment_share_bps: 6500,
        unilateral_change_possible: false,
        notes: [],
      },
    },
    receipts: [
      createPartnerManagedPayoutTopologyReceipt({
        partner_id: "partner_demo",
        chain: "solana",
        cluster: "mainnet-beta",
        source_timestamp: "2026-04-07T10:00:00.000Z",
        payout_mode: "claim_and_stream",
        recipient_wallets: ["wallet_a", "wallet_b"],
        payout_edit_authority: "policy_engine",
        operator_model: "quorum_or_policy_engine",
        proof_state: "proof_backed",
      }),
      createPartnerManagedDebtOpenRoutingReceipt({
        partner_id: "partner_demo",
        chain: "solana",
        cluster: "mainnet-beta",
        source_timestamp: "2026-04-07T10:00:00.000Z",
        route_state: "enforced",
        repayment_target: "attn_target_wallet",
        release_target: "borrower_wallet",
        repayment_share_bps: 6500,
        proof_state: "proof_backed",
      }),
    ],
    evidence_refs: ["partner_demo://pilot/review-pack"],
  });

  assert.equal(pack.assessment.stage, "stage_4_full_partner_managed_standard");
  assert.equal(pack.assessment.claim_level, "swig_equivalent_partner_control_compatible");
  assert.equal(pack.required_partner_inputs.length, 0);
  assert.equal(pack.receipts.length, 2);
  assert.equal(pack.assessment.residual_risk_codes.length, 0);

  const driftSignal = createPartnerManagedDriftSignal({
    partner_id: "partner_demo",
    chain: "solana",
    cluster: "mainnet-beta",
    signal_code: "repayment_target_changed",
    summary: "Debt-open routing changed outside the approved pilot window.",
    affected_requirement_ids: ["repayment_target_invariant", "debt_open_change_control"],
    evidence_refs: ["partner_demo://pilot/review-pack"],
  });

  assert.equal(driftSignal.severity, "warn");
  assert.equal(driftSignal.partner_id, "partner_demo");
  assert.deepEqual(driftSignal.affected_requirement_ids, [
    "repayment_target_invariant",
    "debt_open_change_control",
  ]);
});

test("sdk exposes partner-managed parsers for validated integration payloads", () => {
  const policy = parsePartnerManagedWalletPolicySummary(
    createPartnerManagedWalletPolicyTemplate({
      wallet_operator_model: "quorum_or_policy_engine",
      private_treasury_financing: "manual_operator_release",
      repayment_enforcement_class: "partner_policy_plus_attn_verifier",
      stateByRequirementId: {
        authoritative_revenue_source_attribution: "verified",
      },
    }),
  );

  const descriptor = parsePartnerManagedIntegrationDescriptor(
    createPartnerManagedIntegrationDescriptor({
      partner_id: "partner_demo",
      display_name: "Partner Demo",
      chain: "solana",
      cluster: "mainnet-beta",
      revenue_scope_model: "service_and_usage_fees",
      payout_topology_source: {
        source_id: "partner_demo/api/payout_topology",
        source_kind: "api",
        observed_at: "2026-04-07T10:00:00.000Z",
      },
      debt_open_routing_source: {
        source_id: "partner_demo/api/repayment_mode",
        source_kind: "api",
        observed_at: "2026-04-07T10:00:00.000Z",
      },
    }),
  );

  const pack = parsePartnerManagedEvidencePack(
    createPartnerManagedEvidencePack({
      descriptor,
      policy,
      evidence_refs: ["partner_demo://pilot-review/evidence-pack"],
    }),
  );

  const driftSignal = parsePartnerManagedDriftSignal(
    createPartnerManagedDriftSignal({
      partner_id: "partner_demo",
      chain: "solana",
      cluster: "mainnet-beta",
      signal_code: "repayment_target_changed",
      summary: "Debt-open routing changed outside the approved review window.",
      affected_requirement_ids: ["repayment_target_invariant"],
    }),
  );

  assert.equal(pack.descriptor.partner_id, "partner_demo");
  assert.equal(pack.policy.control_surface_mode, "partner_managed_wallet_infra");
  assert.equal(driftSignal.signal_code, "repayment_target_changed");
});

test("sdk client posts partner capabilities to the expected route", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000/",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({
          ok: true,
          receipt_type: PARTNER_CAPABILITIES_RECEIPT_TYPE,
          request_id: "partner_test",
          proof_state: "contract_proven",
          public_claim_state: "public_doc_ready",
          state: "ready",
          actions: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const response = await client.capabilities({
    preset_id: "solana_borrower_privy_only",
  });

  assert.equal(response.ok, true);
  assert.equal(response.receipt_type, PARTNER_CAPABILITIES_RECEIPT_TYPE);
  assert.equal(response.proof_state, "contract_proven");
  assert.equal(response.public_claim_state, "public_doc_ready");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "http://localhost:3000/api/partner/credit/capabilities");
  assert.equal(calls[0]!.body.chain, SDK_CLIENT_DEFAULTS.chain);
  assert.equal(calls[0]!.body.cluster, SDK_CLIENT_DEFAULTS.cluster);
  assert.equal(calls[0]!.body.creator_ingress_mode, SDK_CLIENT_DEFAULTS.creator_ingress_mode);
  assert.equal(calls[0]!.body.control_profile_id, SDK_CLIENT_DEFAULTS.control_profile_id);
});

test("sdk client preserves internal-only Safe capability truth on the EVM adapter", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000/",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({
          ok: true,
          receipt_type: PARTNER_CAPABILITIES_RECEIPT_TYPE,
          request_id: "partner_safe_cap_test",
          proof_state: "code_shipped",
          public_claim_state: "internal_only",
          state: "blocked",
          blocker_codes: ["via_borrower_preflight_blocked"],
          actions: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const response = await client.evm.capabilities({
    preset_id: "evm_borrower_privy_safe",
    creator_ingress_mode: "via-borrower",
    control_profile_id: "partner_managed_firm",
  });

  assert.equal(response.ok, true);
  assert.equal(response.proof_state, "code_shipped");
  assert.equal(response.public_claim_state, "internal_only");
  assert.equal(response.state, "blocked");
  assert.deepEqual(response.blocker_codes, ["via_borrower_preflight_blocked"]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "http://localhost:3000/api/partner/credit/capabilities");
  assert.equal(calls[0]!.body.chain, "evm");
  assert.equal(calls[0]!.body.preset_id, "evm_borrower_privy_safe");
  assert.equal(calls[0]!.body.creator_ingress_mode, "via-borrower");
  assert.equal(calls[0]!.body.control_profile_id, "partner_managed_firm");
});

test("sdk client fetches the free partner catalog through GET", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000/",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        method: String(init?.method ?? "GET"),
      });
      return new Response(
        JSON.stringify({
          ok: true,
          catalog_version: "v1",
          lane: {
            lane_id: "pump_creator_fee_borrower_lane",
          },
          current_truth: {
            can_agent_discover_lane_now: true,
            closure_hosted_state: {
              storage_mode: "database",
              datasource_env_state: "configured",
              durable_state_backend: "shared_system_kv",
              persistence_topology: "mixed_persistence",
              runtime_fallback_state: "fail_closed",
            },
            closure_pack_artifacts: {
              manifest_path: "pack-manifest.json",
              index_path: "PACK_INDEX.md",
              human_intake_checklist_ref:
                "private_lane://pilot_borrower_001/HUMAN_INTAKE_CHECKLIST.md",
              targeted_intrusion_working_pack_ref:
                "private_lane://pilot_borrower_001/06-hosted-controls/targeted-intrusion/README.md",
            },
            dashboard_speed: {
              supplied: true,
              borrower_measured_receipt_count: 1,
              lender_measured_receipt_count: 0,
              borrower_blockers: [],
              lender_blockers: ["lender_dashboard_speed_receipts_missing"],
            },
          },
          action_order: ["check_credit"],
          routes: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const response = await client.catalog({
    preset_id: "solana_borrower_legacy_swig",
    creator_ingress_mode: "via-borrower",
    control_profile_id: "attn_default",
  });

  assert.equal(response.ok, true);
  assert.equal(response.catalog_version, "v1");
  assert.equal(
    response.current_truth.closure_hosted_state?.durable_state_backend,
    "shared_system_kv",
  );
  assert.equal(
    response.current_truth.closure_hosted_state?.runtime_fallback_state,
    "fail_closed",
  );
  assert.equal(
    response.current_truth.closure_pack_artifacts?.human_intake_checklist_ref,
    "private_lane://pilot_borrower_001/HUMAN_INTAKE_CHECKLIST.md",
  );
  assert.equal(
    response.current_truth.closure_pack_artifacts?.targeted_intrusion_working_pack_ref,
    "private_lane://pilot_borrower_001/06-hosted-controls/targeted-intrusion/README.md",
  );
  assert.equal(response.current_truth.dashboard_speed?.supplied, true);
  assert.equal(response.current_truth.dashboard_speed?.borrower_measured_receipt_count, 1);
  assert.deepEqual(response.current_truth.dashboard_speed?.lender_blockers, [
    "lender_dashboard_speed_receipts_missing",
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.method, "GET");
  assert.match(calls[0]!.url, /\/api\/partner\/credit\/catalog\?/);
  assert.match(calls[0]!.url, /preset_id=solana_borrower_legacy_swig/);
  assert.match(calls[0]!.url, /creator_ingress_mode=via-borrower/);
});

test("sdk client can fetch the free partner catalog without explicit input", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000/",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        method: String(init?.method ?? "GET"),
      });
      return new Response(
        JSON.stringify({
          ok: true,
          catalog_version: "v1",
          lane: {
            lane_id: "pump_creator_fee_borrower_lane",
          },
          current_truth: {
            can_agent_discover_lane_now: true,
          },
          action_order: ["check_credit"],
          routes: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const response = await client.catalog();

  assert.equal(response.ok, true);
  assert.equal(response.catalog_version, "v1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.method, "GET");
  assert.equal(calls[0]!.url, "http://localhost:3000/api/partner/credit/catalog");
});

test("sdk client exposes chain adapters for EVM and Solana", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({
          ok: true,
          receipt_type: PARTNER_CAPABILITIES_RECEIPT_TYPE,
          request_id: "partner_test",
          chain: (JSON.parse(String(init?.body)) as Record<string, unknown>).chain,
          state: "ready",
          actions: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  await client.evm.capabilities({
    preset_id: "evm_borrower_privy_only",
  });
  await client.forChain("solana").capabilities({
    preset_id: "solana_borrower_privy_only",
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0]!.body.chain, "evm");
  assert.equal(calls[0]!.body.preset_id, "evm_borrower_privy_only");
  assert.equal(calls[1]!.body.chain, "solana");
  assert.equal(calls[1]!.body.preset_id, "solana_borrower_privy_only");
});

test("sdk exposes a first-class EIP-8183 namespace on the EVM adapter", () => {
  const client = createAttnClient({
    baseUrl: "http://localhost:3000",
    fetch: async () =>
      new Response(
        JSON.stringify({
          ok: true,
          receipt_type: PARTNER_CAPABILITIES_RECEIPT_TYPE,
          request_id: "partner_test",
          state: "ready",
          actions: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  const metadata = client.evm.eip8183.createMetadata({
    cluster: "mainnet-beta",
    preset_id: "evm_borrower_privy_only",
    creator_ingress_mode: "direct-to-swig",
    control_profile_id: "partner_managed_light",
    role_mode: "hook_plus_router",
    repayment_capture_mode: "router_controlled",
  });
  const envelope = client.forChain("evm").eip8183.buildHookEnvelope(metadata);

  assert.equal(metadata.chain, "evm");
  assert.equal(envelope.metadata.chain, "evm");
  assert.equal(envelope.role_mode, "hook_plus_router");
});

test("sdk client wraps checkCredit through the partner action route", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({
          ok: true,
          receipt_type: PARTNER_ACTION_RECEIPT_TYPE,
          request_id: "partner_test",
          action: "check_credit",
          state: "ready",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const response = await client.checkCredit({
    preset_id: "solana_borrower_privy_only",
    mint: "Eg2ymQ2aQqjMcibnmTt8erC6Tvk9PVpJZCxvVPJz2agu",
  });

  assert.equal(response.ok, true);
  assert.equal(response.receipt_type, PARTNER_ACTION_RECEIPT_TYPE);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "http://localhost:3000/api/partner/credit/action");
  assert.equal(calls[0]!.body.action, "check_credit");
  assert.equal(calls[0]!.body.chain, "solana");
  assert.equal(calls[0]!.body.mint, "Eg2ymQ2aQqjMcibnmTt8erC6Tvk9PVpJZCxvVPJz2agu");
});

test("sdk client preserves internal-only Safe action truth on startOnboarding", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({
          ok: true,
          receipt_type: PARTNER_ACTION_RECEIPT_TYPE,
          request_id: "partner_safe_action_test",
          action: "start_onboarding",
          proof_state: "code_shipped",
          public_claim_state: "internal_only",
          state: "blocked",
          blocker_codes: ["via_borrower_preflight_blocked"],
          result: {
            preset_id: "evm_borrower_privy_safe",
            current_stage: "complete",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const response = await client.evm.startOnboarding({
    preset_id: "evm_borrower_privy_safe",
    creator_ingress_mode: "via-borrower",
    control_profile_id: "partner_managed_firm",
    payload: {
      preset_id: "evm_borrower_privy_safe",
      wallet_state: {
        owner_address: "0x1111111111111111111111111111111111111111",
        owner_wallet_client_type: "privy",
        smart_wallet_address: "0x2222222222222222222222222222222222222222",
        smart_wallet_type: "safe",
        smart_wallet_deployed: true,
        chain_id: 8453,
      },
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.action, "start_onboarding");
  assert.equal(response.proof_state, "code_shipped");
  assert.equal(response.public_claim_state, "internal_only");
  assert.equal(response.state, "blocked");
  assert.deepEqual(response.blocker_codes, ["via_borrower_preflight_blocked"]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "http://localhost:3000/api/partner/credit/action");
  assert.equal(calls[0]!.body.chain, "evm");
  assert.equal(calls[0]!.body.action, "start_onboarding");
  assert.equal(calls[0]!.body.preset_id, "evm_borrower_privy_safe");
  assert.equal(calls[0]!.body.creator_ingress_mode, "via-borrower");
});

test("sdk client keeps Solana lifecycle context for openCreditLine and offboard", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const client = createAttnClient({
    baseUrl: "http://localhost:3000",
    fetch: async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({
          ok: true,
          receipt_type: PARTNER_ACTION_RECEIPT_TYPE,
          request_id: "partner_test",
          action: "open_credit_line",
          state: "ready",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  await client.openCreditLine({
    preset_id: "solana_borrower_privy_only",
    session_id: "sol_session_123",
    facility_pubkey: "Fact111111111111111111111111111111111111111",
    tx_signatures: ["draw_sig_mock_1"],
  });
  await client.offboard({
    preset_id: "solana_borrower_privy_only",
    session_id: "sol_session_123",
    facility_pubkey: "Fact111111111111111111111111111111111111111",
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0]!.url, "http://localhost:3000/api/partner/credit/action");
  assert.equal(calls[0]!.body.action, "open_credit_line");
  assert.equal(calls[0]!.body.session_id, "sol_session_123");
  assert.deepEqual(calls[0]!.body.tx_signatures, ["draw_sig_mock_1"]);
  assert.equal(calls[1]!.body.action, "offboard");
  assert.equal(calls[1]!.body.facility_pubkey, "Fact111111111111111111111111111111111111111");
});

test("sdk exposes EIP-8183 metadata and receipt helpers", () => {
  const envelope = buildAttnEip8183HookEnvelope({
    cluster: "mainnet-beta",
    preset_id: "evm_borrower_privy_only",
    creator_ingress_mode: "direct-to-swig",
    control_profile_id: "partner_managed_light",
    request_id: "partner_test",
    role_mode: "hook_plus_router",
    repayment_capture_mode: "router_controlled",
    attn_facility_ref: "facility_base_1",
    notes: ["repay from ACP completion when debt is open"],
  });

  const decoded = decodeAttnEip8183Metadata(envelope.metadata_hex);
  assert.equal(decoded.chain, "evm");
  assert.equal(decoded.role_mode, "hook_plus_router");
  assert.equal(decoded.repayment_capture_mode, "router_controlled");

  const receipt = createAttnEip8183SettlementReceipt({
    cluster: "mainnet-beta",
    job_id: "job_123",
    job_state: "completed",
    role_mode: envelope.role_mode,
    repayment_capture_mode: envelope.repayment_capture_mode,
    router_capture_state: "captured",
    debt_state: "open",
    metadata: decoded,
    capture_amount: "2500000",
    pass_through_amount: "7500000",
    next_actions: ["Record debt receipt against the captured settlement amount."],
  });

  assert.equal(receipt.receipt_type, "attn_eip8183_settlement_receipt");
  assert.equal(receipt.chain, "evm");
  assert.equal(receipt.metadata_hex, envelope.metadata_hex);
  assert.equal(receipt.metadata.attn_facility_ref, "facility_base_1");
});
