# Use Case 2: Constitutional Evolutionary Analysis with Thematic Filtering

> **Based on:** Research Paper Section 5.3.1: "API as a Foundation for Agentic Reasoning"

## User Query

_"Summarize the evolution of all constitutional provisions related to the theme 'Digital Security' since 2000"_

## The Challenge

A standard RAG system would likely:
- ❌ Struggle to find all relevant constitutional items in a specific thematic domain
- ❌ Miss nested provisions that inherit theme membership from their parents
- ❌ Require sequential queries, leading to N+1 performance problems
- ❌ Lack the ability to comprehensively track evolutionary changes

## Agent Execution Plan

The agent's strategy is to **use corpus-first discovery (ensuring we get all constitutional items) with thematic filtering (ensuring relevance), then expand hierarchically to capture all component-level provisions**.

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Key Strategy

The query requires satisfying **three scoping rules simultaneously**:

1. **Thematic Scope (Inclusive Expansion)**: Start with theme "Digital Security" and expand to include all sub-themes (entire sub-tree in the theme taxonomy)
2. **Hierarchical Scope (Descendant Propagation)**: If an Item (e.g., Norm, Title, Article) is linked to any theme in the thematic scope, include all its descendant Items (paragraphs, clauses) even if not directly theme-linked
3. **Corpus Scope (Restrictive Filter)**: All resulting Items must belong to the "constitutional-legislation" corpus (directly or via ItemType hierarchy)

This combination ensures we capture:
- All constitutional provisions (by corpus constraint)
- That relate to Digital Security (by thematic scope)
- Including nested provisions under theme-linked parents (by hierarchical expansion)

---

## Phase 1: Scope Resolution (Finding All Relevant Item IDs)

### Step 1.1: Discover the Thematic Node

```bash
curl -G "$BASE_URL/themes/by-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "referenceText=Digital Security"
```

**Response:**

```json
[
  {
    "id": "theme_digital_security",
    "label": "Digital Security and Privacy",
    "confidence": 0.95
  }
]
```

**Agent Logic:**

```python
themes = resolve_theme_reference(referenceText="Digital Security")
rootThemeId = themes[0].id
# rootThemeId = "theme_digital_security"
```

### Step 1.2: Expand Thematic Scope (Get All Sub-Themes)

Retrieve all sub-themes to ensure inclusive thematic coverage (rule 1: Thematic Scope).

```bash
curl -G "$BASE_URL/themes/theme_digital_security/hierarchy" \
  -H "Authorization: $API_KEY"
```

**Response:**

```json
[
  "theme_digital_security",
  "theme_data_protection",
  "theme_cybersecurity",
  "theme_digital_privacy"
]
```

**Agent Logic:**

```python
allThemeIds = get_theme_hierarchy(rootThemeId)
# allThemeIds = ["theme_digital_security", "theme_data_protection", ...]
```

### Step 1.3: Get Constitutional ItemType Descendants

Get the full ItemType tree for "constitutional-legislation" to understand what counts as constitutional (rule 3: Corpus Scope).

```bash
curl -G "$BASE_URL/item-types/item-type:constitutional-legislation/hierarchy" \
  -H "Authorization: $API_KEY"
```

**Response:**

```json
[
  "item-type:constitutional-legislation",
  "item-type:constitution",
  "item-type:constitutional-amendment",
  "item-type:constitutional-act"
]
```

**Agent Logic:**

```python
constitutionalItemTypes = get_item_type_hierarchy("item-type:constitutional-legislation")
# constitutionalItemTypes = ["item-type:constitution", "item-type:constitutional-amendment", ...]
```

### Step 1.4: Search for Constitutional Items Linked to Themes (Single Efficient Query)

Use a single `POST /items/search` call to find all items that satisfy BOTH criteria:
- Are of constitutional ItemTypes (Corpus Scope - rule 3)
- Are linked to any theme in the Digital Security tree (Thematic Scope - rule 1)

This single call efficiently finds the "anchor items" (items that are both constitutional AND thematic) without enumerating everything first.

```bash
curl -X POST "$BASE_URL/items/search" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "itemTypeIds": [
      "item-type:constitutional-legislation",
      "item-type:constitution",
      "item-type:constitutional-amendment",
      "item-type:constitutional-act"
    ],
    "themeIds": [
      "theme_digital_security",
      "theme_data_protection",
      "theme_cybersecurity",
      "theme_digital_privacy"
    ],
    "topK": -1
  }'
```

