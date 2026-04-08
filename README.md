# attn credit SDK

Public TypeScript SDK surfaces for partner-managed attn credit integrations.

This standalone repo is the public reference for the attn partner-managed integration contract.

The core partner-managed contract is not limited to creator-fee lanes. It can describe any attributable revenue surface with a payout path, change authority, readback, and debt-open routing, including creator fees, service fees, usage fees, subscriptions, or a custom cashflow model.

Included packages:

1. `@attn-credit/sdk`
   The generic partner-managed contract: descriptors, readbacks, receipts, evidence packs, stage assessment, and drift signals.
2. `@attn-credit/clawpump`
   A reference adapter showing how one partner-specific backend can map into the generic contract.
3. `@attn-credit/partner-managed-harness-cli`
   A retained-run CLI harness that executes the SDK contract, emits logs and artifacts, and snapshots attn compatibility surfaces when requested.

Use the public docs and the SDK together:

1. the public guide explains guarantees, stages, and evidence requirements
2. the SDK defines the exact interface and payload shapes

Key references:

1. public integration guide: [docs.attn.markets/users/partner-managed-creator-fee-integration](https://docs.attn.markets/users/partner-managed-creator-fee-integration)
2. attn 1-pager: [docs.attn.markets/1-pager](https://docs.attn.markets/1-pager)
3. SDK package README: [packages/sdk/README.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/packages/sdk/README.md)
4. reference adapter README: [packages/clawpump/README.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/packages/clawpump/README.md)

Local verification:

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
```

Retained harness run:

```bash
pnpm run harness:clawpump-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets
```

That command writes a timestamped run directory containing partner snapshots, SDK artifacts, NDJSON logs, and an optional attn catalog snapshot.

If you want to package partner-provided exports instead of a mock run, use the file-backed command:

```bash
pnpm run harness:clawpump-pack-from-files -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/clawpump/launch.json \
  --payout-topology ./examples/clawpump/payout-topology.json \
  --creator-fee-state ./examples/clawpump/creator-fee-state.json \
  --revenue-events ./examples/clawpump/revenue-events.json \
  --repayment-mode ./examples/clawpump/repayment-mode.json
```

That command is the fastest truthful start for a partner that keeps its own wallet infrastructure. It packages partner-provided readbacks into retained receipts, descriptor output, stage assessment, and evidence-pack artifacts without pretending the partner has adopted the current attn callable fallback lane.

Fresh external repo rule:

1. do not start by re-declaring the partner-managed contract in local files,
2. keep new code limited to partner auth, transport, DTO normalization, and export or readback generation,
3. use this repo's exported SDK and harness surfaces for receipts, descriptor output, classification, and evidence packaging,
4. only count a new repo as valid progress if it passes its own `typecheck`, `build`, and `test` commands and advertises only commands that actually exist.

Fresh external bootstrap:

```bash
git clone https://github.com/twentyOne2x/attn-credit-sdk
cd attn-credit-sdk
pnpm install
pnpm build
pnpm run harness:clawpump-pack-from-files -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/clawpump/launch.json \
  --payout-topology ./examples/clawpump/payout-topology.json \
  --creator-fee-state ./examples/clawpump/creator-fee-state.json \
  --revenue-events ./examples/clawpump/revenue-events.json \
  --repayment-mode ./examples/clawpump/repayment-mode.json
```

That is the intended first move for a blind external implementation. Clone the public repo and execute the retained file-backed path before you attempt a separate integration repo.

If you are handing this to an external team or AI, use the canonical base prompt in the public integration guide:

- [docs.attn.markets/users/partner-managed-creator-fee-integration#72-base-prompt-for-an-external-team-or-ai](https://docs.attn.markets/users/partner-managed-creator-fee-integration#72-base-prompt-for-an-external-team-or-ai)

If you explicitly want to snapshot the current hosted attn callable fallback tuple as a comparison point, use:

```bash
pnpm run harness:clawpump-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets \
  --preset-id solana_borrower_legacy_swig \
  --creator-ingress-mode via-borrower \
  --control-profile-id attn_default
```

That attn capabilities snapshot is about the current hosted fallback contract only. It is not proof that a partner-managed wallet stack already matches that runtime lane.

Comparative matrix run:

```bash
pnpm run harness:clawpump-mock-matrix -- --out-dir ./tmp/harness-runs
```

That command retains multiple scenario runs side by side so you can compare the baseline contract against degraded partner-read cases.

License:

Apache-2.0. Commercial use is allowed under the Apache-2.0 terms.
