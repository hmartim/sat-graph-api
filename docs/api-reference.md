# API Reference

Complete technical reference for the Canonical Action API endpoints, data models, and operations.

## Base URL

```
https://api.example.com
```

## Authentication

All endpoints require API key authentication via the `Authorization` header:

```
Authorization: YOUR_API_KEY
```

## Endpoint Categories

The API is organized into functional categories:

### Discovery & Search Actions
Probabilistic entry points for finding entities based on natural language or structured criteria.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search-items` | POST | Search for Items using semantic or lexical queries |
| `/search-themes` | POST | Search for Themes using semantic or lexical queries |
| `/search-text-units` | POST | Search within textual content across versions |
| `/resolve-item-reference` | POST | Resolve natural language references to canonical Item IDs |
| `/resolve-theme-reference` | POST | Resolve natural language references to canonical Theme IDs |

### Deterministic Fetch Actions
Guaranteed retrieval of full data objects using their canonical IDs.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/items/{itemId}` | GET | Get a single Item by its canonical ID |
| `/themes/{themeId}` | GET | Get a single Theme by its canonical ID |
| `/versions/{versionId}` | GET | Get a single Version by its canonical ID |
| `/text-units/{textUnitId}` | GET | Get a single TextUnit by its canonical ID |
| `/relations/{relationId}` | GET | Get a single Relation by its canonical ID |
| `/actions/{actionId}` | GET | Get a single Action by its canonical ID |

### Structural Navigation Actions
Actions for traversing the atemporal document hierarchy.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/items/{itemId}/ancestors` | GET | Get hierarchical ancestors of an Item |
| `/items/{itemId}/context` | GET | Get complete structural context (parent, siblings, children) |
| `/items/{itemId}/themes` | GET | Get all Themes associated with an Item |
| `/items/{itemId}/valid-version` | GET | Get the Version of an Item valid at a specific timestamp |
| `/enumerate-items` | POST | Enumerate Items within a structural or thematic scope |

### Graph Traversal Actions
Actions for exploring relationships and connections between entities.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/entities/{entityId}/related` | GET | Find related entities by traversing specific relationships |
| `/query-relations` | POST | Query Relation objects with flexible criteria |
| `/versions/{versionId}/text-unit` | GET | Get the TextUnit associated with a specific Version |

## Data Models

### Core Entities

#### Item
Timeless, structural entities representing documents, articles, concepts, or named entities.

```json
{
  "id": "urn:lex:br:federal:lei:1990-07-20;8069",
  "category": "Work",
  "type": "Statute",
  "label": "Statute of Children and Adolescents",
  "parent": "urn:lex:br:federal:constituicao:1988-10-05",
  "children": ["urn:lex:br:federal:lei:1990-07-20;8069;art1"],
  "metadata": {
    "jurisdiction": "federal",
    "publication_date": "1990-07-20"
  }
}
```

#### Version
Temporal snapshots representing the state of an Item during a specific time interval.

```json
{
  "id": "urn:lex:br:federal:lei:1990-07-20;8069@1990-07-20",
  "item_id": "urn:lex:br:federal:lei:1990-07-20;8069",
  "validity_interval": {
    "start_time": "1990-07-20T00:00:00Z",
    "end_time": null
  },
  "metadata": {
    "status": "active"
  }
}
```

#### Action
Reified legislative events that cause state transitions between Versions.

```json
{
  "id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26@2000-02-14!art1_cpt_alt1_art6_cpt",
  "type": "amendment",
  "date": "2000-02-14T00:00:00Z",
  "source_version_id": "urn:lex:br:federal:constituicao:1988-10-05@1988-10-05",
  "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05@2000-02-14"
}
```

#### Relation
Connections between entities representing citations, successions, or other domain relationships.

```json
{
  "id": "urn:lex:br:federal:lei:1990-07-20;8069;art1_cites_urn:lex:br:federal:constituicao:1988-10-05;art227",
  "subject_id": "urn:lex:br:federal:lei:1990-07-20;8069;art1",
  "predicate": "cites",
  "object_id": "urn:lex:br:federal:constituicao:1988-10-05;art227",
  "validity_interval": {
    "start_time": "1990-07-20T00:00:00Z",
    "end_time": null
  }
}
```

#### Theme
Classification system for organizing and discovering Items.

```json
{
  "id": "theme:children_rights",
  "label": "Children's Rights",
  "description": "Legal provisions related to the protection and promotion of children's rights",
  "member_items": ["urn:lex:br:federal:lei:1990-07-20;8069"]
}
```

#### TextUnit
Actual textual content associated with entities in multiple languages and aspects.

```json
{
  "id": "urn:lex:br:federal:lei:1990-07-20;8069@1990-07-20;canonical",
  "version_id": "urn:lex:br:federal:lei:1990-07-20;8069@1990-07-20",
  "aspect": "canonical",
  "language": "pt-BR",
  "content": "This Law establishes the Statute of Children and Adolescents..."
}
```

### Request/Response Schemas

#### SearchRequest
```json
{
  "item_ids": ["urn:lex:br:federal:lei:1990-07-20;8069"],
  "theme_ids": ["theme:children_rights"],
  "timestamp": "2020-01-01T00:00:00Z",
  "semantic_query": "children protection laws",
  "lexical_query": "statute children adolescents",
  "language": "pt-BR",
  "aspects": ["canonical", "summary"],
  "top_k": 10,
  "datasources": ["datasource_Senate"]
}
```

#### StructuralContext
```json
{
  "target": { /* Item object */ },
  "parent": { /* Item object */ },
  "siblings": [ /* Array of Item objects */ ],
  "children": [ /* Array of Item objects */ ]
}
```

## Error Handling

### Standard Error Response
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PARAMETER` | 400 | Invalid parameter value or missing required parameter |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN_DATASOURCE` | 403 | API key lacks access to requested datasource |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |

## Temporal Resolution

### TemporalPolicy Options

- **PointInTime**: Strict temporal resolution - finds version whose validity interval strictly contains the exact timestamp
- **SnapshotLast**: Default - finds the last version valid at any point during the day of the timestamp

### Temporal Query Examples

```bash
# Get version valid at exact moment
GET /items/{itemId}/valid-version?timestamp=2020-01-01T12:30:00Z&temporal_policy=PointInTime

# Get version valid at end of day (default)
GET /items/{itemId}/valid-version?timestamp=2020-01-01T00:00:00Z&temporal_policy=SnapshotLast
```

## Datasource Scoping

All requests are automatically scoped to datasources granted to your API key. Many endpoints support explicit datasource filtering:

```bash
# Search within specific datasources
POST /search-items
{
  "semantic_query": "tax law",
  "datasources": ["datasource_Senate", "datasource_Chamber"]
}
```

## Rate Limiting

API requests are subject to rate limiting. When limits are exceeded, the API returns:

```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Request rate limit exceeded. Please try again later."
}
```

## Pagination

Some endpoints support pagination for large result sets:

```bash
# Paginated search results
POST /search-items
{
  "semantic_query": "legal provisions",
  "top_k": 100,
  "offset": 50
}
```

## Full OpenAPI Specification

For complete technical details, see the [OpenAPI 3.0 specification](../specification/openapi.yaml).

---

*For practical examples, see [Basic Queries](examples/basic-queries.md) and [Use Cases](use-cases/).*
