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
  --attn-base-url https://app.attn.markets \
  --preset-id solana_borrower_privy_only \
  --creator-ingress-mode direct-to-swig \
  --control-profile-id partner_managed_light
```

That command writes a timestamped run directory containing partner snapshots, SDK artifacts, NDJSON logs, and optional attn compatibility snapshots.

Comparative matrix run:

```bash
pnpm run harness:clawpump-mock-matrix -- --out-dir ./tmp/harness-runs
```

That command retains multiple scenario runs side by side so you can compare the baseline contract against degraded partner-read cases.

License:

Apache-2.0. Commercial use is allowed under the Apache-2.0 terms.
