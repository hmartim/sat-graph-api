# Fundamental Patterns: API as Foundation for Agentic Reasoning

This guide demonstrates the foundational patterns that showcase how the SAT-Graph API enables sophisticated agentic reasoning through composable, atomic actions.

> **Note:** These examples are based on the research paper's Section 5.3.1: "API as a Foundation for Agentic Reasoning"

## Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Pattern 1: Point-in-Time Retrieval Plan

### User Query

_"What was the text of Article 6 of the Brazilian Constitution on May 20th, 2001?"_

### Overview

This fundamental pattern demonstrates how a natural language query is translated into a **deterministic and auditable retrieval plan** once the initial probabilistic grounding is complete.

### Agent Execution Plan

The agent decomposes this into a clean, sequential plan with the goal of deterministically finding the single correct textual version for that specific date.

#### Step 1: Ground the Reference

First, resolve the natural language reference to a canonical ID (the agent knows that the text of a article is in its caput).

```bash
curl -G "$BASE_URL/resolve-item-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "reference_text=Article 6, caput of the Brazilian Constitution"
 # Agent knows that the text of a article is in its caput
```

**Response:**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
    "confidence": 0.98
  }
]
```

**Agent Logic:**

```python
candidates = resolve_item_reference(reference_text="Article 6, caput of the Brazilian Constitution")
item_id = candidates[0].id  # Proceed with top candidate
# item_id = "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt"
```

#### Step 2: Find the Valid Version

Retrieve the unique historical Version object valid at the target date.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt/valid-version?timestamp=2001-05-20T00:00:00Z&policy=PointInTime"
```

**Response:**

```json
{
  "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
  "validity_interval": [
    "2000-02-14T00:00:00Z",
    "2010-02-04T00:00:00Z"
  ]
}
```

**Note:** To retrieve structural relationships, use dedicated endpoints:

- `GET /versions/{versionId}/parent?at={timestamp}` - Get parent Version at specific time
- `GET /versions/{versionId}/children` - Get child Versions

**Agent Logic:**

```python
version = get_valid_version(
    item_id=item_id,
    timestamp="2001-05-20T00:00:00Z",
    temporal_policy="PointInTime"
)
version_id = version.id
# version_id = "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt"
```

#### Step 3: Retrieve the Text

Get the final, correct TextUnit in the desired language.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt/text-unit?language=pt-br"
```

**Response:**

```json
{
  "id": "text_unit_abc123",
  "source_type": "Version",
  "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
  "language": "pt-br",
  "aspect": "canonical",
  "content": "[ Art. 6º ] São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição."
}
```

**Agent Logic:**

```python
text_unit = get_text_for_version(
    version_id=version_id,
    language="pt-br"
)
final_text = text_unit.content
```

### Key Takeaway

This simple chain demonstrates:

- ✅ **Probabilistic → Deterministic:** Only the first step is probabilistic; all subsequent steps are guaranteed
- ✅ **Auditability:** Every step returns verifiable data with IDs
- ✅ **Composability:** Three atomic actions compose into a complete workflow

**Contrast with RAG-based approaches:** Even with temporal markers on text chunks, RAG-based retrieval relies on probabilistic chance to surface the correct article text. The SAT-Graph API shifts this luck to a single point—identifying the right Item component—while the rest of the retrieval becomes fully deterministic.

---

## Pattern 2: Constitutional Evolutionary Analysis with Thematic Filtering

### User Query

_"Summarize the evolution of all constitutional provisions related to the theme 'Digital Security' since 2000"_

### Overview

This pattern demonstrates how to efficiently discover and track the complete evolution of constitutional provisions within a specific thematic domain. It combines **corpus-first discovery** (ensuring we get all constitutional items) with **thematic filtering** (ensuring relevance to the specific theme), then expands hierarchically to capture all component-level provisions.

### Key Strategy

The query requires satisfying **three scoping rules simultaneously**:

1. **Thematic Scope (Inclusive Expansion)**: Start with theme "Digital Security" and expand to include all sub-themes (entire sub-tree in the theme taxonomy)
2. **Hierarchical Scope (Descendant Propagation)**: If an Item (e.g., Norm, Title, Article) is linked to any theme in the thematic scope, include all its descendant Items (paragraphs, clauses) even if not directly theme-linked
3. **Corpus Scope (Restrictive Filter)**: All resulting Items must belong to the "constitutional-legislation" corpus (directly or via ItemType hierarchy)

This combination ensures we capture:
- All constitutional provisions (by corpus constraint)
- That relate to Digital Security (by thematic scope)
- Including nested provisions under theme-linked parents (by hierarchical expansion)

### Agent Execution Plan

#### Phase 1: Scope Resolution (Finding All Relevant Item IDs)

**Step 1.1: Discover the Thematic Node**

```bash
curl -X POST "$BASE_URL/search-themes" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content_query": "Digital Security",
    "top_k": 1
  }'
