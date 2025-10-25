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

_"What was the text of Article 6 of the Brazlian Constitution on May 20th, 2001?"_

### Overview

This fundamental pattern demonstrates how a natural language query is translated into a fully **deterministic and auditable retrieval plan** once the initial probabilistic grounding is complete.

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
    "label": "Article 6, caput",
    "type_id": "item-type:caput",
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
  "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
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

---

## Pattern 2: Thematic Analysis with Server-Side Aggregation

### User Query

_"Summarize the evolution of all constitutional provisions related to 'Digital Security' since 2000"_

### Overview

This pattern demonstrates how the API transforms a potentially massive client-side processing task into a **single, efficient query** using server-side aggregation.

### Agent Execution Plan

#### Step 1: Discover the Thematic Node

```bash
curl -G "$BASE_URL/search-themes" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "semantic_query=Digital Security" \
  --data-urlencode "top_k=5"
```

**Response:**

```json
[
  {
    "theme": {
      "id": "theme_digital_security",
      "label": "Digital Security and Privacy",
      "description": "Constitutional provisions related to digital rights..."
    },
    "score": 0.94
  }
]
```

**Agent Logic:**

```python
themes = search_themes(semantic_query="Digital Security")
theme_id = themes[0].theme.id
# theme_id = "theme_digital_security"
```

#### Step 2: Request Aggregate Impact Summary

Instead of fetching all items and their individual histories (highly inefficient), make a single powerful call.

```bash
curl -X POST "$BASE_URL/analysis/impact-summary" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "theme_ids": ["theme_digital_security"],
    "time_interval": ["2000-01-01T00:00:00Z", "2025-10-15T23:59:59Z"]
  }'
# considering 2025-10-15 as today
```

**Response:**

```json
{
  "total_actions": 12,
  "action_type_counts": {
    "Amendment": 8,
    "Creation": 3,
    "Revocation": 1
  },
  "actions": [
    "action_id_1",
    "action_id_2",
    "..."
  ],
  "affected_items": [
    "urn:lex:br:federal:constituicao:1988-10-05;1988!art5_inc12",
    "..."
  ],
  "time_interval": ["2000-01-01T00:00:00Z", "2025-10-15T23:59:59Z"]
}
```

**Agent Logic:**

```python
report = summarize_impact(
    theme_ids=[theme_id],
    time_interval=["2000-01-01T00:00:00Z", "2025-10-15T23:59:59Z"]
)
# Server performs complex aggregation
```

#### Step 3: Hydrate Details (If Needed)

If a more detailed narrative is required, make targeted batch calls.

> **Note:** These two batch calls are **independent** and can be executed in parallel for maximum efficiency (DAG execution pattern).

```bash
# Get full action details
curl -X POST "$BASE_URL/actions/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["action_id_1", "action_id_2", "..."]
  }'

# Get affected item details
curl -X POST "$BASE_URL/items/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["urn:lex:br:federal:constituicao:1988-10-05;1988!art5_inc12", "..."]
  }'
```

**Agent Logic:**

```python
# Optional: Hydrate for detailed narrative
# Note: These calls are independent and can run in parallel
full_actions = get_batch_actions(ids=report.actions)
full_items = get_batch_items(ids=report.affected_items)
```

### Key Takeaway

This pattern demonstrates:

- ✅ **Server-Side Aggregation:** Massive processing task → single API call
- ✅ **Efficiency:** Avoid N+1 query problem
- ✅ **Flexibility:** Get aggregate stats first, hydrate details only if needed

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
  "version_id": "version_id_xyz",
  "language": "pt-br",
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
  "version_id": "version_id_xyz",
  "language": "en",
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

| Pattern                     | Key Principle                  | Benefit                         |
| --------------------------- | ------------------------------ | ------------------------------- |
| **Point-in-Time Retrieval** | Probabilistic → Deterministic | Auditable, verifiable results   |
| **Thematic Analysis**       | Server-Side Aggregation        | Massive efficiency gains        |
| **Multilingual Fallback**   | Atomic Composability           | Robust, user-friendly behaviors |

All patterns share common characteristics:

- **Atomic Actions:** Low-level building blocks
- **Composability:** Combine into complex workflows
- **Auditability:** Complete trail of IDs and structured data
- **Determinism:** Guaranteed results after initial grounding

---

*These patterns form the foundation for building trustworthy, verifiable AI agents for legal retrieval.*
