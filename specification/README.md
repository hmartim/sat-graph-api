# SAT-Graph API OpenAPI Specification

This directory contains the source OpenAPI 3.0.3 specification for the SAT-Graph API.

## Contract principles

The core contract is domain-neutral. Legal information is the primary reference domain used by the research and examples, but deployment-defined vocabularies are not restricted to legal values.

The API separates ranked discovery from deterministic graph operations:

- **Discovery & Search** — ranked, probabilistic entry points.
- **Temporal Resolution** — deterministic valid/applicable Version resolution.
- **Deterministic Fetch** — direct and batch retrieval by formal identifiers.
- **Structural Navigation** — Item and Version hierarchy traversal.
- **Graph Traversal** — typed Relation queries.
- **Causal Analysis** — Action history and provenance traversal.
- **Introspection & Metadata** — runtime discovery of vocabularies, taxonomies, languages, and implementation guidance.

## Source layout

```text
specification/
├── openapi.yaml
├── schemas/
│   ├── common/
│   │   ├── ContentQuery.yaml
│   │   ├── DataSourcesSchema.yaml
│   │   ├── ItemMetadataFilterSchema.yaml
│   │   ├── MetadataFilter.yaml
│   │   └── VocabularyEntry.yaml
│   ├── core/
│   │   ├── ID.yaml
│   │   ├── JSON.yaml
│   │   └── TimeInterval.yaml
│   ├── entities/
│   │   ├── Item.yaml
│   │   ├── ItemType.yaml
│   │   ├── Theme.yaml
│   │   ├── TextUnit.yaml
│   │   └── Version.yaml
│   ├── relationships/
│   │   ├── Action.yaml
│   │   └── Relation.yaml
│   ├── requests/
│   └── responses/
└── paths/
    ├── causal-analysis/
    ├── deterministic-fetch/
    ├── discovery/
    ├── graph-traversal/
    ├── introspection/
    ├── navigation/
    └── temporal-resolution/
```

## Endpoint categories

### Discovery & Search

- `GET /items/by-reference` — `resolveItemReference`
- `GET /themes/by-reference` — `resolveThemeReference`
- `GET /item-types/by-reference` — `resolveItemTypeReference`
- `POST /items/search` — `searchItems`
- `POST /text-units/search` — `searchTextUnits`

Ranked search never implies exhaustive enumeration merely by increasing `topK`.

### Temporal Resolution

- `GET /items/{itemId}/valid-versions` — `getValidVersions`
- `GET /items/{itemId}/applicable-versions` — `getApplicableVersions`
- `GET /items/{itemId}/versions` — `getItemVersions`
- `POST /versions/batch-valid-at` — `getBatchValidVersions`

### Structural Navigation

- `GET /items/{itemId}/children` — `getItemChildren`
- `GET /items/{itemId}/ancestors` — `getItemAncestors`
- `GET /items/{itemId}/hierarchy` — `getItemHierarchy`
- `GET /versions/{versionId}/children` — `getVersionChildren`
- `GET /versions/{versionId}/parents` — `getVersionParents`
- `GET /versions/{versionId}/ancestors` — `getVersionAncestors`
- `GET /versions/{versionId}/hierarchy` — `getVersionHierarchy`
- `GET /item-types/{itemTypeId}/hierarchy` — `getItemTypeHierarchy`
- `GET /themes/{themeId}/hierarchy` — `getThemeHierarchy`
- `POST /themes/by-items` — `getThemesForItems`

Item navigation is canonical and atemporal. Version navigation traverses stored structural states; the API does not prescribe ingestion or propagation rules.

### Graph Traversal

- `POST /query-relations` — `getRelations`

### Causal Analysis

- `GET /items/{itemId}/history` — `getItemHistory`
- `GET /items/{sourceWorkId}/actions-caused` — `getActionsBySource`
- `POST /query-actions` — `queryActions`

### Deterministic Fetch

Single-resource fetch:

- `GET /items/{itemId}`
- `GET /versions/{versionId}`
- `GET /actions/{actionId}`
- `GET /themes/{themeId}`
- `GET /item-types/{itemTypeId}`
- `GET /relations/{relationId}`
- `GET /text-units/{textUnitId}`
- `GET /versions/{versionId}/text-units`

Batch fetch:

- `POST /items/batch-get`
- `POST /versions/batch-get`
- `POST /actions/batch-get`
- `POST /text-units/batch-get`
- `POST /item-types/batch-get`

### Introspection & Metadata

- `GET /meta/languages` — `getAvailableLanguages`
- `GET /meta/action-types` — `getSupportedActionTypes`
- `GET /meta/version-types` — `getSupportedVersionTypes`
- `GET /meta/text-unit-aspects` — `getSupportedTextUnitAspects`
- `GET /meta/relation-predicates` — `getSupportedRelationPredicates`
- `GET /meta/implementation-guide` — `getImplementationGuide`
- `GET /item-types/roots` — `getRootItemTypes`
- `GET /themes/roots` — `getRootThemes`

Deployment-defined vocabularies return structured `VocabularyEntry` objects with `value`, `label`, and `description`.

## TextUnit aspects

`TextUnit.aspect` is an open deployment-defined vocabulary. If optional `aspects` filters are omitted, the relevant endpoint considers or returns all aspects according to its contract. Legal-domain deployments may define values such as `canonical`, `summary`, `ratio`, `facts`, or `holding`.

## Search score semantics

Search `score` and resolver `confidence` fields are normalized to `[0,1]`, but are implementation-specific ranking signals. They are not calibrated probabilities or certainty measures. Cross-query or cross-deployment comparability is not guaranteed unless an implementation explicitly documents it.

## Security profile

Authentication is not part of the SAT-Graph graph semantics. This OpenAPI profile uses API-key authentication. Other deployments may use different security mechanisms while preserving the API's graph and retrieval semantics.

## Working with the specification

Validate source files:

```bash
npm run validate
```

Generate the single-file bundle:

```bash
npm run bundle
```

Validate the generated bundle:

```bash
npm run validate-bundled
```

`openapi-bundled.yaml` is generated and should not be edited manually.

## Agent-oriented metadata

Each operation uses the `x-sat-graph-agent` vendor extension for compact, client-independent usage guidance. See [X-SAT-GRAPH-AGENT-CONVENTION.md](X-SAT-GRAPH-AGENT-CONVENTION.md).

## Related material

- [Repository README](../README.md)
- [Scope and Boundaries](../docs/SCOPE.md)
- [Primitive Categories](../docs/ACTION_CATEGORIES.md)
- [Error Handling](../docs/ERROR_HANDLING.md)
- [Metadata Best Practices](../docs/METADATA_BEST_PRACTICES.md)
