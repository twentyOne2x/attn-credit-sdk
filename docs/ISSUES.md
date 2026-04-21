## 2026-04-20 - attn live catalog CLI must fail closed on current hosted non-Pump catalog

PLANNER
- Spec check: solvable and small. The public SDK build and tests pass, but the real `harness:attn-live-catalog:human` command crashes against the current hosted `/api/partner/credit/catalog` response when the host returns an error receipt for the Solana Pump borrower request. The CLI should report a blocked readback instead of throwing on missing Pump catalog fields.
- User-stated desired outcome: resume the ClawPump SDK plus Pump.fun creator-fee borrower lane and answer live/mainnet/testnet truth from current surfaces.
- Missing info/questions: none for this repo-owned SDK readback bug.
- Context + suspected cause: the hosted catalog currently describes the bounded EVM Safe lane and returns a `partner_error_receipt` for the Solana/Pump request shape. SDK catalog summarization assumed `current_truth` existed.
- Fix intent: make the SDK live-catalog command fail closed with blocker reasons and retained artifacts when the hosted catalog is not a full Pump borrower catalog.
- Acceptance criteria: `harness:attn-live-catalog` returns `ok=false` plus blocker reasons for hosted error receipts; human output renders without crashing; existing SDK tests stay green.
- Complexity: small
- Executor prompt: Update `packages/sdk/src/index.ts`, `packages/harness-cli/src/index.ts`, and `tests/harness-cli.test.ts` only. Do not alter partner-managed validation semantics or demo fixture claims. Run `pnpm test` and the real `node packages/harness-cli/dist/index.js attn-live-catalog --format human`.

EXECUTOR
- [x] Implement fix and collect proofs.

VERIFIER
- [x] Compare proofs to acceptance criteria.

Outcome:
- `pnpm test` passes: 40/40 tests.
- `node packages/harness-cli/dist/index.js attn-live-catalog --format human` now exits fail-closed instead of crashing, with `ok: no`, `live claim scope: none`, and the hosted `BAD_REQUEST` reason.

AUDIT - CP-05 Partner-Managed SDK Review Pack Audit Gate
- [x] Audit verdict recorded in `docs/reports/2026-04-20-cp-05-partner-managed-sdk-review-pack-audit-gate.md`.
- [x] Result: PASS, no findings.
- [x] The review outcome remains truthful against the retained CP-02 proof boundary at `tmp/harness-runs/run-20260420T093650Z-fd967c/review-freeze.md`.
- [x] The live catalog review fix remains fail-closed and does not broaden partner-managed validation semantics or demo fixture claims.

CI/CD - CP-05 Partner-Managed SDK Review Pack Audit Gate
- [x] CI/CD verdict recorded in `docs/reports/2026-04-20-cp-05-partner-managed-sdk-review-pack-audit-gate.md`.
- [x] Result: PASS, no findings.
- [x] `pnpm --dir /Users/user/PycharmProjects/attn-credit-sdk typecheck` passed.
- [x] `pnpm --dir /Users/user/PycharmProjects/attn-credit-sdk build` passed.
- [x] `pnpm --dir /Users/user/PycharmProjects/attn-credit-sdk test` passed, 40/40 tests.

## 2026-04-21 - public SDK must stop exposing attn-internal route and wallet terminology

PLANNER
- Spec check: solvable and medium. The public docs are now mostly cleaned, but the public SDK contract still exposes attn-internal names like `via-borrower`, `direct-to-swig`, and `Swig` in enum values, defaults, settlement notes, and claim-level labels. Those names do not make sense for a partner-managed integration that is supposed to stay independent of the partner's wallet infrastructure.
- User-stated desired outcome: stop using internal route names in the SDK too; make the integration contract independent of the partner wallet infra; do it now.
- Missing info/questions: none. The neutral naming layer is inferable from current behavior.
- Context + suspected cause: the SDK contract grew out of attn-host borrower/runtime implementation terms and leaked those terms into the public API instead of keeping them as transport-only internals.
- Fix intent: replace public canonical route/parity names with neutral values, accept legacy aliases, and keep current attn-host transport working through explicit normalization.
- Acceptance criteria:
  - the public SDK canonical `creator_ingress_mode` values are neutral and no longer mention `Swig` or `borrower`;
  - public parity-level enums and notes no longer mention `Swig`;
  - legacy SDK inputs still parse;
  - current attn-host transport still receives the old route values it expects;
  - current attn-host responses normalize back into the new canonical SDK values;
  - focused SDK tests pass.
- Complexity: medium
- Plan: `/Users/user/PycharmProjects/attn-credit-sdk/docs/plans/active/2026-04-21-public-sdk-neutral-route-naming-and-compat-aliases.md`
- Executor prompt: Update `packages/sdk/src/schema.ts`, `packages/sdk/src/index.ts`, `packages/sdk/src/settlement.ts`, `packages/sdk/src/eip8183.ts`, and the focused SDK tests/docs only. Keep backward compatibility by accepting legacy inputs and serializing to current backend transport values where required. Do not widen this into a backend rename.

EXECUTOR
- [x] Implement fix and collect proofs.

VERIFIER
- [x] Compare proofs to acceptance criteria.

Outcome:
- Public SDK canonical route names are now neutral: `session_handoff` and `managed_destination`.
- Public partner-managed parity labels are now neutral: `full_control_parity` and `full_control_parity_compatible`.
- Legacy route/parity strings still parse where the SDK reads unknown input or current attn-host transport.
- Current attn-host requests still serialize to legacy transport values and normalize current attn-host responses back to the new canonical SDK values.
- Verification passed:
  - `pnpm -C /Users/user/PycharmProjects/attn-credit-sdk build`
  - `pnpm -C /Users/user/PycharmProjects/attn-credit-sdk exec tsx --test tests/sdk-client.test.ts tests/harness-cli.test.ts tests/clawpump-client.test.ts`
  - `git -C /Users/user/PycharmProjects/attn-credit-sdk diff --check -- docs/ISSUES.md docs/plans/active/2026-04-21-public-sdk-neutral-route-naming-and-compat-aliases.md README.md examples/attn-live/README.md packages/clawpump/README.md packages/harness-cli/README.md packages/sdk/README.md packages/sdk/src/schema.ts packages/sdk/src/index.ts packages/sdk/src/settlement.ts packages/sdk/src/eip8183.ts tests/sdk-client.test.ts tests/harness-cli.test.ts tests/clawpump-client.test.ts`

DEPLOY VERIFICATION - CP-05 Partner-Managed SDK Review Pack Audit Gate CI/CD Gate
- [x] Deploy-verification verdict recorded in `docs/reports/2026-04-20-cp-05-partner-managed-sdk-review-pack-audit-gate.md`.
- [x] Result: PASS, no findings.
- [x] The CI/CD-cleared result remains truthful against the landed CP-05 packet and mirrored closure surfaces.
- [x] `pnpm --dir /Users/user/PycharmProjects/attn-credit-sdk typecheck` passed.
- [x] `pnpm --dir /Users/user/PycharmProjects/attn-credit-sdk build` passed.
- [x] `pnpm --dir /Users/user/PycharmProjects/attn-credit-sdk test` passed, 40/40 tests.
