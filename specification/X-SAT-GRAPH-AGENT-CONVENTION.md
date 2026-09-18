# `x-sat-graph-agent` — Per-primitive agent-usage metadata convention

`x-sat-graph-agent` is an OpenAPI vendor extension that provides compact, machine-consumable guidance about when a primitive is useful and what intrinsic caveats apply.

It is documentation metadata. It does not alter routes, parameters, response schemas, graph semantics, or deployment policy.

It is not part of MCP. Any client may choose to consume it.

## Location

The block appears in operation files under `specification/paths/**/*.yaml` as a sibling of `description` and `operationId`.

## Shape

```yaml
x-sat-graph-agent:
  version: 1
  when-to-use: <string>
  not-for: <string>
  caveats: <string>
  pairs-with: [<operationId>, ...]
  role: <enum>
```

Required fields:

- `version`
- `when-to-use`
- `role`

Optional fields:

- `not-for`
- `caveats`
- `pairs-with`

Current `role` vocabulary:

`anchor` · `search` · `temporal` · `structural` · `hydration` · `causal` · `graph` · `introspection`

## What belongs in `caveats`

`caveats` is for intrinsic primitive-level correctness information that follows from the API contract and could otherwise be lost in a short tool description.

Examples:

- ranked discovery results are candidates rather than deterministic evidence;
- `observerTime` selects a transaction-time perspective where supported;
- Version-parent navigation without `at` may span multiple historical parent contexts;
- omission of `aspects` returns or considers all deployment-supported aspects where specified;
- ranked search is not exhaustive enumeration.

The language should remain domain-neutral unless the caveat is explicitly labeled as a reference-domain example.

## What does not belong here

Do not use this extension to prescribe:

- multi-step reasoning policy;
- logging or audit-trail persistence;
- stopping criteria;
- retry policy;
- jurisdiction-specific legal rules;
- output formatting policy;
- ingestion or storage mechanisms.

Those belong to the consuming agent/harness, implementation guide, or application layer.

## Rules

1. `when-to-use` explains when to select the primitive, not merely what HTTP route it calls.
2. `not-for` should point to the appropriate alternative primitive when one exists.
3. `caveats` should stay short and intrinsic to the primitive contract.
4. `pairs-with` uses canonical `operationId` values.
5. Nothing in this metadata overrides the OpenAPI contract.
6. When operation semantics change, review the corresponding `x-sat-graph-agent` block.

## Example

```yaml
x-sat-graph-agent:
  version: 1
  when-to-use: >-
    Turn a textual reference into candidate Item identifiers before deterministic
    temporal, structural, or causal navigation.
  not-for: >-
    Broad thematic discovery without an explicit referent — use searchTextUnits/searchItems.
  caveats: >-
    Returns normalized ranked candidates; confidence is not a calibrated probability.
  pairs-with: [getValidVersions, getItemVersions, getItemChildren]
  role: anchor
```

## Coverage

The current specification exposes 44 operations. New operations should include an `x-sat-graph-agent` block so agent-oriented clients can derive concise usage guidance directly from the specification.