```

**Response:**

```json
[
  {
    "item": {
      "id": "theme_digital_security",
      "label": "Digital Security and Privacy"
    },
    "score": 0.95
  }
]
```

**Agent Logic:**

```python
themes = search_themes(content_query="Digital Security", top_k=1)
root_theme_id = themes[0].item.id
# root_theme_id = "theme_digital_security"
```

**Step 1.2: Expand Thematic Scope (Get All Sub-Themes)**

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
all_theme_ids = get_theme_hierarchy(root_theme_id)
# all_theme_ids = ["theme_digital_security", "theme_data_protection", ...]
```

**Step 1.3: Get Constitutional ItemType Descendants**

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
constitutional_item_types = get_item_type_hierarchy("item-type:constitutional-legislation")
# constitutional_item_types = ["item-type:constitution", "item-type:constitutional-amendment", ...]
```

**Step 1.4: Search for Constitutional Items Linked to Themes (Single Efficient Query)**

Use a single `search-items` call to find all items that satisfy BOTH criteria:
- Are of constitutional ItemTypes (Corpus Scope - rule 3)
- Are linked to any theme in the Digital Security tree (Thematic Scope - rule 1)

This single call efficiently finds the "anchor items" (items that are both constitutional AND thematic) without enumerating everything first.

```bash
curl -X POST "$BASE_URL/search-items" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_type_ids": [
      "item-type:constitutional-legislation"
      "item-type:constitution",
      "item-type:constitutional-amendment",
      "item-type:constitutional-act"
    ],
    "theme_ids": [
      "theme_digital_security",
      "theme_data_protection",
      "theme_cybersecurity",
      "theme_digital_privacy"
    ],
    "top_k": -1
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
anchor_items = search_items(
    item_type_ids=constitutional_item_types,
    theme_ids=all_theme_ids,
    top_k=-1
)
anchor_item_ids = [result.item.id for result in anchor_items]
# anchor_item_ids = ["urn:lex:br:federal:constituicao:1988-10-05;1988", ...]
```

**Step 1.5: Enumerate Descendants (Parallel Execution for Hierarchical Expansion)**

For **each** anchor item discovered in 1.4, enumerate all descendants to implement rule 2 (Hierarchical Scope): "if a parent is linked to a theme, include all its children".

These enumeration calls can run in **parallel** since there are no dependencies.

```bash
# Executed in parallel, one call per anchor item
curl -X POST "$BASE_URL/item-hierarchy" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": ["urn:lex:br:federal:constituicao:1988-10-05;1988"],
    "depth": -1
  }'

curl -X POST "$BASE_URL/item-hierarchy" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": ["urn:lex:br:federal:emenda.constitucional:1992-03-31;1"],
    "depth": -1
  }'
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
final_item_ids = set()

for anchor_item in anchor_items:
    # Enumerate the full subtree rooted at this anchor item via /item-hierarchy
    # Returns: ["id1", "id2", "id3", ...]
    descendant_ids = get_item_hierarchy(
        item_ids=[anchor_item.id],
        depth=-1
    )

    # Add all descendants to final scope
    final_item_ids.update(descendant_ids)

