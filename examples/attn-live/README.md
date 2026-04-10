# Hosted attn live examples

These examples are for the currently hosted attn treasury-funded Pump creator-fee fallback lane.

Use them when you want to gauge or drive the hosted borrower contract through the public SDK instead of only reading catalog truth.

The usual order is:

1. `pnpm run harness:attn-live-catalog:human`
2. `pnpm run harness:attn-live-capabilities:human`
3. `pnpm run harness:attn-live-action:human -- --action check_credit --mint <mint>`
4. `pnpm run harness:attn-live-action:human -- --action start_onboarding --payload-file ./examples/attn-live/swig-start-onboarding.payload.example.json`
5. `pnpm run harness:attn-live-action:human -- --action execute_handoff --session-id <session_id> --session-token <session_token>`
6. `pnpm run harness:attn-live-action:human -- --action open_credit_line --session-id <session_id> --session-token <session_token> --facility-pubkey <facility>`

Important boundary:

- the example JSON is a shape scaffold, not a replayable live payload
- you must replace the placeholder borrower wallet and auth proof with a real signer-controlled proof
- the `verify_posture.verifier_input` block must reflect the real server-side verifier evidence for the borrower session

Fresh hosted proof from April 10, 2026:

- `start_onboarding` can create a hosted session through the public SDK
- `execute_handoff` truthfully stops at `route-lock transactions must be confirmed on-chain` until route-lock confirmation is real
- `open_credit_line` truthfully stops at `TREASURY_FUNDING_NOT_STARTED` until operator treasury release exists

The public SDK is usable for this hosted lane today, but it still fail-closes before ACTIVE when those conditions are not actually satisfied.
