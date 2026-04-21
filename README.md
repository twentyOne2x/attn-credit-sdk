# attn credit SDK

Public TypeScript SDK surfaces for partner-managed attn credit integrations.

This standalone repo is the public reference for the attn partner-managed integration contract.

The core partner-managed contract is not limited to creator-fee lanes. It can describe any attributable revenue surface with a payout path, change authority, readback, and debt-open routing, including creator fees, service fees, usage fees, subscriptions, or a custom cashflow model.

## What this enables today

Today, this public SDK enables the Pump creator-fee-backed credit lane in two distinct ways.

For a partner-managed own-wallet lane, it gives attn and a partner one shared contract for:

1. describing the partner's current payout setup in one consistent format,
2. checking whether the partner's exported data is good enough for a first saved review bundle,
3. grading how far the integration has actually progressed,
4. saving one review bundle for underwriting or pilot review,
5. and scaffolding a partner-side integration without re-inventing the contract.

For a Pump or ClawPump-style partner, that means the SDK is the public contract for qualifying and packaging the creator-fee-backed borrower lane when the partner keeps its own wallet and payout infrastructure.

As of April 20, 2026, one real ClawPump data bundle has been packaged through this public SDK from non-demo mainnet-beta payout, fee, launch, revenue, and repayment-mode exports. In plain English, that means the public SDK can save and review a real partner bundle. It does not mean live funding is ready, live payout control is proven, production readiness is proven, or the partner lane matches attn's own hosted flow.

The public SDK also exposes one optional attn-hosted reference surface so a caller can inspect attn's current hosted route truth without reconstructing raw catalog fields by hand. That surface is useful as a reference check for attn's own host. It is not the starting contract for a partner-managed integration, and it should not be presented to a partner as if it described the partner's wallet architecture.

## What this does not enable by itself

This repo does not, by itself:

1. fund or open the live credit line,
2. prove live payout-control parity,
3. replace a real partner backend integration,
4. or upgrade the lane into broader borrower-market or lender-market readiness.

Included packages:

1. `@attn-credit/sdk`
   The generic partner-managed contract: descriptors, readbacks, receipts, evidence packs, stage assessment, and drift signals.
2. `@attn-credit/clawpump`
   A reference adapter showing how one partner-specific backend can map into the generic contract.
3. `@attn-credit/partner-managed-harness-cli`
   A CLI that validates partner files, saves a review bundle, and can optionally snapshot attn's current hosted behavior for comparison.

Included self-serve assets:

1. [`PARTNER_DATA_CHECKLIST.md`](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/PARTNER_DATA_CHECKLIST.md)
   Plain-English checklist for the first retained run bundle.
