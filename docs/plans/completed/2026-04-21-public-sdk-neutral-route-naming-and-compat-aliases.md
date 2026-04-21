# Completed - 2026-04-21 - Public SDK neutral route naming and compatibility aliases

Outcome: complete. The public SDK now exposes neutral canonical route/parity names, accepts legacy aliases when parsing unknown input, and still bridges to the current attn-host transport values on the wire.

## Objective

Replace public SDK route and parity names that leak attn-internal wallet/path terminology with neutral canonical names, while preserving compatibility for existing callers and current attn-host transport.

## User-stated desired outcome

- stop exposing names like `direct-to-swig`, `via-borrower`, and `Swig` in the public SDK contract;
- keep the integration contract independent of the partner's wallet infrastructure;
- and do it now rather than only cleaning prose.

## Non-goals

- redesign the hosted attn backend in this change;
- rename every internal attn preset id in one pass;
- or remove legacy transport values from the backend before the SDK can translate them safely.

## Constraints

- public docs/examples should not teach attn-internal route names;
- the public SDK should expose neutral canonical values;
- legacy caller input must still parse;
- current attn-host requests must remain serializable to the backend's existing route values;
- current attn-host responses must normalize back to the new canonical SDK values.

## Plan

1. Add one canonical neutral naming layer for `creator_ingress_mode`.
2. Accept old values as legacy aliases at parse time.
3. Serialize canonical neutral values back to current backend transport values when sending attn-host requests.
4. Normalize received transport values back into canonical SDK values.
5. Rename the parity-level `Swig` labels in policy and claim-level enums to neutral control-parity language, with legacy alias parsing where needed.
6. Update tests, README examples, and human-readable notes to the new canonical names.

## Canonical naming decisions

- `creator_ingress_mode`
  - canonical `session_handoff`
  - canonical `managed_destination`
  - legacy aliases accepted:
    - `via-borrower` -> `session_handoff`
    - `direct-to-swig` -> `managed_destination`
- `repayment_enforcement_class`
  - canonical `full_control_parity`
  - legacy alias accepted:
    - `swig_equivalent_partner_control` -> `full_control_parity`
- `claim_level`
  - canonical `full_control_parity_compatible`
  - legacy alias accepted:
    - `swig_equivalent_partner_control_compatible` -> `full_control_parity_compatible`

## Verification plan

- `pnpm -C /Users/user/PycharmProjects/attn-credit-sdk build`
- `pnpm -C /Users/user/PycharmProjects/attn-credit-sdk exec tsx --test tests/sdk-client.test.ts tests/harness-cli.test.ts tests/clawpump-client.test.ts`
- `git -C /Users/user/PycharmProjects/attn-credit-sdk diff --check -- README.md examples/attn-live/README.md packages/clawpump/README.md packages/harness-cli/README.md packages/sdk/README.md packages/sdk/src/schema.ts packages/sdk/src/index.ts packages/sdk/src/settlement.ts packages/sdk/src/eip8183.ts tests/sdk-client.test.ts tests/harness-cli.test.ts tests/clawpump-client.test.ts`

## Rollback

Revert the SDK repo-only patch if transport normalization or legacy alias acceptance proves incomplete.

## Progress log

- 2026-04-21: Plan created before code changes. Current public docs are already cleaned, but the SDK contract still exposes attn-internal route/parity names in schema, defaults, settlement notes, and tests.
- 2026-04-21: Implementation landed. Canonical public route names are now `session_handoff` and `managed_destination`; canonical parity labels are now `full_control_parity` and `full_control_parity_compatible`; focused SDK build/tests passed.
