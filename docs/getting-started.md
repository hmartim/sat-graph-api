# Getting Started with the SAT-Graph API

This guide will help you get up and running with the Canonical Action API for SAT-Graph RAG.

## Overview

The SAT-Graph API provides a formal, auditable interface for querying legal documents with temporal and structural awareness. Unlike standard RAG systems, it can distinguish between current and historical versions of laws, understand document hierarchy, and trace legislative changes over time.

## Prerequisites

- A valid API key (contact system administrator)
- Understanding of REST APIs and JSON
- Basic familiarity with legal document structure (helpful but not required)

## Authentication

All API endpoints require authentication using an API key in the `Authorization` header:

```bash
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/item_id_123"
```

## API Base URL

The API is served at: `https://api.example.com`

## Core Concepts

### 1. Data Models

The API operates on several key entities:

- **Item**: Timeless, structural entities (documents, articles, concepts)
- **Version**: Temporal snapshots of Items at specific points in time
- **Action**: Legislative events that cause changes (amendments, revocations)
- **Relation**: Connections between entities (citations, successions)
- **Theme**: Classification system for discovery
- **TextUnit**: Actual textual content in multiple languages

### 2. Datasources

Data comes from multiple providers called "Datasources":
- `datasource_Senate`: Federal Senate data
- `datasource_Chamber`: Chamber of Deputies data  
- `datasource_SupremeCourt`: Supreme Court jurisprudence

Your API key grants access to specific datasources, and all queries are automatically scoped to your authorized datasources.

### 3. Temporal Resolution

The API supports two temporal resolution strategies:

- **PointInTime**: Finds the exact version valid at a specific timestamp
- **SnapshotLast**: Finds the last version valid during a given day (default)

## Your First API Call

Let's start with a simple search to find legal items:

```bash
curl -X POST "https://api.example.com/search-items" \
     -H "Authorization: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "semantic_query": "tax law amendments",
       "top_k": 5
     }'
```

This will return a list of items related to tax law amendments, each with a relevance score.

## Common Workflows

### 1. Find and Retrieve an Item

```bash
# Step 1: Search for items
curl -X POST "https://api.example.com/search-items" \
     -H "Authorization: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "semantic_query": "constitutional amendments",
       "top_k": 3
     }'

# Step 2: Get full item details using the ID from step 1
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/item_id_from_step_1"
```

### 2. Get Document Context

```bash
# Get the structural context (parent, siblings, children)
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/item_id/context"

# Get hierarchical ancestors
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/item_id/ancestors"
```

### 3. Point-in-Time Analysis

```bash
# Get the version of an item valid at a specific date
curl -H "Authorization: YOUR_API_KEY" \
     "https://api.example.com/items/item_id/valid-version?timestamp=2020-01-01T00:00:00Z&temporal_policy=PointInTime"
```

## Error Handling

The API uses standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)

Error responses include detailed information:

```json
{
  "code": "FORBIDDEN_DATASOURCE",
  "message": "The provided API Key does not have access to the 'datasource_STF' datasource."
}
```

## Next Steps

1. **Explore Examples**: Check out the [Basic Queries](examples/basic-queries.md) for common patterns
2. **Understand Use Cases**: See [Use Cases](../use-cases/) for domain-specific examples
3. **Generate a Client**: Use the OpenAPI specification to generate a client SDK
4. **Read the Full Reference**: Consult the [API Reference](api-reference.md) for complete details

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
- **Contributing**: See [Contributing Guidelines](contributing.md)

---

*Ready to dive deeper? Check out the [Basic Queries Examples](examples/basic-queries.md) for practical examples.*
