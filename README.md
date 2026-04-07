# attn credit SDK

Public TypeScript SDK surfaces for partner-managed attn credit integrations.

This standalone repo exists so counterparties can review the integration contract without needing access to the private `attn-credit` monorepo.

Included packages:

1. `@attn-credit/sdk`
   The generic partner-managed contract: descriptors, readbacks, receipts, evidence packs, stage assessment, and drift signals.
2. `@attn-credit/clawpump`
   A reference adapter showing how one partner-specific backend can map into the generic contract.

Use the public docs and the SDK together:

1. the public guide explains guarantees, stages, and evidence requirements
2. the SDK defines the exact interface and payload shapes

Key references:

1. public integration guide: `docs.attn.markets/users/partner-managed-creator-fee-integration`
2. SDK package README: `packages/sdk/README.md`
3. reference adapter README: `packages/clawpump/README.md`

Local verification:

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
```

License:

Apache-2.0. Commercial use is allowed under the Apache-2.0 terms.

