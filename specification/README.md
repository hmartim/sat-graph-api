# SAT-Graph API OpenAPI Specification

This directory contains the complete OpenAPI 3.0.3 specification for the **SAT-Graph API**, a formal interface for querying the Structure-Aware Temporal Graph (SAT-Graph) RAG system.

## 📚 Overview

The API provides atomic and composable primitives for constructing reliable retrieval plans with full temporal awareness and structural navigation capabilities.

**Related Papers:**
- [Deterministic Legal Agents: A Canonical Primitive API for Auditable Reasoning over Temporal Knowledge Graphs](https://arxiv.org/abs/2510.06002) — this specification
- [An Ontology-Driven Graph RAG for Legal Norms: A Structural, Temporal, and Deterministic Approach](https://arxiv.org/abs/2505.00039) — SAT-Graph knowledge substrate

## 🎯 API Architecture: Canonical Core + Extensions

This specification is organized into two complementary layers:

### **1. Canonical Core API** (Based on the Research Paper)
The foundational set of primitives formally specified in the research paper, focusing on:
- **SAT-Graph Ontology**: Item (Work/Component), Version, Action, Theme, ItemType, TextUnit, Relation
- **Temporal Reasoning**: Point-in-time queries, version resolution, causal tracing
- **Deterministic Retrieval**: Verifiable, auditable query execution
- **Structural Navigation**: Hierarchical traversal and thematic classification

This core represents the **minimal set of primitives** required for trustworthy retrieval.

### **2. Extended API** (Production Enhancements)
Additional capabilities designed for production use cases, including:
- **Convenience Operations**: Optimized endpoints for common UI/UX patterns
- **Additional Metadata**: Extended introspection and configuration queries

**Design Principle:** Extensions must not compromise the deterministic guarantees of the canonical core. All extended operations maintain the same principles of composability, auditability, and verifiability.

## 📁 Directory Structure

```
specification/
├── openapi.yaml                    # Main OpenAPI specification file (entry point)
├── schemas/
│   ├── common/                     # Shared schemas used in both requests & responses
│   │   ├── ContentQuery.yaml       # Unified semantic + lexical query structure
│   │   ├── DataSourcesSchema.yaml
│   │   ├── ItemMetadataFilterSchema.yaml
│   │   └── MetadataFilter.yaml
│   ├── core/                       # Primitive/foundational types
│   │   ├── ID.yaml
│   │   ├── JSON.yaml
│   │   └── TimeInterval.yaml
│   ├── entities/                   # Domain entity models (graph nodes)
│   │   ├── Item.yaml               # Works/documents and Work Components
│   │   ├── ItemType.yaml           # Structural type taxonomy
│   │   ├── Theme.yaml              # Thematic classifications
│   │   ├── TextUnit.yaml           # Searchable text fragments
│   │   └── Version.yaml            # Temporal snapshots of items
│   ├── relationships/              # Graph edge models
│   │   ├── Action.yaml             # Causal state-transition events
│   │   └── Relation.yaml           # Typed semantic cross-references
│   ├── requests/                   # Request body schemas (12 files)
│   │   ├── GetActionsRequest.yaml
│   │   ├── GetBatchActionsRequest.yaml
│   │   ├── GetBatchItemsRequest.yaml
│   │   ├── GetBatchItemTypesRequest.yaml
│   │   ├── GetBatchTextUnitsRequest.yaml
│   │   ├── GetBatchValidVersionsRequest.yaml
│   │   ├── GetBatchVersionsRequest.yaml
│   │   ├── GetItemHierarchyRequest.yaml
│   │   ├── GetRelationsRequest.yaml
│   │   ├── GetVersionsInIntervalRequest.yaml
│   │   ├── SearchItemsRequest.yaml
│   │   └── SearchTextUnitsRequest.yaml
│   └── responses/                  # Response body schemas (9 files)
│       ├── CausalityTrace.yaml
│       ├── ErrorResponse.yaml
│       ├── HierarchyResponse.yaml
│       ├── ResolvedItemCandidate.yaml
│       ├── ResolvedItemTypeCandidate.yaml
│       ├── ResolvedThemeCandidate.yaml
│       ├── SearchedItemResult.yaml
│       ├── SearchedTextUnitResult.yaml
│       └── TextDiffReport.yaml
└── paths/                          # Path/endpoint definitions
    ├── analysis/                   # Comparative analysis (1 endpoint)
    │   └── compare-versions.yaml
    ├── causal-analysis/            # Event tracing and legislative lineage (3 endpoints)
    │   ├── get-actions-by-source.yaml
    │   ├── get-item-history.yaml
    │   └── query-actions.yaml
    ├── deterministic-fetch/        # Direct ID-based retrieval (13 endpoints)
    │   ├── get-action-by-id.yaml
    │   ├── get-batch-actions.yaml
    │   ├── get-batch-item-types.yaml
    │   ├── get-batch-items.yaml
    │   ├── get-batch-text-units.yaml
    │   ├── get-batch-versions.yaml
    │   ├── get-item-by-id.yaml
    │   ├── get-item-type-by-id.yaml
    │   ├── get-relation-by-id.yaml
    │   ├── get-text-unit-by-id.yaml
    │   ├── get-theme-by-id.yaml
    │   ├── get-version-by-id.yaml
    │   └── get-version-text-units.yaml
    ├── discovery/                  # Search & entity resolution (5 endpoints)
    │   ├── resolve-item-reference.yaml
    │   ├── resolve-item-type-reference.yaml
    │   ├── resolve-theme-reference.yaml
    │   ├── search-items.yaml
    │   └── search-text-units.yaml
    ├── graph-traversal/            # Relationship queries (1 endpoint)
    │   └── get-relations.yaml
    ├── introspection/              # System metadata and schema queries (4 endpoints)
    │   ├── get-available-languages.yaml
    │   ├── get-root-item-types.yaml
    │   ├── get-root-themes.yaml
    │   └── get-supported-action-types.yaml
    ├── navigation/                 # Structural hierarchy traversal (10 endpoints)
    │   ├── get-item-ancestors.yaml
    │   ├── get-item-children.yaml
    │   ├── get-item-hierarchy.yaml
    │   ├── get-item-type-hierarchy.yaml
    │   ├── get-theme-hierarchy.yaml
    │   ├── get-themes-for-items.yaml
    │   ├── get-version-ancestors.yaml
    │   ├── get-version-children.yaml
    │   ├── get-version-hierarchy.yaml
    │   └── get-version-parents.yaml
    └── temporal-resolution/        # Point-in-time version resolution (4 endpoints)
        ├── get-applicable-versions.yaml
        ├── get-batch-valid-versions.yaml
        ├── get-item-versions.yaml
        └── get-valid-versions.yaml
```

## 🎯 API Endpoint Categories

**Legend:** 📘 = Canonical Core | 🔷 = Extended API

### 1. **Discovery & Search** 📘 (`/paths/discovery/`)
Probabilistic entry points for translating natural language into canonical graph anchors.
- 📘 `GET /items/by-reference` — `resolveItemReference`: Resolve a natural-language or URN reference to a ranked list of Item candidates
- 📘 `GET /themes/by-reference` — `resolveThemeReference`: Resolve a subject description to ranked Theme candidates
- 📘 `GET /item-types/by-reference` — `resolveItemTypeReference`: Resolve a structural type reference to ranked ItemType candidates
- 📘 `POST /items/search` — `searchItems`: Hybrid search for stable Items by concept, expression, or metadata
- 📘 `POST /text-units/search` — `searchTextUnits`: Hybrid semantic + lexical search for TextUnits (primary RAG entry point)

### 2. **Temporal Resolution** 📘 (`/paths/temporal-resolution/`)
Deterministic point-in-time version resolution after canonical anchoring.
- 📘 `GET /items/{itemId}/valid-versions` — `getValidVersions`: Versions of an Item valid at a given time (bi-temporal)
- 📘 `GET /items/{itemId}/applicable-versions` — `getApplicableVersions`: Versions materially applicable at a given time
- 📘 `GET /items/{itemId}/versions` — `getItemVersions`: Full chronological version history of an Item
- 📘 `POST /versions/batch-valid-at` — `getBatchValidVersions`: Batch point-in-time resolution for multiple Items

### 3. **Structural Navigation** 📘 (`/paths/navigation/`)
Traversal of the structural hierarchy and taxonomic structures.
- 📘 `GET /items/{itemId}/children` — `getItemChildren`: Immediate structural children of an Item
- 📘 `GET /items/{itemId}/ancestors` — `getItemAncestors`: Ordered ancestor chain of an Item up to the root
- 📘 `GET /items/{itemId}/hierarchy` — `getItemHierarchy`: All descendant Item IDs (depth-bounded)
- 📘 `GET /versions/{versionId}/children` — `getVersionChildren`: Child Versions at a point in time
- 📘 `GET /versions/{versionId}/parents` — `getVersionParents`: Parent Versions at a point in time
- 📘 `GET /versions/{versionId}/ancestors` — `getVersionAncestors`: Ancestor Version chain at a point in time
- 📘 `GET /versions/{versionId}/hierarchy` — `getVersionHierarchy`: Full Version subtree at a point in time
- 📘 `GET /item-types/{itemTypeId}/hierarchy` — `getItemTypeHierarchy`: Expand a structural type taxonomy subtree
- 📘 `GET /themes/{themeId}/hierarchy` — `getThemeHierarchy`: Expand a conceptual taxonomy subtree
- 📘 `POST /themes/by-items` — `getThemesForItems`: Map Items to their associated Themes

### 4. **Graph Traversal** 🔷 (`/paths/graph-traversal/`)
Typed traversal of semantic cross-references between entities.
- 🔷 `POST /query-relations` — `getRelations`: Query Relation objects by anchor, predicate, direction, and temporal validity

### 5. **Causal Analysis** 📘 (`/paths/causal-analysis/`)
Event tracing, legislative lineage, and forward impact analysis.
- 📘 `GET /items/{itemId}/history` — `getItemHistory`: Chronological timeline of Actions that affected an Item
- 📘 `GET /items/{sourceWorkId}/actions-caused` — `getActionsBySource`: Actions authorized by a source Work (forward causality)
- 📘 `POST /query-actions` — `queryActions`: Batch query of Actions by items, versions, types, and time window

### 6. **Analysis** 📘 (`/paths/analysis/`)
Comparative analysis operations.
- 📘 `POST /versions/compare` — `compareVersions`: Compute a textual diff between two Versions

### 7. **Deterministic Fetch** 📘 + 🔷 (`/paths/deterministic-fetch/`)
Direct retrieval of full entity objects by their canonical identifiers.

**Single-entity fetch:**
- 📘 `GET /items/{itemId}` — `getItemById`
- 📘 `GET /versions/{versionId}` — `getVersionById`
- 📘 `GET /actions/{actionId}` — `getActionById`
- 📘 `GET /themes/{themeId}` — `getThemeById`
- 📘 `GET /item-types/{itemTypeId}` — `getItemTypeById`
- 📘 `GET /versions/{versionId}/text-units` — `getVersionTextUnits`: TextUnits of a Version, filtered by language and aspect
- 🔷 `GET /relations/{relationId}` — `getRelationById`
- 🔷 `GET /text-units/{textUnitId}` — `getTextUnitById`

**Batch fetch:**
- 📘 `POST /items/batch-get` — `getBatchItems`
- 📘 `POST /versions/batch-get` — `getBatchVersions`
- 📘 `POST /actions/batch-get` — `getBatchActions`
- 📘 `POST /text-units/batch-get` — `getBatchTextUnits`
- 📘 `POST /item-types/batch-get` — `getBatchItemTypes`

### 8. **Introspection & Metadata** 📘 (`/paths/introspection/`)
Schema discovery primitives that allow an agent to query available vocabularies before formulating a plan.
- 📘 `GET /item-types/roots` — `getRootItemTypes`: Root nodes of the structural type taxonomy
- 📘 `GET /themes/roots` — `getRootThemes`: Root nodes of the conceptual taxonomy
- 📘 `GET /meta/action-types` — `getSupportedActionTypes`: Canonical Action type vocabulary
- 📘 `GET /meta/languages` — `getAvailableLanguages`: BCP 47 language codes available in the text index

## 🔧 Working with the Specification

### Viewing the Specification

**Option 1: Swagger UI**
```bash
# Upload openapi-bundled.yaml to https://editor.swagger.io/
```

**Option 2: Redoc**
```bash
npx @redocly/cli preview-docs openapi.yaml
```

**Option 3: VS Code**
Install the "OpenAPI (Swagger) Editor" extension for inline validation and preview.

### Validation

```bash
# Using Redocly CLI
npx @redocly/cli lint openapi.yaml

# Using Spectral
npx @stoplight/spectral-cli lint openapi.yaml
```

### Code Generation

Generate client SDKs or server stubs:

```bash
# Python client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client

# TypeScript/Axios client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/typescript-client

# FastAPI server stub
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g python-fastapi \
  -o ./generated/fastapi-server
```

## 📝 Naming Conventions

The specification follows consistent naming conventions:

| Element | Convention | Example |
|---------|-----------|---------|
| **Schema names** | PascalCase | `SearchTextUnitsRequest`, `ResolvedItemCandidate` |
| **File names** | kebab-case | `get-item-by-id.yaml`, `search-items.yaml` |
| **Operation IDs** | camelCase | `searchItems`, `getValidVersions` |
| **Path parameters** | camelCase | `itemId`, `versionId`, `sourceWorkId` |
| **Query parameters** | camelCase | `topK`, `dataSources` |
| **Property names** | camelCase | `itemIds`, `themeIds`, `topK` |

## 🔐 Authentication

All endpoints require API Key authentication via the `Authorization` header:

```http
Authorization: YOUR_API_KEY
```

API Keys are scoped to specific **DataSources** (data providers). Requests are automatically filtered to only return data from authorized data sources.

## 🌐 Data Scoping with DataSources

The API serves data from multiple providers called **DataSources**. All requests are automatically scoped to the data sources granted to your API key.

Many endpoints accept an optional `dataSources` parameter to further narrow the scope:

```json
{
  "query": "constitutional rights",
  "dataSources": ["dataSource_Senate", "dataSource_STF"]
}
```

## 🏗️ Schema Organization Rationale

### `schemas/common/`
Shared schemas used as parameters in **both** requests and responses:
- `ContentQuery` — Unified hybrid search structure (semantic + lexical + clauses)
- `DataSourcesSchema` — List of data source identifiers
- `MetadataFilter` — Metadata filtering structure
- `ItemMetadataFilterSchema` — Item-specific metadata filters

### `schemas/core/`
Primitive, foundational types used throughout the API:
- `ID` — URN-based unique identifiers
- `JSON` — Generic JSON objects
- `TimeInterval` — ISO 8601 time ranges

### `schemas/entities/`
Core domain models representing graph nodes:
- `Item` — Works (laws, regulations) and Work Components (Title, Article, Paragraph, etc.)
- `ItemType` — Structural type taxonomy nodes (e.g., "Constitution", "Article")
- `Theme` — Hierarchical topic classifications (poly-hierarchical DAG)
- `Version` — Temporal snapshots of Items with validity and applicability intervals
- `TextUnit` — Searchable text fragments linked to graph entities; supports multi-aspect retrieval (canonical text, summaries, indexical names, textual metadata)

### `schemas/relationships/`
Graph edge models representing connections:
- `Action` 📘 — Reified state-transition events (amendments, revocations, promulgations) — **Canonical Core**
- `Relation` 🔷 — Typed semantic cross-references between entities (citations, dependencies, implementations) — **Extended API**

### `schemas/requests/` & `schemas/responses/`
Input/output data transfer objects specific to endpoints.

---

## 🔷 Extended API: Relations System

The **Relation** entity and associated Graph Traversal endpoint represent a production extension to the canonical SAT-Graph model.

### Purpose
Enables a **semantic overlay graph** for capturing cross-document relationships that are not strictly structural or causal, such as:
- Citations between documents
- Succession relationships (one law replacing another)
- Applicability scopes (one norm applying to another)
- Conceptual relationships (definitions, cross-references)

### Relation Schema
```yaml
Relation:
  id: ID
  sourceType: "Item" | "Version"
  sourceId: ID
  predicate: string          # e.g., "eli:cites", "succeeds", "applies_to"
  targetType: "Item" | "Version"
  targetId: ID
  validityInterval?: TimeInterval
  metadata?: JSON
```

### When to Use
- **Use Relations for:** Cross-document citations, semantic references, discovered connections
- **Use Actions for:** Temporal causality, legislative events, version transitions
- **Use Item/Version hierarchy for:** Structural containment (articles in chapters, etc.)

## 📊 Key Design Principles

1. **Temporal Awareness**: All entities support time-based queries with bi-temporal semantics (valid time + transaction time)
2. **Deterministic Retrieval**: Canonical IDs enable exact, reproducible fetches after anchoring
3. **Composable Primitives**: Atomic operations combine into complex agentic workflows
4. **Hybrid Search**: Semantic + lexical + structural queries through `ContentQuery`
5. **Graph Navigation**: Rich relationship traversal across structural, taxonomic, and semantic dimensions
6. **Auditability**: Every primitive call returns structured, logged output; causal traces and version history are first-class

## 🤝 Contributing

When modifying the specification:

1. **Maintain consistency** — Follow existing naming conventions
2. **Update both files** — Edit both `openapi.yaml` references and individual schema/path files
3. **Validate** — Run `npx @redocly/cli lint openapi.yaml` before committing
4. **Document changes** — Update this README if adding new categories or schemas
5. **Test references** — Ensure all `$ref` paths resolve correctly

## 📖 Further Reading

- [OpenAPI 3.0.3 Specification](https://spec.openapis.org/oas/v3.0.3)
- [SAT-Graph API Paper on arXiv](https://arxiv.org/abs/2510.06002)
- [SAT-Graph RAG Paper on arXiv](https://arxiv.org/abs/2505.00039)
- [Redocly CLI Documentation](https://redocly.com/docs/cli/)
- [OpenAPI Generator](https://openapi-generator.tech/)

## 📄 License

[Include your license information here]

---

**Last Updated**: 2026-04-28
**OpenAPI Version**: 3.0.3
**API Version**: 1.0.0
