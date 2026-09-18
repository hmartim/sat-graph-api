# Use Case 2: Constitutional Evolutionary Analysis with Thematic Filtering

## User query

> Summarize the evolution of constitutional provisions related to the theme "Digital Security" since 2000.

This example demonstrates a legal-domain workflow that combines thematic discovery, structural expansion, causal analysis, and batch hydration.

## Phase 1 — Resolve thematic and structural scope

### 1. Resolve the Theme

```bash
curl -G "$BASE_URL/themes/by-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "referenceText=Digital Security"
```

Illustrative response:

```json
[
  {
    "theme": {
      "id": "theme_digital_security",
      "label": "Digital Security and Privacy"
    },
    "confidence": 0.95
  }
]
```

### 2. Expand the Theme hierarchy

```bash
curl -G "$BASE_URL/themes/theme_digital_security/hierarchy" \
  -H "Authorization: $API_KEY"
```

The returned Theme IDs define the thematic scope.

### 3. Resolve the relevant ItemType scope

Use `resolveItemTypeReference` and/or `getItemTypeHierarchy` to obtain the deployment's constitutional-document ItemTypes.

### 4. Discover anchor Items

```bash
curl -X POST "$BASE_URL/items/search" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "itemTypeIds": ["item-type:constitution", "item-type:constitutional-amendment"],
    "themeIds": ["theme_digital_security", "theme_data_protection"],
    "topK": 100
  }'
```

`topK` is a positive ranking limit. It is not an exhaustive-enumeration switch. If the task requires complete coverage, the deployment or agent must first establish an explicit admissible structural universe using deterministic enumeration primitives.

### 5. Expand each selected structural anchor

```bash
curl -G "$BASE_URL/items/{itemId}/hierarchy" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "depth=-1"
```

`getItemHierarchy` enumerates descendant Item IDs from one canonical, atemporal Item root.

## Phase 2 — Retrieve relevant Actions

Once the admissible Item IDs are known, query Actions over the explicit scope:

```bash
curl -X POST "$BASE_URL/query-actions" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "itemIds": ["..."],
    "timeInterval": {
      "startTime": "2000-01-01T00:00:00Z"
    }
  }'
```

The result is a structured set of Actions linked to produced and/or terminated Versions.

## Phase 3 — Hydrate known graph objects

Collect the relevant identifiers and use batch retrieval:

```bash
curl -X POST "$BASE_URL/items/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "ids": ["item-1", "item-2"] }'
```

```bash
curl -X POST "$BASE_URL/versions/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "ids": ["version-1", "version-2"] }'
```

If primary legal text is required, request the legal deployment's `canonical` aspect explicitly:

```bash
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "versionIds": ["version-1", "version-2"],
    "language": "pt-BR",
    "aspects": ["canonical"]
  }'
```

## Key distinction

This workflow separates two different tasks:

- **ranked discovery** helps locate likely thematic/structural anchors;
- **deterministic enumeration and batch retrieval** are used once an explicit scope is known.

For a capability that requires exhaustive coverage, do not treat `searchItems` or `searchTextUnits` as exhaustive merely by choosing a large `topK`.
