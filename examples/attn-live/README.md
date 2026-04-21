# Hosted attn live examples

These examples are for attn's own hosted reference path.

Use them when you want to gauge or drive the hosted borrower contract through the public SDK instead of only reading catalog truth.

The usual order is:

1. `pnpm run harness:attn-live-catalog:human`
2. `pnpm run harness:attn-live-capabilities:human`
3. `pnpm run harness:attn-live-action:human -- --action check_credit --mint <mint>`
4. `pnpm run harness:attn-live-action:human -- --preset-id <attn_hosted_preset> --creator-ingress-mode <attn_hosted_mode> --control-profile-id <attn_hosted_control_profile> --action start_onboarding --payload-file ./examples/attn-live/<payload>.payload.example.json`
5. `pnpm run harness:attn-live-action:human -- --preset-id <attn_hosted_preset> --creator-ingress-mode <attn_hosted_mode> --control-profile-id <attn_hosted_control_profile> --action execute_handoff --session-id <session_id> --session-token <session_token>`
6. `pnpm run harness:attn-live-action:human -- --preset-id <attn_hosted_preset> --creator-ingress-mode <attn_hosted_mode> --control-profile-id <attn_hosted_control_profile> --action open_credit_line --session-id <session_id> --session-token <session_token> --facility-pubkey <facility>`

Important boundary:

- the example JSON is a shape scaffold, not a replayable live payload
- you must replace the placeholder borrower wallet and auth proof with a real signer-controlled proof
- the `verify_posture.verifier_input` block must reflect the real server-side verifier evidence for the borrower session

Fresh hosted proof from April 21, 2026:

- the public commands can read current attn-hosted route truth and run bounded checks like `check_credit`
- those hosted checks are still discovery-only for real credit because `live_claim_scope = none`
- one older hosted path remains blocked on external Pump creator-fee finalization and signer access

The public SDK is usable for this hosted reference surface today, but it still fail-closes before any live funded-credit claim when those conditions are not actually satisfied.
