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
curl -G "$BASE_URL/themes/theme_digital_security/descendants" \
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
all_theme_ids = get_theme_descendants(root_theme_id)
# all_theme_ids = ["theme_digital_security", "theme_data_protection", ...]
```

**Step 1.3: Discover Constitutional Corpus (Corpus-First Approach)**

Rather than starting with theme-tagged items (which may be incomplete), discover **all constitutional-level items first**, then filter by theme. Get ItemType descendants for "constitutional-legislation" to understand what counts as constitutional (rule 3: Corpus Scope).

```bash
curl -G "$BASE_URL/item-types/item-type:constitutional-legislation/descendants" \
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
constitutional_item_types = get_item_type_descendants("item-type:constitutional-legislation")
# constitutional_item_types = ["item-type:constitution", "item-type:constitutional-amendment", ...]
```

**Step 1.4: Enumerate All Constitutional Root Items**

Find all Items of the constitutional ItemTypes discovered in 1.3. These are the root-level constitutional documents (e.g., the Constitution itself, each Constitutional Amendment).

```bash
curl -X POST "$BASE_URL/enumerate-items" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_type_ids": [
      "item-type:constitution",
      "item-type:constitutional-amendment",
      "item-type:constitutional-act"
    ]
  }'
```

**Response:**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988",
    "type": "item-type:constitution",
    "label": "Federal Constitution of Brazil (1988)"
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:1992-03-31;1",
    "type": "item-type:constitutional-amendment",
    "label": "Constitutional Amendment No. 1 of 1992"
  }
]
```

**Agent Logic:**

```python
constitutional_roots = enumerate_items(item_type_ids=constitutional_item_types)
root_item_ids = [item.id for item in constitutional_roots]
# root_item_ids = ["urn:lex:br:federal:constituicao:1988-10-05;1988",
#                  "urn:lex:br:federal:constituicao:1988-10-05;1988!ec1_1992", ...]
```

**Step 1.5: Expand Hierarchically and Filter by Theme (Parallel Execution)**

For **each** constitutional root discovered in 1.4, enumerate all descendants to get component-level items (articles, paragraphs, clauses). This can be done in **parallel** since there are no dependencies.

Then filter results to keep only items that:
- Are directly linked to any theme in `all_theme_ids`, OR
- Have an ancestor that is directly linked to any theme in `all_theme_ids`

(This implements rule 2: Hierarchical Scope)

```bash
# Executed in parallel, one call per constitutional root
curl -X POST "$BASE_URL/enumerate-items" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": ["urn:lex:br:federal:constituicao:1988-10-05;1988"],
    "depth": -1
  }'

curl -X POST "$BASE_URL/enumerate-items" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": ["urn:lex:br:federal:emenda.constitucional:1992-03-31;1"],
    "depth": -1
  }'
# ... one call per root item
```

**Response (per root):**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art1",
    "type": "item-type:article",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;1988"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art1_cpt",
    "type": "item-type:caput",
    "parent_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art1"
  }
]
```

**Agent Logic (Client-side Filtering):**

```python
# Collect all descendants from all roots (these calls are parallel)
all_descendants = []
for root_id in root_item_ids:
    descendants = enumerate_items(item_ids=[root_id], depth=-1)
    all_descendants.extend(descendants)

# Build a set of items directly linked to the thematic scope
theme_linked_items = set()
for item in all_descendants:
    # Get themes associated with this item
    item_themes = get_themes_for_item(item.id)
    if any(theme.id in all_theme_ids for theme in item_themes):
        theme_linked_items.add(item.id)

# Apply hierarchical rule: include all descendants of theme-linked items
final_item_ids = set()
for root_id in root_item_ids:
    descendants = enumerate_items(item_ids=[root_id], depth=-1)
    for item in descendants:
        # Include if directly theme-linked
        if item.id in theme_linked_items:
            final_item_ids.add(item.id)
        # Include if any ancestor is theme-linked
        elif any(ancestor.id in theme_linked_items for ancestor in get_ancestors(item.id)):
            final_item_ids.add(item.id)

