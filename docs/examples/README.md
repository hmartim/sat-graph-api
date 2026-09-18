# SAT-Graph API Examples

This directory contains practical examples using the legal reference domain.

The examples are intentionally concrete: they demonstrate the domain-neutral SAT-Graph primitives with Brazilian legislation and case-law data. Legal vocabulary in these examples is illustrative rather than a restriction of the core API.

## Maintained examples

- [01 — Point-in-time retrieval](01-point-in-time-retrieval.md)
- [02 — Constitutional evolutionary analysis](02-constitutional-evolutionary-analysis.md)
- [03 — Multilingual fallback](03-multilingual-fallback.md)
- [04 — Point-in-time comparison and causal pinpointing](04-point-in-time-comparison.md)
- [Case-law examples](caselaw/)

## Principles illustrated

- ranked discovery followed by formal graph operations;
- explicit valid-time resolution;
- deterministic retrieval after identifiers are known;
- structural navigation over Items and stored Version states;
- causal tracing through Actions;
- batch hydration for known identifier sets;
- separation between ranked search and exhaustive inspection.

## Important conventions

- Search `topK` is always a positive ranking limit. It is never an exhaustive-enumeration switch.
- Resolver responses contain the full candidate entity plus `confidence`, for example `{ "item": {...}, "confidence": 0.95 }`.
- `getBatchTextUnits` accepts `versionIds`, `language`, and optional `aspects`.
- If a workflow needs specifically the legal deployment's primary text, it should request `aspects: ["canonical"]` rather than relying on omission, because omission now means all available aspects.

## Additional resources

- [Getting Started](../getting-started.md)
- [Primitive Categories](../ACTION_CATEGORIES.md)
- [OpenAPI Specification](../../specification/openapi.yaml)
