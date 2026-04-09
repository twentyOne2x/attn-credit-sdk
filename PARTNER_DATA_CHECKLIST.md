# Partner Data Checklist

Use this checklist before the first retained run.

The goal is simple: gather one honest bundle of current partner data so `partner-managed-validate` and `partner-managed-pack-from-files` can tell the truth about the lane without guessing.

## Minimum pack-from-files inputs

These two files are the minimum needed to run the file-backed pack flow:

1. `payout-topology.json`
   - what the current payout path looks like
   - who currently receives the in-scope flow
   - who can edit that payout state
2. `revenue-events.json`
   - concrete revenue events for the in-scope flow
   - enough data to tell that the revenue is real and attributable

## Recommended first retained run inputs

For a truthful first retained run, gather all five:

1. `launch.json`
   - what launch or lane this bundle refers to
   - creator wallet, launch authority, mint, cluster, and created timestamp
2. `payout-topology.json`
   - the current payout mode
   - the current recipients and shares
   - the payout edit authority or policy owner
3. `creator-fee-state.json`
   - current fee recipient
   - accrued, claimed, and claimable fee state
   - the timestamp of the readback
4. `revenue-events.json`
   - event-level revenue observations
   - amounts, timestamps, and recipients when available
5. `repayment-mode.json`
   - what changes while debt is open
   - repayment target, share, release target, and activation or clear state

## Plain-English quality bar

Good enough for the first retained run means:

1. each file describes current state, not an intended future design,
2. timestamps are present,
3. wallets or destinations are named explicitly,
4. anything still manual or partial is stated plainly,
5. and missing controls are left missing instead of being inferred.

## What to do next

1. run `partner-managed-validate` on the file bundle first
2. fix anything it marks as invalid or missing
3. then run `partner-managed-pack-from-files`
4. send the retained run directory when you want attn to review the lane

## Related references

1. [Root README](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/README.md)
2. [Harness CLI README](https://github.com/twentyOne2x/attn-credit-sdk/blob/main/packages/harness-cli/README.md)
3. [Public integration guide](https://docs.attn.markets/users/partner-managed-creator-fee-integration)