# final_item_ids now contains all items satisfying all three scope rules:
# 1. Thematic Scope: All items in subtrees rooted at theme-linked items
# 2. Hierarchical Scope: All descendants of theme-linked items included
# 3. Corpus Scope: All items from search-items (filtered by constitutional ItemTypes)
```

> **Efficiency Note:** Step 1.4 uses `search-items` with combined filters to efficiently find anchor items (constitutional AND thematic). Step 1.5 enumerates only the subtrees rooted at these anchors. This approach avoids enumerating everything and filtering afterwards—we only enumerate what matters.

#### Phase 2: Historical Analysis (Parallel Root-Scoped Queries)

**Step 2.1: Query Actions Per Root (Parallel Execution)**

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
    "item_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art1",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art1_cpt",
      "..."
    ],
    "time_interval": {
      "start_time": "2000-01-01T00:00:00Z"
    }
  }'

# For Constitutional Amendment #1 root
curl -X POST "$BASE_URL/query-actions" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": [
      "urn:lex:br:federal:emenda.constitucional:1992-03-31;1",
      "urn:lex:br:federal:emenda.constitucional:1992-03-31;1!art1",
      "..."
    ],
    "time_interval": {
      "start_time": "2000-01-01T00:00:00Z"
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
    "effective_time": "2022-02-10T00:00:00Z",
    "source_item_id": "...",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art5_cpt_inc12",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2022-02-10!art5_cpt_inc12"
  },
  { ... }
]
```

**Agent Logic:**

```python
# Parallel execution: one query-actions call per root
# Each call is independent and can run concurrently
all_relevant_actions = []
root_actions = {}

for root_id, scoped_items in root_scoped_items.items():
    # Each call queries only the items scoped to this root
    actions = query_actions(
        item_ids=list(scoped_items),
        time_interval={
            "start_time": "2000-01-01T00:00:00Z"
        }
    )
    root_actions[root_id] = actions
    all_relevant_actions.extend(actions)

# Aggregate statistics
total_actions = len(all_relevant_actions)
action_by_type = {}
for action in all_relevant_actions:
    action_type = action.type
    action_by_type[action_type] = action_by_type.get(action_type, 0) + 1

# Build item-to-actions mapping for later synthesis
item_actions = {}
for action in all_relevant_actions:
    item_id = action.target_item_id
    if item_id not in item_actions:
        item_actions[item_id] = []
    item_actions[item_id].append(action)
```
#### Phase 3: Hydration and Synthesis (Optional)

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
version_ids = [action.produces_version_id for action in all_relevant_actions]

# Batch hydrate (parallel)
full_items = get_batch_items(ids=list(final_item_ids))
full_versions = get_batch_versions(ids=version_ids)

# Generate structured summary
summary = {
    "query": "Constitutional provisions related to Digital Security since 2000",
    "scope": {
        "themes": all_theme_ids,
        "corpus": "constitutional-legislation",
        "items_found": len(final_item_ids),
        "actions_found": total_actions
    },
    "action_summary": action_by_type,
    "timeline": sorted(all_relevant_actions, key=lambda x: x.effective_time),
    "affected_items": {item.id: item for item in full_items},
    "affected_versions": {version.id: version for version in full_versions},
    "actions_by_item": item_actions
}

# Pass to LLM for narrative synthesis
narrative = synthesize_narrative(summary)

# Example output structure:
# {
#   "summary": "Between 2000 and 2025, 12 constitutional amendments affected 8 provisions related to Digital Security...",
#   "by_provision": [
#     {
#       "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_cpt_inc12",
#       "label": "Art. 5, caput, Inc. 12 - Right to inviolability of privacy",
#       "actions": [
#         {"date": "2022-02-10", "type": "Amendment", "description": "EC 115/2022 modified..."}
#       ]
#     }
#   ]
# }
```

### Key Takeaway

This pattern demonstrates:

- ✅ **Three Scope Rules Applied Simultaneously:**
  - Thematic Scope: Expands to include all sub-themes of "Digital Security"
  - Hierarchical Scope: Propagates theme membership down to all descendants
  - Corpus Scope: Filters to only constitutional-legislation items

- ✅ **Efficient Anchor Item Discovery:** Uses single `search-items` call with combined filters (`item_type_ids` AND `theme_ids`) to find items that are both constitutional AND thematic, avoiding enumerate-everything-then-filter approach

- ✅ **Lightweight Hierarchy Traversal:** `/item-hierarchy` returns only Item IDs (strings), not full objects, enabling efficient traversal of hierarchies with minimal payload

- ✅ **Optimal Parallel Architecture:**
  - Phase 1: Single `search-items` call + N parallel `/item-hierarchy` calls (one per anchor item, returning IDs only)
  - Phase 2: **N parallel `/query-actions` calls** (one per anchor item) instead of:
    - M individual `/items/{id}/history` calls (M = 500+), OR
    - 1 massive call with 500+ item_ids in payload
  - Phase 3: Batch operations executed in parallel
  - **Result:** Minimal redundant work - only enumerate relevant subtrees with efficient ID-only responses

- ✅ **Payload Efficiency:**
  - Each `/query-actions` call has modest item_ids list (50-500 items per root)
  - Avoids HTTP size limits
  - Enables server-side query optimization (per-root database indices)

- ✅ **Client-Side Filtering:** Theme membership checks done locally after hierarchical enumeration, reducing server-side complexity

- ✅ **Root-Associated Context:** Maintains root-to-items mapping throughout, enabling logical grouping by constitutional source and easier narrative synthesis

- ✅ **Composable Primitives:** Uses atomic, well-defined operations (`search-themes`, `get_theme_hierarchy`, `/item-hierarchy`, `/query-actions`) that can be independently tested and evolved

- ✅ **Complete Evolutionary Analysis:** All actions affecting constitutional provisions related to Digital Security since 2000 are captured, aggregated, and synthesized into a structured narrative organized by source document

---

## Pattern 3: Robustness with Multilingual Fallback

### User Query

_User prefers Portuguese (pt-BR) but some texts may not be available in that language_

### Overview

This pattern shows how the API's **atomic nature** enables agents to build **robust and user-friendly behaviors** through graceful fallback strategies.

### Agent Execution Plan

#### Step 1: Attempt Preferred Language

Try to retrieve text in user's preferred language.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/version_id_xyz/text-unit?language=pt-br"
```