# final_item_ids now contains all items satisfying all three scope rules
```

> **Efficiency Note:** Steps 1.4-1.5 enumerate all constitutional descendants in parallel (one call per root), then apply theme filtering client-side. This is more efficient than trying to do filtered enumeration server-side, as it avoids repeated traversals.

#### Phase 2: Historical Analysis (Single Efficient Query)

**Step 2.1: Query All Relevant Actions Since 2000**

Instead of making individual `/items/{itemId}/history` calls for each discovered item, use a single powerful `/query-actions` call to retrieve all actions affecting the discovered items in one operation.

```bash
curl -X POST "$BASE_URL/query-actions" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_inc12",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art220",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!ec1_1992",
      "..."
    ],
    "time_interval": {
      "start_time": "2000-01-01T00:00:00Z"
    }
  }'
```

**Response:**

```json
[
  {
    "id": "action_ec_115_2022",
    "type": "Amendment",
    "effective_time": "2022-02-10T00:00:00Z",
    "target_item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_inc12",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art5_inc12",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2022-02-10!art5_inc12"
  },
  {
    "id": "action_ec_32_2001",
    "type": "Amendment",
    "effective_time": "2001-09-11T00:00:00Z",
    "target_item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art220",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art220",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2001-09-11!art220"
  }
]
```

**Agent Logic:**

```python
# Single efficient query: retrieve all relevant actions in one call
all_relevant_actions = query_actions(
    item_ids=list(final_item_ids),
    time_interval={
        "start_time": "2000-01-01T00:00:00Z"
    }
)

# Aggregate statistics
total_actions = len(all_relevant_actions)
action_by_type = {}
for action in all_relevant_actions:
    action_type = action.type
    action_by_type[action_type] = action_by_type.get(action_type, 0) + 1
# action_by_type = {"Amendment": 12, "Creation": 3, "Revocation": 1}

# Build item-to-actions mapping for later synthesis
item_actions = {}
for action in all_relevant_actions:
    item_id = action.target_item_id
    if item_id not in item_actions:
        item_actions[item_id] = []
    item_actions[item_id].append(action)
```

> **Efficiency Advantage:** This single `/query-actions` call replaces what would have been M individual `/items/{itemId}/history` calls (where M = |final_item_ids|). For typical constitutional analysis with 500+ items, this means one request instead of 500+, dramatically improving both latency and throughput.

#### Phase 3: Hydration and Synthesis (Optional)

If a detailed narrative is required, batch-fetch full objects to enrich the action data.

```bash
# Get all item details (parallel)
curl -X POST "$BASE_URL/items/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_inc12",
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art220",
      "..."
    ]
  }'

# Get version details for produced versions (parallel)
curl -X POST "$BASE_URL/versions/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2022-02-10!art5_inc12",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2001-09-11!art220",
      "..."
    ]
  }'

# Get text units for narrative generation (parallel)
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "text_unit_v1_art5",
      "text_unit_v2_art220",
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
#       "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_inc12",
#       "label": "Art. 5, Inc. 12 - Right to inviolability of privacy",
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

- ✅ **Corpus-First Discovery:** Enumerates all constitutional roots first, then filters by theme (avoiding incomplete theme tagging)

- ✅ **Extreme Efficiency:**
  - Phase 1: One `enumerate-items` call per constitutional root (typically 2-10 roots, in parallel)
  - Phase 2: **One single `/query-actions` call** instead of M individual `/items/{id}/history` calls
    - For 500+ discovered items, this means **1 request instead of 500+**
  - Phase 3: Batch operations executed in parallel

- ✅ **Client-Side Filtering:** Theme membership checks done locally after hierarchical enumeration, reducing server-side complexity

- ✅ **Composable Primitives:** Uses atomic, well-defined operations (`search-themes`, `get_theme_descendants`, `enumerate-items`, `/query-actions`) that can be independently tested and evolved

- ✅ **Complete Evolutionary Analysis:** All actions affecting constitutional provisions related to Digital Security since 2000 are captured, aggregated, and synthesized into a structured narrative

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
