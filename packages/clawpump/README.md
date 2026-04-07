# `@attn-credit/clawpump`

Reference adapter primitives for a ClawPump-style backend-native lane.

This package is intentionally:
1. internal-first
2. server-side
3. transport-injected
4. fixture-friendly

It is not:
1. a public SDK
2. a borrower-owned `Pump -> Swig` abstraction
3. a claim that ClawPump third-party fee-admin parity is live

Current scope:
1. typed partner DTOs
2. canonical ClawPump receipts
3. transport-injected client methods
4. stateful mock transport for deterministic tests

Method surface:
1. `getLaunch`
2. `listLaunchesByWallet`
3. `getPayoutTopology`
4. `getCreatorFeeState`
5. `listRevenueEvents`
6. `getRepaymentMode`
7. `setRepaymentMode`
8. `clearRepaymentMode`

Example:

```ts
import { createMockClawPumpClient } from "@attn-credit/clawpump";

const client = createMockClawPumpClient();

const launch = await client.getLaunch("clawmint11111111111111111111111111111111");
const payout = await client.getPayoutTopology("clawmint11111111111111111111111111111111");

if (launch.ok && payout.ok) {
  console.log(launch.data.creator_wallet, payout.data.dev_wallet, payout.receipt.receipt_type);
}
```

Proof posture:
1. this package only proves the typed adapter contract and deterministic mock behavior
2. it does not yet prove live ClawPump backend access
3. it does not yet prove a real repayment-mode pilot against partner infrastructure

How this feeds the generic SDK contract:
1. this package is one concrete backend-native source for the partner-managed SDK interface in `@attn-credit/sdk`
2. its DTOs and receipts can populate:
   - the integration descriptor
   - payout and routing readbacks
   - canonical revenue and routing receipts
   - the evidence pack used for pilot review
3. drift or control changes discovered here should be forwarded into the shared SDK drift signal instead of staying as a ClawPump-only status note
4. it is not itself the policy or invariant proof
5. do not reinterpret the adapter package as proof of borrower-owned Swig parity, payout-control parity, or public/prod readiness