**Response:**

```json
[
  {
    "item": {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988",
      "type": "item-type:constitution"
    },
    "score": 1
  },
  {
    "item": {
      "id": "urn:lex:br:federal:emenda.constitucional:1992-03-31;1",
      "type": "item-type:constitutional-amendment"
    },
    "score": 1
  }
]
```

**Agent Logic:**

```python
# Single search-items call finds constitutional items linked to themes
anchorItems = search_items(
    itemTypeIds=constitutionalItemTypes,
    themeIds=allThemeIds,
    topK=-1
)
anchorItemIds = [result.item.id for result in anchorItems]
# anchorItemIds = ["urn:lex:br:federal:constituicao:1988-10-05;1988", ...]
```

### Step 1.5: Enumerate Descendants (Parallel Execution for Hierarchical Expansion)

For **each** anchor item discovered in 1.4, enumerate all descendants to implement rule 2 (Hierarchical Scope): "if a parent is linked to a theme, include all its children".

These enumeration calls can run in **parallel** since there are no dependencies.

```bash
# Executed in parallel, one call per anchor item
curl -G "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988/hierarchy" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "depth=-1"

curl -G "$BASE_URL/items/urn:lex:br:federal:emenda.constitucional:1992-03-31;1/hierarchy" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "depth=-1"

# ... one call per anchor item
```

**Response (per anchor):**

```json
[
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art1",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art1_capt",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art1_par1",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art1_par2"
]
```

**Agent Logic (Building Final Scope):**

```python
# Enumerate descendants for each anchor item (parallel execution)
# Returns only IDs (strings) - efficient for hierarchy traversal
# Each anchor item is theme-linked, so all its descendants are included (hierarchical rule)
finalItemIds = set()

for anchorItem in anchorItems:
    # Enumerate the full subtree rooted at this anchor item via /items/{itemId}/hierarchy
    # Returns: ["id1", "id2", "id3", ...]
    descendantIds = getItemHierarchy(
        itemId=anchorItem.id,
        depth=-1
    )

    # Add all descendants to final scope
    finalItemIds.update(descendantIds)

# finalItemIds now contains all items satisfying all three scope rules:
# 1. Thematic Scope: All items in subtrees rooted at theme-linked items
# 2. Hierarchical Scope: All descendants of theme-linked items included
# 3. Corpus Scope: All items from /items/search (filtered by constitutional ItemTypes)
```

> **Efficiency Note:** Step 1.4 uses `POST /items/search` with combined filters to efficiently find anchor items (constitutional AND thematic). Step 1.5 enumerates only the subtrees rooted at these anchors. This approach avoids enumerating everything and filtering afterwards—we only enumerate what matters.

---

## Phase 2: Historical Analysis (Parallel Root-Scoped Queries)

### Step 2.1: Query Actions Per Root (Parallel Execution)

Rather than querying all items in a single large request, make N parallel `/query-actions` calls (one per constitutional root), each scoped to that root's thematic items. This approach:

- Keeps request payloads small and manageable
- Enables server-side parallelization (N workers processing N queries)
- Respects HTTP limits naturally
- Maintains logical grouping by constitutional source

```bash
# Executed in parallel, one call per constitutional root

# For Constitution root
curl -X POST "$BASE_URL/query-actions" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "itemIds": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art1",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art1_cpt",
      "..."
    ],
    "timeInterval": {
      "startTime": "2000-01-01T00:00:00Z"
    }
  }'

# For Constitutional Amendment #1 root
curl -X POST "$BASE_URL/query-actions" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "itemIds": [
      "urn:lex:br:federal:emenda.constitucional:1992-03-31;1",
      "urn:lex:br:federal:emenda.constitucional:1992-03-31;1!art1",
      "..."
    ],
    "timeInterval": {
      "startTime": "2000-01-01T00:00:00Z"
    }
  }'

# ... one call per root
```

**Response (per root):**

```json
[
  {
    "id": "action_ec_115_2022_...",
    "type": "Amendment",
    "eventTime": "2022-02-10T00:00:00Z",
    "sourceVersionIds": ["..."],
    "terminatesVersionIds": ["urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art5_cpt_inc12"],
    "producesVersionIds": ["urn:lex:br:federal:constituicao:1988-10-05;1988@2022-02-10!art5_cpt_inc12"]
  },
  { ... }
]
```

**Agent Logic:**

