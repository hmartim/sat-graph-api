# Use Case 3: Hierarchical Impact Summarization

> **Based on:** Research Paper Section 5.4.3

## User Query

_"Provide a summary of all legislative changes, specifically creations and revocations, within the 'Social Rights' ('dos Direitos Sociais') chapter of the Brazilian Constitution between January 1, 2019, and December 31, 2022."_

## The Challenge

This query is **impossible for systems that are not hierarchy-aware**:

❌ **Flat-Text Systems:**
- Would perform keyword search for "social rights"
- Retrieve irrelevant articles from unrelated chapters
- Miss the implicit scope of a specific constitutional chapter
- Cannot differentiate between action types (creation vs. amendment vs. revocation)

❌ **Standard RAG Systems:**
- No hierarchical filtering capabilities
- Cannot aggregate changes by structural scope
- Require manual filtering of results
- No temporal precision for date ranges

## Agent Execution Plan

The agent uses a **composable, multi-phase approach** to analyze hierarchical impact without relying on pre-aggregated endpoints. This demonstrates how atomic primitives (`/item-hierarchy`, `/query-actions`) can be combined to achieve efficient hierarchical impact analysis.

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Step 1: Identify the Scope

Resolve the natural language reference to get the canonical ID of the chapter.

```bash
curl -G "$BASE_URL/resolve-item-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "reference_text=Social Rights chapter of the Brazilian Constitution"
```

**Response:**
```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!tit2.cap2",
    "label": "Chapter II - Social Rights",
    "type_id": "item-type:chapter",
    "confidence": 0.96
  }
]
```

**Agent Logic:**
```python
candidates = resolve_item_reference(
    reference_text="Social Rights chapter of the Brazilian Constitution"
)
scope_id = candidates[0].id
```

---

## Step 2: Enumerate All Items in the Chapter (Hierarchical Scope)

Use `/item-hierarchy` to efficiently collect all Item IDs within the scope, then query their actions.

```bash
curl -X POST "$BASE_URL/item-hierarchy" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": ["urn:lex:br:federal:constituicao:1988-10-05;1988!tit2_cap2"],
    "depth": -1
  }'
```

**Response:**
```json
[
  "urn:lex:br:federal:constituicao:1988-10-05;1988!tit2_cap2",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art6",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art7",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art8",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art9",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art10",
  "urn:lex:br:federal:constituicao:1988-10-05;1988!art11"
]
```

**Agent Logic:**
```python
# Enumerate all descendants of the chapter
chapter_items = get_item_hierarchy(
    item_ids=[scope_id],
    depth=-1
)

# chapter_items now contains all items within the Social Rights chapter
# as a flat list of IDs for efficient use in further queries
```

---

## Step 3: Query Actions Affecting Those Items

Use `/query-actions` to retrieve all actions that affected these items during the target time period.

```bash
curl -X POST "$BASE_URL/query-actions" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art6",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art7",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art8",
      "..."
    ],
    "time_interval": {
      "start_time": "2019-01-01T00:00:00Z",
      "end_time": "2022-12-31T23:59:59Z"
    }
  }'
```

**Response:**
```json
[
  {
    "id": "action_creation_11a_2019_...",
    "type": "Creation",
    "date": "2019-11-06T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2019-11-06;11@2019-11-06...",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2019-11-06!art11a"
  },
  {
    "id": "action_revocation_5_2022_...",
    "type": "Revocation",
    "date": "2022-06-22T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2022-06-22;115@2022-06-22...",
    "produces_version_id": null,
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-01-01!art5"
  }
]
```

**Agent Logic:**
```python
# Query actions affecting all chapter items
actions = query_actions(
    item_ids=chapter_items,
    time_interval={
        "start_time": "2019-01-01T00:00:00Z",
        "end_time": "2022-12-31T23:59:59Z"
    }
)

# Aggregate statistics
total_actions = len(actions)
action_counts = {}
for action in actions:
    action_type = action.type
    action_counts[action_type] = action_counts.get(action_type, 0) + 1
```

---

## Step 4: Hydrate Details for Reporting

The `/query-actions` result contains Action references. To build a rich, human-readable narrative, the agent "hydrates" these IDs into full objects using **efficient batch calls**.

> **Note:** These batch calls are **independent** and can be executed in parallel for maximum efficiency (DAG execution pattern).

### Get Full Action Details

```bash
curl -X POST "$BASE_URL/actions/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "action_creation_11a_2019_...",
      "action_revocation_5_2022_..."
    ]
  }'
```

**Response:**
```json
[
  {
    "id": "action_creation_11a_2019_...",
    "type": "Creation",
    "date": "2019-11-06T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2019-11-06;110...",
    "terminates_version_id": null,
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2019-11-06;art11a"
  },
  {
    "id": "action_revocation_5_2022_...",
    "type": "Revocation",
    "date": "2022-06-22T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2022-06-22;115...",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-01-01!art5",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2022-06-22!art5"
  }
]
```

### Get Full Item Details

```bash
curl -X POST "$BASE_URL/items/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art5",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art11a"
    ]
  }'
```

**Response:**
```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art5",
    "type_id": "item-type:article",
    "label": "Article 5",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!tit2_cap2"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art11a",
    "type_id": "item-type:article",
    "label": "Article 11-A",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!tit2_cap2"
  }
]
```

