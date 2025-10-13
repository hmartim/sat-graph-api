# Use Case 3: Hierarchical Impact Summarization

> **Based on:** Research Paper Section 5.4.3

## User Query

_"Provide a summary of all legislative changes, specifically creations and revocations, within the 'National Tax System' chapter of the Constitution between January 1, 2019, and December 31, 2022."_

## The Challenge

This query is **impossible for systems that are not hierarchy-aware**:

❌ **Flat-Text Systems:**
- Would perform keyword search for "tax"
- Retrieve irrelevant articles from unrelated chapters
- Miss the implicit scope of a specific constitutional chapter
- Cannot differentiate between action types (creation vs. amendment vs. revocation)

❌ **Standard RAG Systems:**
- No hierarchical filtering capabilities
- Cannot aggregate changes by structural scope
- Require manual filtering of results
- No temporal precision for date ranges

## Agent Execution Plan

The agent leverages the API's **powerful server-side aggregation capabilities** to construct a highly specific and efficient query plan.

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
  --data-urlencode "reference_text=National Tax System chapter of the Constitution"
```

**Response:**
```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1",
    "label": "Chapter I - National Tax System",
    "type_id": "item-type:chapter",
    "confidence": 0.96
  }
]
```

**Agent Logic:**
```python
candidates = resolve_item_reference(
    reference_text="National Tax System chapter of the Constitution"
)
scope_id = candidates[0].id
# scope_id = "urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1"
```

---

## Step 2: Request a Filtered Impact Summary

Instead of fetching all items and their individual histories (highly inefficient), make a **single powerful call** to the aggregate analysis action.

> **Critical Design Decision:** This demonstrates the power of **server-side aggregation**. Without this, the client would need to:
> 1. Enumerate all items in the chapter (potentially hundreds)
> 2. Get history for each item (N API calls)
> 3. Filter by date range (client-side processing)
> 4. Filter by action type (client-side processing)
>
> **Result:** O(N) complexity vs. O(1) with server-side aggregation.

```bash
curl -X POST "$BASE_URL/analysis/impact-summary" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": ["urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1"],
    "time_interval": [
      "2019-01-01T00:00:00Z",
      "2022-12-31T23:59:59Z"
    ],
    "action_types": ["Creation", "Revocation"]
  }'
```

**Response:**
```json
{
  "total_actions": 5,
  "action_type_counts": {
    "Creation": 3,
    "Revocation": 2
  },
  "actions": [
    "action_creation_156a_2019",
    "action_revocation_149a_2021",
    "action_creation_156b_2020",
    "action_revocation_156c_2022",
    "action_creation_153a_2019"
  ],
  "affected_items": [
    "urn:lex:br:federal:constituicao:1988-10-05;art156a",
    "urn:lex:br:federal:constituicao:1988-10-05;art149a",
    "urn:lex:br:federal:constituicao:1988-10-05;art156b",
    "urn:lex:br:federal:constituicao:1988-10-05;art156c",
    "urn:lex:br:federal:constituicao:1988-10-05;art153a"
  ],
  "time_interval": [
    "2019-01-01T00:00:00Z",
    "2022-12-31T23:59:59Z"
  ]
}
```

**Agent Logic:**
```python
report = summarize_impact(
    item_ids=[scope_id],
    time_interval=["2019-01-01T00:00:00Z", "2022-12-31T23:59:59Z"],
    action_types=["Creation", "Revocation"]
)

# Server performs complex aggregation:
# - Enumerates all descendants of the chapter
# - Filters actions by date range
# - Filters actions by type
# - Returns lightweight summary
```

---

## Step 3: Hydrate Details for Reporting

The returned `ImpactReport` contains **lightweight lists of identifiers**. To build a rich, human-readable narrative, the agent "hydrates" these IDs into full objects using **efficient batch calls**.

> **Note:** These two batch calls are **independent** and can be executed in parallel for maximum efficiency (DAG execution pattern).

### Get Full Action Details

```bash
curl -X POST "$BASE_URL/actions/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "action_creation_156a_2019",
      "action_revocation_149a_2021",
      "action_creation_156b_2020",
      "action_revocation_156c_2022",
      "action_creation_153a_2019"
    ]
  }'
```

**Response:**
```json
[
  {
    "id": "action_creation_156a_2019",
    "type": "Creation",
    "date": "2019-11-06T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2019-11-06;110",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art156a@2019-11-06",
    "terminates_version_id": null
  },
  {
    "id": "action_revocation_149a_2021",
    "type": "Revocation",
    "date": "2021-03-15T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2021-03-15;109",
    "produces_version_id": null,
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art149a@1988-10-05"
  },
  {
    "id": "action_creation_156b_2020",
    "type": "Creation",
    "date": "2020-07-14T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2020-07-14;112",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art156b@2020-07-14",
    "terminates_version_id": null
  },
  {
    "id": "action_revocation_156c_2022",
    "type": "Revocation",
    "date": "2022-06-22T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2022-06-22;115",
    "produces_version_id": null,
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art156c@2021-01-01"
  },
  {
    "id": "action_creation_153a_2019",
    "type": "Creation",
    "date": "2019-12-20T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2019-12-20;110",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art153a@2019-12-20",
    "terminates_version_id": null
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
      "urn:lex:br:federal:constituicao:1988-10-05;art156a",
      "urn:lex:br:federal:constituicao:1988-10-05;art149a",
      "urn:lex:br:federal:constituicao:1988-10-05;art156b",
      "urn:lex:br:federal:constituicao:1988-10-05;art156c",
      "urn:lex:br:federal:constituicao:1988-10-05;art153a"
    ]
  }'