```python
# Parallel execution: one query-actions call per root
# Each call is independent and can run concurrently
allRelevantActions = []
rootActions = {}

for rootId, scopedItems in rootScopedItems.items():
    # Each call queries only the items scoped to this root
    actions = query_actions(
        itemIds=list(scopedItems),
        timeInterval={
            "startTime": "2000-01-01T00:00:00Z"
        }
    )
    rootActions[rootId] = actions
    allRelevantActions.extend(actions)

# Aggregate statistics
totalActions = len(allRelevantActions)
actionByType = {}
for action in allRelevantActions:
    actionType = action.type
    actionByType[actionType] = actionByType.get(actionType, 0) + 1

# Build version-to-action map for later join with hydrated versions (Phase 3)
# After batch-fetching versions, use version.itemId to group actions by item.
versionToAction = {}
for action in allRelevantActions:
    for versionId in action.producesVersionIds:
        versionToAction[versionId] = action
```

---

## Phase 3: Hydration and Synthesis (Optional)

If a detailed narrative is required, batch-fetch full objects to enrich the action data.

```bash
# Get all item details (parallel)
curl -X POST "$BASE_URL/items/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_cpt_inc12",
      "..."
    ]
  }'

# Get version details for produced versions (parallel)
curl -X POST "$BASE_URL/versions/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2022-02-10!art5_cpt_inc12",
      "..."
    ]
  }'

# Get text units for narrative generation (parallel)
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "text_unit_v1_art5_cpt_inc12_...",
      "..."
    ]
  }'
```

**Agent Logic:**

```python
# Collect unique IDs from actions and items
versionIds = [vid for action in allRelevantActions for vid in action.producesVersionIds]

# Batch hydrate (parallel)
fullItems = get_batch_items(ids=list(finalItemIds))
fullVersions = get_batch_versions(ids=versionIds)

# Generate structured summary
summary = {
    "query": "Constitutional provisions related to Digital Security since 2000",
    "scope": {
        "themes": allThemeIds,
        "corpus": "constitutional-legislation",
        "itemsFound": len(finalItemIds),
        "actionsFound": totalActions
    },
    "actionSummary": actionByType,
    "timeline": sorted(allRelevantActions, key=lambda x: x.eventTime),
    "affectedItems": {item.id: item for item in fullItems},
    "affectedVersions": {version.id: version for version in fullVersions},
    "actionsByItem": itemActions
}

# Pass to LLM for narrative synthesis
narrative = synthesize_narrative(summary)

# Example output structure:
# {
#   "summary": "Between 2000 and 2025, 12 constitutional amendments affected 8 provisions related to Digital Security...",
#   "byProvision": [
#     {
#       "itemId": "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_cpt_inc12",
#       "label": "Art. 5, caput, Inc. 12 - Right to inviolability of privacy",
#       "actions": [
#         {"date": "2022-02-10", "type": "Amendment", "description": "EC 115/2022 modified..."}
#       ]
#     }
#   ]
# }
```

---

## Synthesized Outcome

The agent now has **complete, verifiable data** organized by constitutional source:

```python
result = {
    "query": "Evolution of Digital Security provisions since 2000",
    "scope": {
        "themes": ["theme_digital_security", "theme_data_protection", ...],
        "corpus": "constitutional-legislation",
        "itemsFound": 47,
        "actionsFound": 23
    },
    "timeline": [
        {
            "date": "2000-06-15",
            "type": "Amendment",
            "affectedItems": 3,
            "description": "EC 32/2000 introduced digital rights..."
        },
        ...
    ]
}
```

---

## Key Takeaways

✅ **Three Scope Rules Applied Simultaneously:** Thematic, Hierarchical, and Corpus scoping work together
✅ **Efficient Anchor Item Discovery:** Single `POST /items/search` call with combined filters avoids enumerate-everything-then-filter approach
✅ **Lightweight Hierarchy Traversal:** `/items/{itemId}/hierarchy` returns only Item IDs (strings), enabling efficient traversal
✅ **Optimal Parallel Architecture:** Minimal redundant work through strategic parallelization
✅ **Payload Efficiency:** Each `/query-actions` call has modest itemIds list (50-500 items per root)
✅ **Root-Associated Context:** Maintains root-to-items mapping throughout for easier narrative synthesis
✅ **Complete Evolutionary Analysis:** All actions affecting constitutional provisions related to Digital Security since 2000 are captured

---

*This use case is based on the research paper's real-world legal analysis scenarios.*