2. [`templates/partner-managed-starter`](https://github.com/twentyOne2x/attn-credit-sdk/tree/main/templates/partner-managed-starter)
   A working starter template inside the cloned SDK repo.

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
pnpm run harness:partner-managed-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets
```

That command writes a timestamped run directory containing partner snapshots, SDK artifacts, NDJSON logs, and an optional attn catalog snapshot.

If you want to package partner-provided exports instead of a mock run, use the file-backed command:

```bash
pnpm run harness:partner-managed-validate -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/partner-managed/launch.json \
  --payout-topology ./examples/partner-managed/payout-topology.json \
  --creator-fee-state ./examples/partner-managed/creator-fee-state.json \
  --revenue-events ./examples/partner-managed/revenue-events.json \
  --repayment-mode ./examples/partner-managed/repayment-mode.json
```

The validation command checks whether the bundle is good enough for the first saved review bundle, tells you which inputs are still missing or invalid, and prints the next packaging command when the bundle is ready.

If you want a faster human-readable gauge instead of JSON, add `--format human`.
The repo also exposes `pnpm run harness:partner-managed-validate:human` as a convenience wrapper.

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

For a real partner bundle, stamp the saved descriptor with the actual partner metadata:

```bash
pnpm run harness:partner-managed-pack-from-files -- \
  --out-dir ./tmp/harness-runs \
  --launch <real-launch-json> \
  --payout-topology <real-payout-topology-json> \
  --creator-fee-state <real-creator-fee-state-json> \
  --revenue-events <real-revenue-events-json> \
  --repayment-mode <real-repayment-mode-json> \
  --partner-id clawpump \
  --display-name ClawPump
```

If those metadata flags are omitted, the saved SDK descriptor uses the generic demo defaults (`partner_demo` / `Partner Demo`) even when the underlying receipts are ClawPump-family receipts.

That command is the fastest truthful start for a partner that keeps its own wallet infrastructure. It turns partner-provided exports into a saved review bundle without implying that the partner already matches any attn-hosted reference path.

If you are not sure what data to gather first, start with:

- [PARTNER_DATA_CHECKLIST.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/PARTNER_DATA_CHECKLIST.md)

Legacy `clawpump-*` harness commands still exist as compatibility aliases for the reference adapter. Public docs should prefer the `partner-managed-*` names.

## Optional attn-hosted reference checks

If you want to check attn's own current hosted route truth through the same public package, use the live SDK commands:

```bash
pnpm run harness:attn-live-catalog:human
pnpm run harness:attn-live-capabilities:human
pnpm run harness:attn-live-action:human -- \
  --action check_credit \
  --mint Eg2ymQ2aQqjMcibnmTt8erC6Tvk9PVpJZCxvVPJz2agu
```

Those commands inspect attn's own hosted borrower API at `https://app.attn.markets` through the public SDK surface.

They are the public way to:

1. see what attn's currently hosted lane claims to support,
2. inspect which hosted borrower actions are currently callable,
3. and run bounded hosted checks like `check_credit` when the input context is public enough to provide.

They are not a claim that the broader borrower UI, public market, or partner-managed own-wallet runtime is the same thing. Treat them as attn-hosted reference checks only, not as the starting contract for a partner that keeps its own payout and wallet stack.

If you specifically need to inspect one older hosted path for attn-side debugging, use the `examples/attn-live/` payload scaffold together with the exact current attn-hosted parameters from CLI help. Most partner-managed integrations can ignore this section entirely.

Fresh hosted proof from April 21, 2026:

1. the public commands can read current attn-hosted route truth and execute bounded checks like `check_credit`.
2. those hosted checks are still discovery-only for real credit and should not be treated as proof that a live funded lane is ready.
3. one older hosted path remains blocked on external Pump creator-fee finalization and signer access.

Reference files:

- [examples/attn-live/README.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/examples/attn-live/README.md)
- `examples/attn-live/*.payload.example.json`

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
pnpm run harness:partner-managed-validate -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/partner-managed/launch.json \
  --payout-topology ./examples/partner-managed/payout-topology.json \
  --creator-fee-state ./examples/partner-managed/creator-fee-state.json \
  --revenue-events ./examples/partner-managed/revenue-events.json \
  --repayment-mode ./examples/partner-managed/repayment-mode.json \
  --format human
pnpm run harness:partner-managed-pack-from-files -- \
  --out-dir ./tmp/harness-runs \
  --launch ./examples/partner-managed/launch.json \
  --payout-topology ./examples/partner-managed/payout-topology.json \
  --creator-fee-state ./examples/partner-managed/creator-fee-state.json \
  --revenue-events ./examples/partner-managed/revenue-events.json \
  --repayment-mode ./examples/partner-managed/repayment-mode.json
```

That is the intended first move for a blind external implementation. Clone the public repo and generate one saved review bundle before you attempt a separate integration repo.

If you want a working package scaffold inside that cloned repo, use:

- [templates/partner-managed-starter](https://github.com/twentyOne2x/attn-credit-sdk/tree/main/templates/partner-managed-starter)

Recommended separate-repo wiring after that baseline:

1. vendor this repo into `vendor/attn-credit-sdk`,
2. add `@attn-credit/sdk` as a file dependency from `vendor/attn-credit-sdk/packages/sdk`,
3. run `pnpm --dir vendor/attn-credit-sdk install && pnpm --dir vendor/attn-credit-sdk build` before your root `typecheck`, `build`, or `test` commands so the vendored workspace has its own dependencies and built `dist` outputs,
4. import from `@attn-credit/sdk` instead of deep-importing `vendor/.../src` or `vendor/.../dist`,
5. keep local code limited to auth, transport, DTO normalization, export loading, and adapter glue,
6. and if a live partner HTTP contract is not public yet, keep transport config-driven or stubbed and fail closed instead of guessing routes or auth scopes.

Minimal `package.json` shape for that separate repo:

```json
{
  "dependencies": {
    "@attn-credit/sdk": "file:vendor/attn-credit-sdk/packages/sdk"
  }
}
```

If you are handing this to an external team or AI, use the canonical base prompt in the public integration guide:

- [docs.attn.markets/users/partner-managed-creator-fee-integration#72-base-prompt-for-an-external-team-or-ai](https://docs.attn.markets/users/partner-managed-creator-fee-integration#72-base-prompt-for-an-external-team-or-ai)

If you explicitly want to snapshot attn's current hosted reference path as a comparison point, use the mock pilot command and pass the current attn-hosted parameters explicitly rather than assuming they match a partner-managed lane:

```bash
pnpm run harness:partner-managed-mock-pilot -- \
  --out-dir ./tmp/harness-runs \
  --attn-base-url https://app.attn.markets
```

That attn capabilities snapshot is about attn's current hosted reference contract only. It is not proof that a partner-managed wallet stack already matches that runtime lane.

Comparative matrix run:

```bash
pnpm run harness:partner-managed-mock-matrix -- --out-dir ./tmp/harness-runs
```

That command retains multiple scenario runs side by side so you can compare the baseline contract against degraded partner-read cases.

License:

Apache-2.0. Commercial use is allowed under the Apache-2.0 terms.

Publish readiness:

- public packages are pack-verifiable from this repo with `pnpm run pack:verify`
- actual npm publication still requires registry auth on the current machine