**Possible Responses:**

**Success Case:**

```json
{
  "id": "text_unit_123",
  "source_type": "Version",
  "source_id": "version_id_xyz",
  "language": "pt-br",
  "aspect": "canonical",
  "content": "Texto em português..."
}
```

**Failure Case (404):**

```json
{
  "code": "TEXT_NOT_FOUND",
  "message": "No TextUnit found for version 'version_id_xyz' with language 'pt-br'"
}
```

#### Step 2: Fallback to Default Language

If the first call fails, don't give up—retrieve in fallback language.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/version_id_xyz/text-unit?language=en"
```

**Response:**

```json
{
  "id": "text_unit_456",
  "source_type": "Version",
  "source_id": "version_id_xyz",
  "language": "en",
  "aspect": "canonical",
  "content": "Text in English..."
}
```

#### Step 3: Inform User of Substitution

**Agent Logic:**

```python
def get_text_with_fallback(version_id, preferred_lang="pt-br", fallback_lang="en"):
    try:
        # Attempt preferred language
        text = get_text_for_version(version_id, preferred_lang)
        return {
            "content": text.content,
            "language": preferred_lang,
            "is_fallback": False
        }
    except NotFoundError:
        # Graceful fallback
        text = get_text_for_version(version_id, fallback_lang)
        return {
            "content": text.content,
            "language": fallback_lang,
            "is_fallback": True,
            "message": f"The requested text was not available in {preferred_lang}. Displaying the {fallback_lang} version instead."
        }

result = get_text_with_fallback(version_id="version_id_xyz")

if result["is_fallback"]:
    print(f"⚠️ {result['message']}")
print(result["content"])
```

**User Experience:**

```
⚠️ The requested text was not available in pt-br. Displaying the en version instead.

Text in English...
```

### Key Takeaway

This pattern demonstrates:

- ✅ **Resilience:** Graceful degradation instead of failure
- ✅ **Transparency:** User is informed about the substitution
- ✅ **Composability:** Clear separation of concerns enables sophisticated behavior

---

## Summary

These three fundamental patterns showcase the power of the SAT-Graph API:


| Pattern                              | Key Principle                    | Benefit                               |
| ------------------------------------ | -------------------------------- | ------------------------------------- |
| **Point-in-Time Retrieval**          | Probabilistic → Deterministic   | Auditable, verifiable results         |
| **Comprehensive Evolutionary Analysis** | Dual-Path Discovery + Parallelization | Complete coverage, maximum efficiency |
| **Multilingual Fallback**            | Atomic Composability             | Robust, user-friendly behaviors       |

All patterns share common characteristics:

- **Atomic Actions:** Low-level building blocks
- **Composability:** Combine into complex workflows
- **Auditability:** Complete trail of IDs and structured data
- **Determinism:** Guaranteed results after initial grounding

---

*These patterns form the foundation for building trustworthy, verifiable AI agents for legal retrieval.*
