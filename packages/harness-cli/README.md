# `@attn-credit/partner-managed-harness-cli`

Standalone CLI harness for the partner-managed revenue contract.

Use this package when you want to run the SDK contract as an executable scenario instead of reading only the interface types.

Public references:
1. integration guide: [docs.attn.markets/users/partner-managed-creator-fee-integration](https://docs.attn.markets/users/partner-managed-creator-fee-integration)
2. attn 1-pager: [docs.attn.markets/1-pager](https://docs.attn.markets/1-pager)
3. SDK reference: [packages/sdk/README.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/packages/sdk/README.md)

## What this does

The first command is:
1. `clawpump-mock-pilot`
2. `clawpump-mock-matrix`
3. `clawpump-pack-from-files`

It runs one bounded partner-managed revenue scenario and emits:
1. raw partner-side artifacts
2. SDK policy/descriptor/stage/evidence artifacts
3. NDJSON logs
4. one summary file
5. optional attn catalog and capabilities snapshots

## What this does not prove

This harness does not prove:
1. live access to a real partner backend
2. treasury funding against a real counterparty
3. payout-control parity from execution alone
4. live borrower readiness

It proves the execution contract, the artifact contract, and the failure posture of the public SDK surface.

## Example

```bash
pnpm run harness:clawpump-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets
```

If you want to package clawpump-style partner exports instead of a mock run, use:

```bash
pnpm run harness:clawpump-pack-from-files -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/clawpump/launch.json \
  --payout-topology ./examples/clawpump/payout-topology.json \
  --creator-fee-state ./examples/clawpump/creator-fee-state.json \
  --revenue-events ./examples/clawpump/revenue-events.json \
  --repayment-mode ./examples/clawpump/repayment-mode.json
```

That file-backed command is the fastest truthful start for a partner that keeps its own wallet infrastructure. It retains the packaged partner readbacks and the derived SDK artifacts without implying the hosted attn callable fallback is already the same lane.

If you want the harness to snapshot the current hosted attn callable fallback tuple too, provide the explicit preset tuple instead of making the CLI guess:

```bash
pnpm run harness:clawpump-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets \
  --preset-id solana_borrower_legacy_swig \
  --creator-ingress-mode via-borrower \
  --control-profile-id attn_default
```

The command prints a compact JSON summary to stdout and writes a timestamped run directory under the chosen output root.

That attn capabilities snapshot is only a comparison point against the current hosted callable fallback. It is not proof of clawpump payout-control parity or partner-managed wallet equivalence.

Matrix example:

```bash
pnpm run harness:clawpump-mock-matrix -- --out-dir ./tmp/harness-runs
```

The matrix command retains a baseline run plus degraded partner-read scenarios so the stage classifier, residual-risk outputs, and evidence packaging can be compared side by side.

## Fresh external repo acceptance bar

If a partner or its AI creates a new repo around this harness, the honest minimum bar is:

1. use this harness or the SDK package directly instead of rewriting the contract locally,
2. retain one file-backed run from real partner exports or readbacks,
3. make the repo's own `typecheck`, `build`, and `test` commands pass,
4. and publish only the commands that the repo actually implements.

A draft repo that only mirrors the schema or stage language without passing those gates is still useful discovery, but it is not yet an integration-ready start pack.

Recommended blind-start bootstrap:

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

That bootstrap is intentionally explicit because a blind external repo should start by executing the public harness, not by scraping the schema and reconstructing the contract from prose.

## Retained output tree

Each run retains:

1. `inputs.json`
2. `logs/events.ndjson`
3. `partner/*.json`
4. `sdk/*.json`
5. `attn/*.json` when attn snapshots are enabled
6. `summary.json`

The `summary.json` file also labels the attn snapshot scope as one of:
1. `none`
2. `catalog_only`
3. `current_callable_fallback_tuple`

Use those artifacts as the review bundle when refining the SDK contract or the partner guide.
