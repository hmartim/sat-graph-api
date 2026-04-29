# Getting Started with the SAT-Graph API

This guide will help you get up and running with the Canonical Primitive API for SAT-Graph RAG.

## Overview

The SAT-Graph API provides a formal, auditable interface for querying documents with temporal and structural awareness. Unlike standard RAG systems, it can distinguish between current and historical versions of laws, understand document hierarchy, and trace changes over time.

## Prerequisites

- A valid API key (contact system administrator)
- Understanding of REST APIs and JSON
- Basic familiarity with document structure (helpful but not required)

## Authentication

All API endpoints require authentication using an API key in the `Authorization` header:

```bash
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/item_id_123"
```

## API Base URL

The API is served at: `https://api.example.com`

## Core Concepts

### 1. Primitive Categories

The API provides primitives organized into functional categories. Understanding these categories is essential for building effective retrieval plans:

| Category | Purpose | Examples |
|----------|---------|----------|
| **Discovery & Search** | Find entities using natural language (probabilistic) | `resolveItemReference`, `searchTextUnits` |
| **Deterministic Fetch** | Retrieve full objects by ID (deterministic) | `getItem`, `getVersion`, `getValidVersions` |
| **Structural Navigation** | Traverse hierarchy (deterministic) | `getItemAncestors`, `getItemHierarchy` |
| **Causal Analysis** | Trace events (deterministic) | `getItemHistory`, `getActionsBySource` |
| **Analysis** | Comparative and structural analysis (deterministic) | `compareVersions` |
| **Introspection** | Discover capabilities (deterministic) | `getAvailableLanguages` |

📖 **See [Primitive Categories Guide](./ACTION_CATEGORIES.md) for detailed taxonomy and workflow patterns.**

### 2. Data Models

The API operates on several key entities:

- **Item**: Timeless, structural entities (documents, articles, concepts)
- **Version**: Temporal snapshots of Items at specific points in time
- **Action**: Events that cause changes (amendments, revocations)
- **Relation**: Connections between entities (citations, successions)
- **Theme**: Classification system for discovery
- **TextUnit**: Actual textual content in multiple languages

### 3. DataSources

Data comes from multiple providers called "DataSources":
- `dataSource_Senate`: Federal Senate data
- `dataSource_Chamber`: Chamber of Deputies data
- `dataSource_SupremeCourt`: Supreme Court jurisprudence

Your API key grants access to specific data sources, and all queries are automatically scoped to your authorized data sources.

### 4. Temporal Resolution

The API supports bi-temporal semantics:

- **Valid Time** (`at`): When was the legal fact valid in the real world?
- **Transaction Time** (`observerTime`): When did the system know about this fact? (optional, defaults to "now")

## Your First API Call

Let's start with a simple search to find items:

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

This will return a list of items related to tax law amendments, each with a relevance score.

## Common Workflows

### 1. Find and Retrieve an Item

```bash
# Step 1: Search for items
curl -X POST "https://api.example.com/items/search" \
     -H "Authorization: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "contentQuery": {
         "semantic": {
           "queryText": "constitutional amendments"
         }
       },
       "topK": 3
     }'

# Step 2: Get full item details using the ID from step 1
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/itemId_from_step_1"
```

### 2. Get Document Context

```bash
# Get hierarchical ancestors
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/itemId/ancestors"

# Enumerate descendants
curl -G "https://api.example.com/items/itemId/hierarchy" \
     -H "Authorization: YOUR_API_KEY" \
     --data-urlencode "depth=-1"
```

### 3. Point-in-Time Analysis

```bash
# Get the versions of an item valid at a specific date
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/itemId/valid-versions?at=2020-01-01T00:00:00Z"
```

## Error Handling

The API uses standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)

Error responses include structured information:

```json
{
  "code": "FORBIDDEN_DATASOURCE",
  "message": "Your API key does not have access to the requested data source."
}
```

📖 **For complete error handling guide, see [Error Handling Documentation](./ERROR_HANDLING.md)**

## Next Steps

1. **Explore Examples**: Start with [Fundamental Patterns](examples/00-fundamental-patterns.md) to understand core concepts
2. **Study Use Cases**: See complete [Use Cases](examples/) for real-world analysis scenarios
3. **Generate a Client**: Use the OpenAPI specification to generate a client SDK
4. **Read the Full Reference**: Consult the [OpenAPI Specification](../specification/openapi.yaml) for complete details

## Client SDK Generation

Generate a client for your preferred language:

```bash
# Python client
openapi-generator-cli generate \
  -i specification/openapi.yaml \
  -g python \
  -o ./generated-client/python

# JavaScript client
openapi-generator-cli generate \
  -i specification/openapi.yaml \
  -g javascript \
  -o ./generated-client/javascript
```

## Support

- **Documentation**: This guide and linked resources
- **API Specification**: [`../specification/openapi.yaml`](../specification/openapi.yaml)
- **Contributing**: See [Contributing Guidelines](../CONTRIBUTING.md)

---

*Ready to dive deeper? Check out the [Examples](examples/) for practical use cases.*