**Agent Logic:**
```python
# Note: These calls are independent and can run in parallel
full_actions = get_batch_actions(ids=report.actions)
full_items = get_batch_items(ids=report.affected_items)

# Additional hydration for amending laws (optional)
source_law_ids = [action.source_version_id for action in full_actions]
amending_laws = get_batch_versions(ids=source_law_ids)
```

---

## Synthesized Outcome

The agent now possesses a **complete, structured dataset** of all relevant changes.

### Data Available for Synthesis

```python
synthesis_data = {
    "scope": "Social Rights",
    "time_range": "2019-01-01 to 2022-12-31",
    "summary": {
        "total_changes": 2,
        "creations": 1,
        "revocations": 1
    },
    "changes": [
        {
            "type": "Creation",
            "article": "Article 11-A",
            "date": "2019-11-06",
            "source": "Constitutional Amendment No. 110/2019"
        },

        {
            "type": "Revocation",
            "article": "Article 5",
            "date": "2021-03-15",
            "source": "Constitutional Amendment No. 109/2021"
        }
    ]
}
```

### Generated Response

> "Between **January 1, 2019** and **December 31, 2022**, the **Social Rights** chapter of the Constitution saw **2 legislative changes** matching your criteria (creations and revocations):
>
> **Creations (3):**
> 1. **Article 11-A** was created by Constitutional Amendment No. 110/2019, effective November 6, 2019
>
> **Revocations (2):**
> 1. **Article 5** was revoked by Constitutional Amendment No. 109/2021, effective March 15, 2021
>
> This is not a guess, but a **factual report grounded in the graph**, demonstrating complete, efficient, and auditable workflow from high-level aggregation to detailed reporting."

---

## Key Takeaways

✅ **Composable Primitives:** Uses atomic operations (`/item-hierarchy`, `/query-actions`) that can be independently tested and evolved

✅ **Hierarchical Traversal:** Efficiently collects all descendants of the chapter scope without full object hydration

✅ **Multi-Dimensional Filtering:** Filters by scope + time range + action type using `/query-actions`

✅ **Efficient Hydration:** Batch operations prevent N+1 query problem for detail enrichment

✅ **Complete Auditability:** Every claim backed by specific Action and Item IDs

✅ **Flexible Filtering:** Can adapt action type filters, time ranges, and item sets without API changes

### Execution Flow

```
Step 1: resolveItemReference()
    ↓
Step 2: get_item_hierarchy() [returns IDs only]
    ↓
Step 3: query_actions() [with time + type filters]
    ↓
Step 4 (Parallel): getBatchActions() ‖ getBatchItems()
    ↓
Synthesis
```

### Efficiency Comparison

| Approach | API Calls | Payload Size | Processing |
|----------|-----------|--------------|------------|
| **Naive** (N+1 histories) | 1 (enumerate) + N (histories) = **N+1** | Large (full objects) | Client-side aggregation |
| **Composite** (this pattern) | 1 (hierarchy) + 1 (query-actions) + 2 (batch hydration) = **4** | Minimal IDs → Rich hydration | Server-side query optimization |
| **Aggregated** (if available) | 1 (summarizeImpact) + 2 (batch) = **3** | Lightweight summaries | Pre-computed aggregation |

For a chapter with 100 articles and 50 actions: **151 calls vs. 4 calls** — a **~38x reduction** with composable primitives.

---

## Capabilities Impossible for Standard Systems

| Capability | Flat-Text System | Standard RAG | SAT-Graph API |
|------------|------------------|--------------|---------------|
| **Hierarchical scope filtering** | ❌ Keyword search only | ❌ No structure awareness | ✅ `/item-hierarchy` traversal |
| **Action type differentiation** | ❌ Cannot distinguish | ❌ No causal model | ✅ `action_types` filter in `/query-actions` |
| **Temporal precision** | ❌ No versioning | ❌ Probabilistic retrieval | ✅ `time_interval` filter in `/query-actions` |
| **Composable efficiency** | ❌ N/A | ❌ Limited primitives | ✅ Combines `/item-hierarchy` + `/query-actions` |

---

## Execution Pattern Summary

```
Composite Execution:
├── Step 1: resolveItemReference() [Probabilistic grounding]
│
├── Step 2: get_item_hierarchy() [Deterministic traversal]
│   └── Returns flat list of Item IDs in hierarchical scope
│
├── Step 3: query_actions() [Deterministic filtering]
│   └── Server performs:
│       ├── Filter by item_ids
│       ├── Filter by time_interval
│       ├── Filter by action_types
│       └── Return lightweight Action list
│
└── Step 4: Parallel hydration
    ├── getBatchActions(ids=[action IDs]) ‖ getBatchItems(ids=[affected items])
    └── Synthesis
```

This pattern demonstrates how **composable primitives** (`/item-hierarchy` + `/query-actions`) achieve similar efficiency to pre-aggregated endpoints while maintaining flexibility and auditability.

---

## Next Steps

- **[Structural vs. Normative Predecessors](04-structural-normative-predecessors.md)** - Dual-path disambiguation
- **[Causal Lineage Tracing](02-causal-lineage-tracing.md)** - Parallel task execution for legal audit
- **[Back to Fundamental Patterns](00-fundamental-patterns.md)** - Review atomic building blocks

---

*This use case demonstrates the power of server-side aggregation and hierarchical filtering for legislative impact analysis.*
