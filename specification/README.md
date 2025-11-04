# SAT-Graph API OpenAPI Specification

This directory contains the complete OpenAPI 3.0.3 specification for the **SAT-Graph API**, a formal interface for querying the Structure-Aware Temporal Graph (SAT-Graph) RAG system.

## 📚 Overview

The API provides atomic and composable actions for constructing reliable retrieval plans with full temporal awareness and structural navigation capabilities.

**Related Paper:** [An Ontology-Driven Graph RAG for Legal Norms: A Structural, Temporal, and Deterministic Approach](https://arxiv.org/abs/2508.00827)

## 🎯 API Architecture: Canonical Core + Extensions

This specification is organized into two complementary layers:

### **1. Canonical Core API** (Based on the Research Paper)
The foundational set of actions formally specified in the research paper, focusing on:
- **SAT-Graph Ontology**: Item (Work/Component), Version, Action, Theme, TextUnit
- **Temporal Reasoning**: Point-in-time queries, version resolution, causal tracing
- **Deterministic Retrieval**: Verifiable, auditable query execution
- **Structural Navigation**: Hierarchical traversal and thematic classification

This core represents the **minimal set of primitives** required for trustworthy retrieval.

### **2. Extended API** (Production Enhancements)
Additional capabilities designed for production use cases, including:
- **Relation System**: Generic directed relations (e.g., citations, references, dependencies)
  - Enables semantic overlay graph for cross-document analysis
  - Supports predicates: "cites", "succeeds", "related_to", "applies_to", "defined_in"
  - Aligns with "Future Directions" outlined in the research paper
- **Convenience Operations**: Optimized endpoints for common UI/UX patterns
- **Additional Metadata**: Extended introspection and configuration queries

**Design Principle:** Extensions must not compromise the deterministic guarantees of the canonical core. All extended operations maintain the same principles of composability, auditability, and verifiability.

## 📁 Directory Structure

```
specification/
├── openapi.yaml              # Main OpenAPI specification file (entry point)
├── schemas/                  # All schema definitions
│   ├── common/              # Shared schemas used in both requests & responses
│   │   ├── DatasourcesSchema.yaml
│   │   ├── ItemMetadataFilterSchema.yaml
│   │   └── MetadataFilter.yaml
│   ├── core/                # Primitive/foundational types
│   │   ├── ID.yaml
│   │   ├── JSON.yaml
│   │   ├── TemporalPolicy.yaml
│   │   └── TimeInterval.yaml
│   ├── entities/            # Domain entity models
│   │   ├── Item.yaml        # Works/documents and Work/Document components
│   │   ├── Version.yaml     # Temporal versions of items
│   │   ├── Theme.yaml       # Thematic classifications
│   │   └── TextUnit.yaml    # Searchable text fragments
│   ├── relationships/       # Graph relationship models
│   │   ├── Action.yaml      # Causal actions (amendments, revocations)
│   │   └── Relation.yaml    # Generic directed relations
│   ├── requests/            # Request body schemas (8 files)
│   │   ├── SearchItemsRequest.yaml
│   │   ├── SearchTextUnitsRequest.yaml
│   │   ├── GetItemHierarchyRequest.yaml
│   │   ├── GetRelationsRequest.yaml
│   │   ├── GetBatchActionsRequest.yaml
│   │   ├── GetBatchItemsRequest.yaml
│   │   ├── GetBatchValidVersionsRequest.yaml
│   │   └── SummarizeImpactRequest.yaml
│   └── responses/           # Response body schemas (8 files)
│       ├── StructuralContext.yaml
│       ├── ResolvedEntityCandidate.yaml
│       ├── SearchResultUnit.yaml
│       ├── SearchedItemResult.yaml
│       ├── ErrorResponse.yaml
│       ├── CausalityTrace.yaml
│       ├── ImpactReport.yaml
│       └── TextDiffReport.yaml
└── paths/                   # Path/endpoint definitions (32 files)
    ├── discovery/           # Search & entity resolution (4 endpoints)
    │   ├── resolve-item-reference.yaml
    │   ├── resolve-theme-reference.yaml
    │   ├── search-items.yaml
    │   └── search-text-units.yaml
    ├── deterministic-fetch/ # Direct ID-based retrieval (8 endpoints)
    │   ├── get-action-by-id.yaml
    │   ├── get-item-by-id.yaml
    │   ├── get-relation-by-id.yaml
    │   ├── get-theme-by-id.yaml
    │   ├── get-text-unit-by-id.yaml
    │   ├── get-version-by-id.yaml
    │   ├── get-batch-actions.yaml
    │   ├── get-batch-items.yaml
    │   └── get-batch-valid-versions.yaml
    ├── navigation/          # Structural traversal (3 endpoints)
    │   ├── enumerate-items.yaml
    │   ├── get-item-ancestors.yaml
    │   └── get-themes-for-item.yaml
    ├── graph-traversal/     # Relationship queries (2 endpoints)
    │   ├── find-related-entities.yaml
    │   └── get-relations.yaml
    ├── causal-analysis/     # Temporal & version analysis (7 endpoints)
    │   ├── get-valid-version.yaml
    │   ├── get-version-text-unit.yaml
    │   ├── get-item-history.yaml
    │   ├── trace-causality.yaml
    │   ├── get-versions-in-interval.yaml
    │   ├── compare-versions.yaml
    │   └── get-actions-by-source.yaml
    ├── aggregate-analysis/  # Summary operations (1 endpoint)
    │   └── summarize-impact.yaml
    └── introspection/       # Metadata & system info (4 endpoints)
        ├── get-temporal-coverage.yaml
        ├── get-available-languages.yaml
        ├── get-supported-action-types.yaml
        └── get-root-themes.yaml
```

## 🎯 API Endpoint Categories

**Legend:** 📘 = Canonical Core | 🔷 = Extended API

### 1. **Discovery & Search** 📘 (`/paths/discovery/`)
Search and resolve entities using semantic, lexical, or structured queries.
- 📘 `POST /search-items` - Search for items
- 📘 `POST /search-text-units` - Hybrid search for text fragments (primary RAG entry point)
- 📘 `POST /resolve-item-reference` - Resolve natural language references to items
- 📘 `POST /resolve-theme-reference` - Resolve natural language references to themes

### 2. **Deterministic Fetch** 📘 + 🔷 (`/paths/deterministic-fetch/`)
Direct retrieval of entities by their unique identifiers.

**Core Entities:**
- 📘 `GET /items/{itemId}` - Get item by ID
- 📘 `GET /versions/{versionId}` - Get version by ID
- 📘 `GET /actions/{actionId}` - Get action by ID
- 📘 `GET /themes/{themeId}` - Get theme by ID

**Extended Entities:**
- 🔷 `GET /relations/{relationId}` - Get relation by ID
- 🔷 `GET /text-units/{textUnitId}` - Get text unit by ID (convenience)

**Batch Operations:**
- 📘 `POST /items/batch-get` - Batch retrieve items
- 📘 `POST /versions/batch-valid-at` - Batch retrieve valid versions at a timestamp
- 📘 `POST /actions/batch-get` - Batch retrieve actions
- 📘 `POST /text-units/batch-get` - Batch retrieve text units

### 3. **Navigation** 📘 + 🔷 (`/paths/navigation/`)
Traverse the structural hierarchy of documents.
- 📘 `GET /items/{itemId}/ancestors` - Get hierarchical ancestors
- 📘 `GET /items/{itemId}/themes` - Get associated themes
- 📘 `POST /enumerate-items` - Enumerate items within a scope
- 🔷 `GET /items/{itemId}/context` - Get structural context (convenience)

### 4. **Graph Traversal** 🔷 (`/paths/graph-traversal/`)
Query and navigate entity relationships (**Extended API** - semantic overlay).
- 🔷 `GET /entities/{entityId}/related` - Find related entities
- 🔷 `POST /query-relations` - Query relations by criteria

### 5. **Causal Analysis** 📘 (`/paths/causal-analysis/`)
Temporal reasoning and version tracking.
- 📘 `GET /items/{itemId}/valid-version` - Get temporally valid version
- 📘 `GET /versions/{versionId}/text-unit` - Get text content of a version
- 📘 `GET /items/{itemId}/history` - Get complete version history
- 📘 `GET /versions/{versionId}/causality` - Trace causal chain
- 📘 `GET /items/{itemId}/versions` - Get versions in time interval
- 📘 `POST /versions/compare` - Compare two versions (diff)
- 📘 `GET /items/{sourceWorkId}/actions-caused` - Get actions caused by a source

### 6. **Aggregate Analysis** 📘 (`/paths/aggregate-analysis/`)
Summary and impact analysis operations.
- 📘 `POST /analysis/impact-summary` - Summarize impact

### 7. **Introspection & Metadata** 📘 (`/paths/introspection/`)
System metadata and available options.
- 📘 `GET /items/{itemId}/temporal-coverage` - Get temporal coverage
- 📘 `GET /meta/languages` - List available languages
- 📘 `GET /meta/action-types` - List supported action types
- 📘 `GET /themes/roots` - Get root theme nodes

## 🔧 Working with the Specification

### Viewing the Specification

**Option 1: Swagger UI**
```bash
# Install Swagger UI or use online editor
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
| **Schema names** | PascalCase | `SearchItemsRequest`, `ResolvedEntityCandidate` |
| **File names** | kebab-case | `get-item-by-id.yaml`, `search-items.yaml` |
| **Operation IDs** | camelCase | `searchItems`, `getValidVersion` |
| **Path parameters** | camelCase | `itemId`, `versionId`, `sourceWorkId` |
| **Query parameters** | snake_case / camelCase | `top_k`, `datasources` |
| **Property names** | snake_case | `item_ids`, `theme_ids`, `temporal_policy` |

## 🔐 Authentication

All endpoints require API Key authentication via the `Authorization` header:

```http
Authorization: YOUR_API_KEY
```

API Keys are scoped to specific **Datasources** (data providers). Requests are automatically filtered to only return data from authorized datasources.

## 🌐 Data Scoping with Datasources

The API serves data from multiple providers called **Datasources**. All requests are automatically scoped to the datasources granted to your API key.

Many endpoints accept an optional `datasources` parameter to further narrow the scope:

```json
{
  "query": "constitutional rights",
  "datasources": ["datasource_Senate", "datasource_STF"]
}
```

## 🏗️ Schema Organization Rationale

### `schemas/common/`
Shared schemas used as parameters in **both** requests and responses:
- `DatasourcesSchema` - List of datasource identifiers
- `MetadataFilter` - Metadata filtering structure
- `ItemMetadataFilterSchema` - Item-specific metadata filters

### `schemas/core/`
Primitive, foundational types used throughout the API:
- `ID` - URN-based unique identifiers
- `JSON` - Generic JSON objects
- `TimeInterval` - ISO 8601 time ranges
- `TemporalPolicy` - Temporal resolution strategies

### `schemas/entities/`
Core domain models representing graph nodes:
- `Item` - Works (laws, regulations, etc.) and Work Components (Title, Article etc.)
- `Version` - Temporal snapshots of items
- `Theme` - Hierarchical topic classifications
- `TextUnit` - Searchable text fragments (and metadata, descriptions, alternative identifiers and names etc.) with embeddings

### `schemas/relationships/`
Graph edge models representing connections:
- `Action` 📘 - Causal modifications (amendments, revocations) - **Canonical Core**
- `Relation` 🔷 - Generic typed relations between entities - **Extended API**

### `schemas/requests/` & `schemas/responses/`
Input/output data transfer objects specific to endpoints.

---

## 🔷 Extended API: Relations System

The **Relation** entity and associated Graph Traversal endpoints represent a planned extension beyond the canonical SAT-Graph model described in the research paper.

### Purpose
Enables a **semantic overlay graph** for capturing cross-document relationships that are not strictly structural or causal, such as:
- Citations between documents
- Succession relationships (one law replacing another)
- Applicability scopes (one norm applying to another)
- Conceptual relationships (definitions, references)

### Relation Schema
```yaml
Relation:
  id: ID
  source_type: "Item" | "Version"
  source_id: ID
  predicate: "cites" | "succeeds" | "related_to" | "applies_to" | "defined_in"
  target_type: "Item" | "Version"
  target_id: ID
  validity_interval?: TimeInterval
  metadata?: JSON
```

### Design Rationale
The research paper (Article.tex) deliberately focuses on the **verifiable core**: structural hierarchy, temporal versions, and causal actions. It mentions in "Future Directions" (Section 6.2) the need for:
> *"a parallel 'semantic overlay' graph that captures relationships like citations... introduce a corresponding new set of API actions, such as findReferencingItems(item_id)"*

This specification **implements that future vision** as a production-ready extension while maintaining clear separation from the canonical core.

### Guarantees
- Relations are **first-class entities** with unique IDs
- Queries remain **auditable** with explicit predicates
- Optional `validity_interval` enables **temporal reasoning** over relations
- System maintains **composability** - relation queries can be chained with core operations

### When to Use
- **Use Relations for:** Cross-document citations, semantic references, discovered connections
- **Use Actions for:** Temporal causality, events, version transitions
- **Use Item hierarchy for:** Structural containment (articles in chapters, etc.)

## 📊 Key Design Principles

1. **Temporal Awareness**: All entities support time-based queries
2. **Deterministic Retrieval**: IDs enable exact, reproducible fetches
3. **Composable Actions**: Atomic operations combine into complex workflows
4. **Hybrid Search**: Semantic + lexical + structural queries
5. **Graph Navigation**: Rich relationship traversal capabilities
6. **Auditability**: Causal traces and version history tracking

## 🤝 Contributing

When modifying the specification:

1. **Maintain consistency** - Follow existing naming conventions
2. **Update both files** - Edit both `openapi.yaml` references and individual schema/path files
3. **Validate** - Run `npx @redocly/cli lint openapi.yaml` before committing
4. **Document changes** - Update this README if adding new categories or schemas
5. **Test references** - Ensure all `$ref` paths resolve correctly

## 📖 Further Reading

- [OpenAPI 3.0.3 Specification](https://spec.openapis.org/oas/v3.0.3)
- [SAT-Graph Paper on arXiv](ttps://arxiv.org/abs/2508.00827)
- [Redocly CLI Documentation](https://redocly.com/docs/cli/)
- [OpenAPI Generator](https://openapi-generator.tech/)

## 📄 License

[Include your license information here]

---

**Last Updated**: 2025-10-05
**OpenAPI Version**: 3.0.3
**API Version**: 1.0.0
