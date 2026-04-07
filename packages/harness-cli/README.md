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

If you want the harness to snapshot attn capabilities too, provide the explicit preset tuple instead of making the CLI guess:

```bash
pnpm run harness:clawpump-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets \
  --preset-id solana_borrower_privy_only \
  --creator-ingress-mode direct-to-swig \
  --control-profile-id partner_managed_light
```

The command prints a compact JSON summary to stdout and writes a timestamped run directory under the chosen output root.

Matrix example:

```bash
pnpm run harness:clawpump-mock-matrix -- --out-dir ./tmp/harness-runs
```

The matrix command retains a baseline run plus degraded partner-read scenarios so the stage classifier, residual-risk outputs, and evidence packaging can be compared side by side.

## Retained output tree

Each run retains:

1. `inputs.json`
2. `logs/events.ndjson`
3. `partner/*.json`
4. `sdk/*.json`
5. `attn/*.json` when attn snapshots are enabled
6. `summary.json`

Use those artifacts as the review bundle when refining the SDK contract or the partner guide.
