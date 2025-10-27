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
🔶 **Non-Deterministic** - Returns ranked results with confidence scores. Same input may yield different rankings over time.

Probabilistic entry points for finding entities based on natural language or structured criteria.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search-items` | POST | Search for Items using semantic or lexical queries |
| `/search-themes` | POST | Search for Themes using semantic or lexical queries |
| `/search-text-units` | POST | Search within textual content across versions |
| `/resolve-item-reference` | POST | Resolve natural language references to canonical Item IDs |
| `/resolve-theme-reference` | POST | Resolve natural language references to canonical Theme IDs |

#### searchTextUnits Parameter Modes

The `/search-text-units` endpoint supports two **mutually exclusive** parameter modes for scoping:

**Mode 1: Explicit Version Scope**
- Use `version_ids` to search within a specific set of versions
- All other scope parameters (`item_ids`, `theme_ids`, `timestamp`) are ignored
- Useful when you've already identified specific versions to search

```json
{
  "version_ids": ["urn:lex:...:art6@2020-01-15"],
  "content_query": {
    "semantic": {
      "query_text": "tax exemption"
    }
  },
  "top_k": 5
}
```

**Mode 2: Conceptual Scope with Temporal Resolution**
- Use `item_ids` and/or `theme_ids` to define conceptual scope
- Use `timestamp` to constrain temporally (defaults to "now" if omitted)
- `version_ids` must be omitted
- The API automatically resolves temporal versions

```json
{
  "item_ids": ["urn:lex:...:lei:2020;1234"],
  "theme_ids": ["theme:tax_law"],
  "timestamp": "2020-06-15T00:00:00Z",
  "content_query": {
    "semantic": {
      "query_text": "tax exemption"
    }
  },
  "top_k": 5
}
```

**Important:** You cannot mix `version_ids` with `item_ids`/`theme_ids`/`timestamp`. Choose one mode per request.

### Deterministic Fetch Actions
✅ **Fully Deterministic** - Same input always returns same output. Results are guaranteed and reproducible.

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
✅ **Fully Deterministic** - Same input always returns same output. Results are guaranteed and reproducible.

Actions for traversing the atemporal document hierarchy.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/items/{itemId}/ancestors` | GET | Get hierarchical ancestors of an Item |
| `/items/{itemId}/context` | GET | Get complete structural context (parent, siblings, children) |
| `/items/{itemId}/themes` | GET | Get all Themes associated with an Item |
| `/items/{itemId}/valid-version` | GET | Get the Version of an Item valid at a specific timestamp |
| `/enumerate-items` | POST | Enumerate Items within a structural or thematic scope |

### Graph Traversal Actions
✅ **Fully Deterministic** - Same input always returns same output. Results are guaranteed and reproducible.