```

**Response:**
```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art156a",
    "type_id": "item-type:article",
    "label": "Article 156-A",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1.section3"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art149a",
    "type_id": "item-type:article",
    "label": "Article 149-A",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1.section2"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art156b",
    "type_id": "item-type:article",
    "label": "Article 156-B",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1.section3"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art156c",
    "type_id": "item-type:article",
    "label": "Article 156-C",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1.section3"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art153a",
    "type_id": "item-type:article",
    "label": "Article 153-A",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;title6.chapter1.section2"
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
    "scope": "National Tax System chapter",
    "time_range": "2019-01-01 to 2022-12-31",
    "filter": "Creations and Revocations only",
    "summary": {
        "total_changes": 5,
        "creations": 3,
        "revocations": 2
    },
    "changes": [
        {
            "type": "Creation",
            "article": "Article 156-A",
            "date": "2019-11-06",
            "law": "Constitutional Amendment No. 110/2019"
        },
        {
            "type": "Creation",
            "article": "Article 153-A",
            "date": "2019-12-20",
            "law": "Constitutional Amendment No. 110/2019"
        },
        {
            "type": "Creation",
            "article": "Article 156-B",
            "date": "2020-07-14",
            "law": "Constitutional Amendment No. 112/2020"
        },
        {
            "type": "Revocation",
            "article": "Article 149-A",
            "date": "2021-03-15",
            "law": "Constitutional Amendment No. 109/2021"
        },
        {
            "type": "Revocation",
            "article": "Article 156-C",
            "date": "2022-06-22",
            "law": "Constitutional Amendment No. 115/2022"
        }
    ]
}
```

### Generated Response

> "Between **January 1, 2019** and **December 31, 2022**, the **National Tax System** chapter of the Constitution saw **5 legislative changes** matching your criteria (creations and revocations):
>
> **Creations (3):**
> 1. **Article 156-A** was created by Constitutional Amendment No. 110/2019, effective November 6, 2019
> 2. **Article 153-A** was created by Constitutional Amendment No. 110/2019, effective December 20, 2019
> 3. **Article 156-B** was created by Constitutional Amendment No. 112/2020, effective July 14, 2020
>
> **Revocations (2):**
> 1. **Article 149-A** was revoked by Constitutional Amendment No. 109/2021, effective March 15, 2021
> 2. **Article 156-C** was revoked by Constitutional Amendment No. 115/2022, effective June 22, 2022
>
> This is not a guess, but a **factual report grounded in the graph**, demonstrating complete, efficient, and auditable workflow from high-level aggregation to detailed reporting."

---

## Key Takeaways

✅ **Server-Side Aggregation:** Transforms O(N) client-side processing into O(1) server call

✅ **Hierarchical Filtering:** Automatically includes all descendants of the specified chapter

✅ **Multi-Dimensional Filtering:** Filters by scope + time range + action type simultaneously

✅ **Efficient Hydration:** Batch operations prevent N+1 query problem

✅ **Complete Auditability:** Every claim backed by specific Action and Item IDs

### Efficiency Comparison

| Approach | API Calls | Processing |
|----------|-----------|------------|
| **Without Server Aggregation** | 1 (enumerate) + N (histories) + N (items) = **2N+1** | Client-side filtering |
| **With Server Aggregation** | 1 (summarizeImpact) + 2 (batch hydration) = **3** | Server-side filtering |

For a chapter with 100 articles, this is **201 calls vs. 3 calls** — a **67x reduction**.

---

## Capabilities Impossible for Standard Systems

| Capability | Flat-Text System | Standard RAG | SAT-Graph API |
|------------|------------------|--------------|---------------|
| **Hierarchical scope filtering** | ❌ Keyword search only | ❌ No structure awareness | ✅ enumerateItems() descendants |
| **Action type differentiation** | ❌ Cannot distinguish | ❌ No causal model | ✅ action_types filter |
| **Temporal precision** | ❌ No versioning | ❌ Probabilistic retrieval | ✅ time_interval filter |
| **Server-side aggregation** | ❌ N/A | ❌ Client-side only | ✅ summarizeImpact() |

---

## Execution Pattern Summary

```
Sequential Execution:
├── Step 1: resolveItemReference() [Probabilistic grounding]
│
├── Step 2: summarizeImpact() [Deterministic aggregation]
│   └── Server performs:
│       ├── Enumerate all descendants of scope
│       ├── Filter by time_interval
│       ├── Filter by action_types
│       └── Return lightweight summary
│
└── Step 3: Parallel hydration
    ├── getBatchActions() ‖ getBatchItems()
    └── Synthesis
```

---

## Next Steps

- **[Structural vs. Normative Predecessors](04-structural-normative-predecessors.md)** - Dual-path disambiguation
- **[Causal Lineage Tracing](02-causal-lineage-tracing.md)** - Parallel task execution for legal audit
- **[Back to Fundamental Patterns](00-fundamental-patterns.md)** - Review atomic building blocks

---

*This use case demonstrates the power of server-side aggregation and hierarchical filtering for legislative impact analysis.*
