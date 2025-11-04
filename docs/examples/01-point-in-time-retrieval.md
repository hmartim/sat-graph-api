# Use Case 1: Point-in-Time Retrieval Plan

> **Based on:** Research Paper Section 5.3.1: "API as a Foundation for Agentic Reasoning"

## User Query

_"What was the text of Article 6 of the Brazilian Constitution on May 20th, 2001?"_

## The Challenge

A standard RAG system would likely:
- ❌ Retrieve multiple conflicting versions from its index
- ❌ Have no deterministic way to get the exact version at a specific date
- ❌ Lack temporal grounding to guarantee accuracy

## Agent Execution Plan

The agent's strategy is to **ground the reference, find the valid version at the target date, and retrieve the text deterministically**.

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

### Step 1: Ground the Reference

First, resolve the natural language reference to a canonical ID (the agent knows that the text of an article is in its caput).

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

---

### Step 2: Find the Valid Version

Retrieve the unique historical Version object valid at the target date.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt/valid-version?timestamp=2001-05-20T00:00:00Z"
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
    timestamp="2001-05-20T00:00:00Z"
)
version_id = version.id
# version_id = "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt"
```

---

### Step 3: Retrieve the Text

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

---

## Synthesized Outcome

The agent now has **complete, verifiable data**:

```python
result = {
    "query": "Text of Article 6, caput on May 20th, 2001",
    "resolved_item": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
    "valid_version": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "validity_period": ["2000-02-14T00:00:00Z", "2010-02-04T00:00:00Z"],
    "language": "pt-br",
    "text": "[ Art. 6º ] São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição."
}
```

---

## Key Takeaways

✅ **Probabilistic → Deterministic:** Only the first step is probabilistic; all subsequent steps are guaranteed
✅ **Auditability:** Every step returns verifiable data with IDs
✅ **Composability:** Three atomic actions compose into a complete workflow
✅ **Temporal Accuracy:** Guaranteed correct version at target date

**Contrast with RAG-based approaches:** Even with temporal markers on text chunks, RAG-based retrieval relies on probabilistic chance to surface the correct article text. The SAT-Graph API shifts this luck to a single point—identifying the right Item component—while the rest of the retrieval becomes fully deterministic.

---

*This use case is based on the research paper's real-world legal analysis scenarios.*
