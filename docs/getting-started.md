# Getting Started with the SAT-Graph API

SAT-Graph exposes composable primitives for ranked discovery, deterministic temporal resolution, structural navigation, causal traversal, and direct retrieval over structured temporal graph data.

Legal information is the primary reference domain used in examples, but the core API is domain-neutral.

## Authentication

This OpenAPI profile uses an API key in the `Authorization` header:

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.example.com/items/item_id_123"
```

Authentication is a profile concern, not part of the SAT-Graph graph semantics.

## Core concepts

- **Item** — stable, atemporal anchor.
- **Version** — time-varying state of an Item.
- **Action** — reified state-transition event.
- **TextUnit** — textual representation attached to a graph node.
- **Theme** — thematic classification.
- **ItemType** — deployment-defined type taxonomy.
- **Relation** — typed graph relation.

## Primitive categories

| Category | Examples |
|---|---|
| Discovery & Search | `resolveItemReference`, `searchItems`, `searchTextUnits` |
| Temporal Resolution | `getValidVersions`, `getApplicableVersions`, `getItemVersions` |
| Deterministic Fetch | `getItemById`, `getVersionTextUnits`, batch fetches |
| Structural Navigation | `getItemHierarchy`, `getVersionHierarchy`, ancestors/parents/children |
| Causal Analysis | `getItemHistory`, `getActionsBySource`, `queryActions` |
| Graph Traversal | `getRelations` |
| Introspection | vocabulary, language, taxonomy, and implementation-guide endpoints |

See [Primitive Categories](ACTION_CATEGORIES.md) for the complete list.

## Runtime vocabulary discovery

Deployment-defined vocabularies can be discovered before formulating a plan:

```text
GET /meta/action-types
GET /meta/version-types
GET /meta/text-unit-aspects
GET /meta/relation-predicates
```

Each entry contains `value`, `label`, and `description`.

## First search

```bash
curl -X POST "https://api.example.com/items/search" \
  -H "Authorization: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contentQuery": {
      "semantic": {
        "queryText": "tax law amendments"
      }
    },
    "topK": 5
  }'
```

Search results are ranked. `score` is a normalized implementation-specific ranking signal, not a calibrated probability.

## Point-in-time retrieval

A typical legal-domain workflow:

```text
1. resolveItemReference("Article 6 of the Brazilian Constitution")
2. getValidVersions(itemId, at="2001-05-20T00:00:00Z")
3. getVersionTextUnits(versionId, language="pt-BR", aspects=["canonical"])
```

The first step is ranked discovery. The later steps operate on formal identifiers.

Example temporal call:

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.example.com/items/itemId/valid-versions?at=2020-01-01T00:00:00Z"
```

## TextUnit aspects

`aspect` is deployment-defined. If `aspects` is omitted from `getVersionTextUnits`, all available aspects are returned.

For an existing Version:

- matching TextUnits found → `200` with results;
- no TextUnits satisfy optional language/aspect filters → `200 []`.

A nonexistent Version returns `404`.

## Structural navigation

Item hierarchy is canonical and atemporal:

```bash
curl -G "https://api.example.com/items/itemId/hierarchy" \
  -H "Authorization: YOUR_API_KEY" \
  --data-urlencode "depth=-1"
```

Version hierarchy represents a stored structural state:

```bash
curl -G "https://api.example.com/versions/versionId/hierarchy" \
  -H "Authorization: YOUR_API_KEY" \
  --data-urlencode "depth=-1"
```

The API does not prescribe how those Version relationships were created during ingestion.

## Ranked search versus exhaustive inspection

Do not use a special `topK` value to request exhaustive search. Ranked search remains ranked.

For exhaustive inspection of an explicitly known Version scope:

```text
getVersionHierarchy(rootVersionId)
→ getBatchTextUnits(versionIds=[...], language=..., aspects=[...])
→ inspect the complete retrieved set locally
```

## Examples

The maintained examples are in [docs/examples](examples/):

- [Point-in-time retrieval](examples/01-point-in-time-retrieval.md)
- [Constitutional evolutionary analysis](examples/02-constitutional-evolutionary-analysis.md)
- [Multilingual fallback](examples/03-multilingual-fallback.md)
- [Point-in-time comparison and causal pinpointing](examples/04-point-in-time-comparison.md)
- [Case-law examples](examples/caselaw/)

## Specification and client generation

Authoritative source:

- [OpenAPI specification](../specification/openapi.yaml)

Example client generation:

```bash
openapi-generator-cli generate \
  -i specification/openapi.yaml \
  -g python \
  -o ./generated-client/python
```