Actions for exploring relationships and connections between entities.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/entities/{entityId}/related` | GET | Find related entities by traversing specific relationships |
| `/query-relations` | POST | Query Relation objects with flexible criteria |
| `/versions/{versionId}/text-unit` | GET | Get the TextUnit associated with a specific Version |

## Action Reference

### Deterministic Fetch Actions
✅ **Fully Deterministic**

#### GET /items/{itemId}

Retrieves a single Item by its canonical ID.

**Returns:**
- `200 OK`: Item object with full structural metadata
- `404 Not Found`: Item with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource containing this Item

**Example Response (200):**
```json
{
  "id": "urn:lex:br:federal:lei:1990-07-20;8069",
  "type_id": "item-type:statute",
  "label": "Statute of Children and Adolescents",
  "parent_id": "urn:lex:br:federal:constituicao:1988-10-05"
}
```

**Note:** To retrieve children, use `GET /items/{itemId}/children`

#### GET /versions/{versionId}

Retrieves a single Version by its canonical ID.

**Returns:**
- `200 OK`: Version object with temporal metadata
- `404 Not Found`: Version with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource containing this Version

**Example Response (200):**
```json
{
  "id": "urn:lex:br:federal:lei:1990-07-20;8069@1990-07-20",
  "item_id": "urn:lex:br:federal:lei:1990-07-20;8069",
  "validity_interval": {
    "start_time": "1990-07-20T00:00:00Z",
    "end_time": null
  }
}
```

#### GET /themes/{themeId}

Retrieves a single Theme by its canonical ID.

**Returns:**
- `200 OK`: Theme object with classification metadata
- `404 Not Found`: Theme with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource containing this Theme

#### GET /actions/{actionId}

Retrieves a single Action by its canonical ID.

**Returns:**
- `200 OK`: Action object with causal metadata
- `404 Not Found`: Action with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource containing this Action

---

### Structural Navigation Actions
✅ **Fully Deterministic**

#### GET /items/{itemId}/ancestors

Retrieves the hierarchical ancestors of an Item (parent, grandparent, etc.).

**Returns:**
- `200 OK`: Array of Item objects representing the ancestor chain
- `404 Not Found`: Item with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource

**Example Response (200):**
```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05",
    "type_id": "item-type:constitution",
    "label": "Federal Constitution"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;tit8",
    "type_id": "item-type:title",
    "label": "Title VIII - Social Order"
  }
]
```

#### GET /items/{itemId}/context

Retrieves complete structural context (parent, siblings, children).

**Returns:**
- `200 OK`: StructuralContext object with target, parent, siblings, children
- `404 Not Found`: Item with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource

**Example Response (200):**
```json
{
  "target": { "id": "urn:lex:...:art6", "label": "Article 6" },
  "parent": { "id": "urn:lex:...:tit2", "label": "Title II" },
  "siblings": [
    { "id": "urn:lex:...:art5", "label": "Article 5" },
    { "id": "urn:lex:...:art7", "label": "Article 7" }
  ],
  "children": []
}
```

#### GET /items/{itemId}/valid-version

Retrieves the Version of an Item valid at a specific timestamp.

**Parameters:**
- `timestamp` (required): UTC date-time for temporal resolution
- `policy` (optional): TemporalPolicy (defaults to `SnapshotLast`)

**Returns:**
- `200 OK`: Version object valid at the specified time
- `404 Not Found`: Item does not exist OR no version valid at the timestamp
- `400 Bad Request`: Invalid timestamp format or policy value
- `403 Forbidden`: API key lacks access to the datasource

**Example Response (200):**
```json
{
  "id": "urn:lex:br:federal:constituicao:1988-10-05;art6@2010-02-12",
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;art6",
  "validity_interval": {
    "start_time": "2010-02-12T00:00:00Z",
    "end_time": "2015-08-06T00:00:00Z"
  }
}
```

**Example Error (404 - No Valid Version):**
```json
{
  "error": {
    "code": "NO_VALID_VERSION",
    "message": "No valid version exists for the specified item at the given timestamp.",
    "details": {
      "item_id": "urn:lex:...:art10",
      "timestamp": "1950-01-01T00:00:00Z"
    }
  }
}
```

#### POST /enumerate-items

Enumerates Items within a structural or thematic scope.

**Returns:**
- `200 OK`: Array of Item objects matching the scope criteria
- `400 Bad Request`: Invalid filter parameters
- `403 Forbidden`: API key lacks access to requested datasources

---

### Discovery & Search Actions
🔶 **Non-Deterministic**

#### POST /search-items

Searches for Items using semantic or lexical queries.

**Returns:**
- `200 OK`: Array of SearchResult objects (item + score)
- `400 Bad Request`: Invalid query parameters
- `403 Forbidden`: API key lacks access to requested datasources

**Example Response (200):**
```json
[
  {
    "item": {
      "id": "urn:lex:br:federal:lei:1990-07-20;8069",
      "label": "Statute of Children and Adolescents"
    },
    "score": 0.92,
    "matched_aspects": ["canonical", "summary"]
  },
  {
    "item": {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;art227",
      "label": "Article 227"
    },
    "score": 0.87,
    "matched_aspects": ["canonical"]
  }
]
```

#### POST /search-text-units

Searches within textual content across versions.

**Returns:**
- `200 OK`: Array of SearchResultUnit objects (text unit + score)
- `400 Bad Request`: Invalid query parameters or parameter mode violation
- `403 Forbidden`: API key lacks access to requested datasources

**Important:** Returns `400` if you mix `version_ids` with `item_ids`/`theme_ids`/`timestamp`.

#### POST /resolve-item-reference

Resolves natural language references to canonical Item IDs.

**Returns:**
- `200 OK`: Array of candidate Item objects with confidence scores
- `400 Bad Request`: Missing or invalid natural language reference
- `403 Forbidden`: API key lacks access to requested datasources

---

### Causal Analysis Actions
✅ **Fully Deterministic**

#### GET /items/{itemId}/history

Retrieves the complete temporal history of an Item.

**Returns:**
- `200 OK`: Array of Version objects ordered chronologically
- `404 Not Found`: Item with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource

#### GET /actions/{actionId}/causality

Traces the causal chain of an Action (what caused it, what it produced).

**Returns:**
- `200 OK`: Causality graph with source versions, actions, and produced versions
- `404 Not Found`: Action with the specified ID does not exist
- `403 Forbidden`: API key lacks access to the datasource

#### POST /compare-versions

Compares two versions and returns textual differences.

**Returns:**
- `200 OK`: TextDiffReport with detailed change information
- `400 Bad Request`: Invalid version IDs or versions from different Items
- `404 Not Found`: One or both version IDs do not exist
- `403 Forbidden`: API key lacks access to the datasource

**Example Response (200):**
```json
{
  "version_a": "urn:lex:...:art6@2010-02-12",
  "version_b": "urn:lex:...:art6@2015-08-06",
  "changes": [
    {
      "type": "modification",
      "old_text": "social rights include education, health",
      "new_text": "social rights include education, health, and transportation"
    }
  ],
  "summary": "1 modification"
}
```

---

### Aggregate Analysis Actions
✅ **Fully Deterministic**

#### POST /summarize-impact

Summarizes legislative impact within a scope and time range.

**Returns:**
- `200 OK`: ImpactReport with action counts, affected items, and aggregated statistics
- `400 Bad Request`: Invalid scope or time range parameters
- `403 Forbidden`: API key lacks access to requested datasources

**Example Response (200):**
```json
{
  "total_actions": 47,
  "action_type_counts": {
    "amendment": 32,
    "revocation": 12,
    "enactment": 3
  },
  "affected_items_count": 89,
  "time_interval": {
    "start_time": "2019-01-01T00:00:00Z",
    "end_time": "2022-12-31T23:59:59Z"
  }
}
```

---

### Introspection Actions
✅ **Fully Deterministic**

#### GET /introspection/languages

Returns available languages for text content.

**Returns:**
- `200 OK`: Array of language codes (IETF BCP 47)

**Example Response (200):**
```json
["pt-BR", "en", "es"]
```

#### GET /introspection/temporal-coverage

Returns temporal coverage for a datasource or Item.

**Returns:**
- `200 OK`: TimeInterval with start and end dates
- `404 Not Found`: Specified datasource or Item does not exist

**Example Response (200):**
```json
{
  "start_time": "1988-10-05T00:00:00Z",
  "end_time": null
}
```

## Data Models

### Core Entities

#### Item
Timeless, structural entities representing documents, articles, concepts, or named entities.

```json
{
  "id": "urn:lex:br:federal:lei:1990-07-20;8069",
  "type_id": "item-type:statute",
  "label": "Statute of Children and Adolescents",
  "parent_id": "urn:lex:br:federal:constituicao:1988-10-05",
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
  "content_query": {
    "strategy": "hybrid",
    "semantic": {
      "query_text": "children protection laws",
      "weight": 0.6
    },
    "lexical": {
      "query_text": "statute children adolescents",
      "weight": 0.4
    }
  },
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

The `policy` parameter controls temporal resolution behavior for version queries:

- **SnapshotLast** (default): Finds the last version valid at any point during the day of the timestamp
- **PointInTime**: Strict temporal resolution - finds version whose validity interval strictly contains the exact timestamp

⏱️ **For detailed explanation and edge cases, see [Temporal Resolution Guide](./TEMPORAL_RESOLUTION.md)**

### Parameter Optionality

**`getValidVersion` endpoint:**
- `itemId` (path parameter): **Required**
- `timestamp` (query parameter): **Required**
- `policy` (query parameter): **Optional** - defaults to `SnapshotLast` if not specified

### Temporal Query Examples

```bash
# Get version valid at end of day (uses default SnapshotLast policy)
GET /items/{itemId}/valid-version?timestamp=2020-01-01T00:00:00Z

# Get version valid at exact moment (explicit PointInTime policy)
GET /items/{itemId}/valid-version?timestamp=2020-01-01T12:30:00Z&policy=PointInTime

# Get version with explicit default policy
GET /items/{itemId}/valid-version?timestamp=2020-01-01T00:00:00Z&policy=SnapshotLast
```

## Batch Operations

### Performance Benefits

Batch operations provide significant performance improvements when working with multiple IDs:

**Scenario:** Reconstruct a constitutional chapter with 50 articles at a specific date

| Approach | API Calls | Latency | Improvement |
|----------|-----------|---------|-------------|
| Sequential `getValidVersion()` | 50 calls | 5-10 seconds | Baseline |
| `getBatchValidVersions()` | 1 call | <0.5 seconds | **10-20x faster** |

**Recommendation:** Always use batch operations when working with multiple IDs.

### Available Batch Operations

- **`POST /batch/items`** - Retrieve multiple Items by IDs
- **`POST /batch/versions`** - Retrieve multiple Versions by IDs
- **`POST /batch/themes`** - Retrieve multiple Themes by IDs
- **`POST /batch/actions`** - Retrieve multiple Actions by IDs
- **`POST /batch/valid-versions`** - Retrieve valid versions for multiple Items at a timestamp

### Batch Error Handling

Batch operations return **partial results** with detailed error information for failed IDs:

**Example Response:**
```json
{
  "results": [
    {
      "id": "urn:lex:...:art6",
      "data": {
        "id": "urn:lex:...:art6@2020-01-15",
        "item_id": "urn:lex:...:art6",
        "validity_interval": { "start_time": "2020-01-15T00:00:00Z" }
      }
    },
    {
      "id": "urn:lex:...:art7",
      "data": {
        "id": "urn:lex:...:art7@2020-01-15",
        "item_id": "urn:lex:...:art7",
        "validity_interval": { "start_time": "2020-01-15T00:00:00Z" }
      }
    }
  ],
  "errors": [
    {
      "id": "urn:lex:...:art8",
      "error": "NO_VALID_VERSION",
      "message": "No valid version exists for the specified item at the given timestamp."
    }
  ]
}
```

**Key Points:**
- HTTP status is `200 OK` even if some IDs fail (partial success)
- Check both `results` and `errors` arrays in response
- `errors` array contains ID-specific error details
- Empty `errors` array means all operations succeeded

⚠️ **For complete error handling patterns, see [Error Handling Guide](./ERROR_HANDLING.md)**

---

## Datasource Scoping

All requests are automatically scoped to datasources granted to your API key. Many endpoints support explicit datasource filtering:

```bash
# Search within specific datasources
POST /search-items
{
  "content_query": {
    "semantic": {
      "query_text": "tax law"
    }
  },
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
  "content_query": {
    "semantic": {
      "query_text": "legal provisions"
    }
  },
  "top_k": 100,
  "offset": 50
}
```

## Full OpenAPI Specification

For complete technical details, see the [OpenAPI 3.0 specification](../specification/openapi.yaml).

---

*For practical examples, see [Examples](examples/).*
