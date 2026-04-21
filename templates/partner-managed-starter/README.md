# Partner-Managed Starter Template

This template is the fastest way to start from a freshly cloned `attn-credit-sdk` repo without inventing your own file layout, commands, or harness wiring.

## What this template is for

Use it when you want one bounded starter package that:

1. keeps the partner-specific work limited to data gathering and transport glue,
2. runs the public validation command before packaging,
3. and produces one saved review bundle from the public harness contract.

## Local verification inside the cloned SDK repo

From the SDK repo root:

```bash
pnpm install
pnpm build
pnpm --dir templates/partner-managed-starter typecheck
pnpm --dir templates/partner-managed-starter build
pnpm --dir templates/partner-managed-starter test
pnpm --dir templates/partner-managed-starter run partner:validate:sample
pnpm --dir templates/partner-managed-starter run partner:validate:sample:human
pnpm --dir templates/partner-managed-starter run partner:pack:sample
```

Those commands use the sample fixture bundle in `fixtures/` and write saved outputs into `artifacts/`.

## What to replace with real partner data

Swap the sample fixture files with the partner's current data:

1. `fixtures/launch.json`
2. `fixtures/payout-topology.json`
3. `fixtures/creator-fee-state.json`
4. `fixtures/revenue-events.json`
5. `fixtures/repayment-mode.json`

If you are not sure what each file should contain, use the checklist at:

- [PARTNER_DATA_CHECKLIST.md](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/PARTNER_DATA_CHECKLIST.md)

## Separate repo follow-on

After the first saved review bundle, you can either:

1. keep working inside the cloned SDK repo for the first integration pass, or
2. copy this template into a separate repo and vendor or otherwise depend on the public SDK there.

If you move it into a separate repo, install and build the vendored SDK workspace before your root checks:

```bash
pnpm --dir vendor/attn-credit-sdk install
pnpm --dir vendor/attn-credit-sdk build
```

The important rule does not change: keep the partner repo focused on auth, transport, DTO normalization, export loading, and adapter glue. Do not re-type the full partner-managed contract locally.
