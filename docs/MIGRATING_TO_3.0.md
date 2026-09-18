# Migrating to SAT-Graph API 3.0

SAT-Graph API 3.0 is a contract cleanup focused on domain neutrality, explicit temporal semantics, composability, and clearer separation between ranked discovery and deterministic graph operations.

## Important behavior changes

### Omitted `aspects` now means all supported aspects

In 2.x, some operations implicitly treated an omitted `aspects` filter as `canonical`. In 3.0, omitting `aspects` means that all supported aspects are considered or returned according to the operation.

Clients that require only canonical legal text should now request it explicitly, for example:

```json
{
  "aspects": ["canonical"]
}
```

`canonical` is a deployment-defined TextUnit aspect, not a value reserved by the SAT-Graph core.

### Vocabulary introspection is structured

Deployment-defined vocabularies are exposed as entries containing:

```json
{
  "value": "...",
  "label": "...",
  "description": "..."
}
```

In particular, `getSupportedActionTypes` no longer returns a plain `string[]`.

The following vocabularies are deployment-defined and discoverable through introspection:

- Action types;
- Version types;
- TextUnit aspects;
- Relation predicates.

### `getVersionTextUnits` distinguishes a missing Version from an empty match set

For `GET /versions/{versionId}/text-units`:

- a nonexistent Version returns `404`;
- an existing Version with no TextUnits satisfying the optional filters returns `200 []`.

### `resolveItemReference.at` constrains temporal evidence

`at` does not make the Item itself temporal. Items remain stable, atemporal anchors. The parameter constrains the temporal evidence used when resolving an ambiguous reference.

## New search capabilities

### Exact Version-scoped ranked search

`searchTextUnits` can be scoped to an explicit set of `versionIds`. This defines the exact Version candidate universe and does not expand hierarchy implicitly.

This allows a historically reconstructed Version subtree to be used directly as the scope of ranked discovery.

### Explicit temporal predicate

When `at` is supplied, ranked TextUnit search can choose the temporal predicate:

- `validity`;
- `applicability`.

If `temporalPredicate` is omitted, `validity` is used.

`temporalPredicate` without `at` is invalid.

## Ranked search remains non-exhaustive

`hybrid`, `semanticOnly`, and `lexicalOnly` are ranked retrieval strategies. `lexicalOnly` does not request exhaustive lexical enumeration.

For exhaustive inspection of a known Version universe, enumerate the scope explicitly and retrieve its TextUnits deterministically.

## Scores and confidence values

Search `score` and resolver `confidence` remain normalized to `[0,1]`, but they are implementation-specific ranking signals. They are not probabilities or calibrated certainty measures, and comparability across different queries, scopes, deployments, or implementation states is not guaranteed unless a deployment explicitly documents otherwise.

## Removed or simplified contract elements

- legacy request schemas no longer used by the OpenAPI contract were removed;
- `citationBoost` was removed from `ContentQuery`; citation-aware ranking remains an implementation concern;
- database-specific Oracle/RRF/SQL prescriptions were removed from the normative contract;
- closed enums were removed where the vocabulary is deployment-defined.

## Domain neutrality

SAT-Graph 3.0 keeps legal information as its primary reference domain, but the core contract does not restrict deployment-defined vocabularies to legal values.

Authentication, ingestion, persistence, indexing technology, agent orchestration, logging, and audit-trail preservation remain outside the graph-model semantics. This OpenAPI profile continues to use API-key authentication.

## Auditability

The API does not itself create or preserve an audit trail. Its structured outputs and composable primitives allow consuming applications and agent harnesses to construct verifiable and auditable workflows.
