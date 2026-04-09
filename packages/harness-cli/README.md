# `@attn-credit/partner-managed-harness-cli`

Standalone CLI harness for the partner-managed revenue contract.

Use this package when you want to run the SDK contract as an executable scenario instead of reading only the interface types.

Public references:
1. integration guide: [docs.attn.markets/users/partner-managed-creator-fee-integration](https://docs.attn.markets/users/partner-managed-creator-fee-integration)
2. attn 1-pager: [docs.attn.markets/1-pager](https://docs.attn.markets/1-pager)
3. SDK reference: [packages/sdk/README.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/packages/sdk/README.md)

## What this does

The command surface is:
1. `partner-managed-mock-pilot`
2. `partner-managed-mock-matrix`
3. `partner-managed-pack-from-files`
4. `partner-managed-validate`

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
pnpm run harness:partner-managed-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets
```

If you want to package partner-provided exports instead of a mock run, use:

```bash
pnpm run harness:partner-managed-validate -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/partner-managed/launch.json \
  --payout-topology ./examples/partner-managed/payout-topology.json \
  --creator-fee-state ./examples/partner-managed/creator-fee-state.json \
  --revenue-events ./examples/partner-managed/revenue-events.json \
  --repayment-mode ./examples/partner-managed/repayment-mode.json
```

That validation pass tells you:
1. whether the minimum pack inputs are present,
2. whether the stronger first retained run bundle is complete,
3. which files are missing or invalid,
4. the current stage implied by the bundle,
5. and the exact next packaging command when the bundle is ready enough.

Then package the bundle:

```bash
pnpm run harness:partner-managed-pack-from-files -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/partner-managed/launch.json \
  --payout-topology ./examples/partner-managed/payout-topology.json \
  --creator-fee-state ./examples/partner-managed/creator-fee-state.json \
  --revenue-events ./examples/partner-managed/revenue-events.json \
  --repayment-mode ./examples/partner-managed/repayment-mode.json
```

That file-backed command is the fastest truthful start for a partner that keeps its own wallet infrastructure. It retains the packaged partner readbacks and the derived SDK artifacts without implying the hosted attn callable fallback is already the same lane.

If you are not sure which files to gather first, start with:

- [PARTNER_DATA_CHECKLIST.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/PARTNER_DATA_CHECKLIST.md)
- [templates/partner-managed-starter](https://github.com/twentyOne2x/attn-credit-sdk/tree/main/templates/partner-managed-starter)

Legacy `clawpump-*` command names still work as compatibility aliases for the reference adapter. Public partner starts should use the `partner-managed-*` names.

If you want the harness to snapshot the current hosted attn callable fallback tuple too, provide the explicit preset tuple instead of making the CLI guess:

```bash
pnpm run harness:partner-managed-mock-pilot -- \
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
pnpm run harness:partner-managed-mock-matrix -- --out-dir ./tmp/harness-runs
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
pnpm run harness:partner-managed-validate -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/partner-managed/launch.json \
  --payout-topology ./examples/partner-managed/payout-topology.json \
  --creator-fee-state ./examples/partner-managed/creator-fee-state.json \
  --revenue-events ./examples/partner-managed/revenue-events.json \
  --repayment-mode ./examples/partner-managed/repayment-mode.json
pnpm run harness:partner-managed-pack-from-files -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/partner-managed/launch.json \
  --payout-topology ./examples/partner-managed/payout-topology.json \
  --creator-fee-state ./examples/partner-managed/creator-fee-state.json \
  --revenue-events ./examples/partner-managed/revenue-events.json \
  --repayment-mode ./examples/partner-managed/repayment-mode.json
```

That bootstrap is intentionally explicit because a blind external repo should start by executing the public harness, not by scraping the schema and reconstructing the contract from prose.

If a separate partner repo is created after that bootstrap, prefer this wiring:

1. vendor the public SDK repo into `vendor/attn-credit-sdk`,
2. depend on `@attn-credit/sdk` from `vendor/attn-credit-sdk/packages/sdk`,
3. run `pnpm --dir vendor/attn-credit-sdk build` before your root `typecheck`, `build`, or `test` commands if the vendored copy does not already include built `dist` outputs,
4. import from `@attn-credit/sdk` instead of deep-importing `vendor/.../src` or `vendor/.../dist`,
5. keep the repo-specific code limited to partner auth, transport, DTO normalization, export loading, and retained-run glue,
6. and if the partner's live HTTP contract is not public, keep transport as an explicit stub or config-driven adapter that fails closed.

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
