# Use Case 1: Point-in-Time Comparison and Causal Pinpointing

> **Based on:** Research Paper Section 5.4.1

## User Query

_"What were the exact textual differences in Article 6 of the Brazilian Constitution **before and after** the amendment that introduced the right to 'housing' (direito à moradia)?"_

## The Challenge

A standard RAG system would likely:
- ❌ Retrieve multiple, conflicting versions of Article 6 from its index
- ❌ Unable to deterministically isolate versions immediately preceding/succeeding a specific conceptual change
- ❌ Lacks causal understanding to link the introduction of a word to a specific legislative event

## Agent Execution Plan

The agent's strategy is to **find the specific Action** that introduced the change, which inherently contains the identifiers for the "before" and "after" states.

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

### Step 1: Identify the Item

Ground the query by resolving the textual reference to its canonical identifier.

```bash
curl -G "$BASE_URL/resolve-item-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "reference_text=Article 6 of the Constitution"
```

**Response:**
```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art6",
    "label": "Article 6",
    "type_id": "item-type:article",
    "confidence": 0.98
  }
]
```

**Agent Logic:**
```python
candidates = resolve_item_reference(reference_text="Article 6 of the Constitution")
target_item_id = candidates[0].id  # Agent proceeds with top candidate
# target_item_id = "urn:lex:br:federal:constituicao:1988-10-05;art6"
```

---

### Step 2: Retrieve the Full Historical Lineage

Fetch the complete, time-ordered history of all legislative events that affected the item.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;art6/history"
```

**Response:**
```json
{
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;art6",
  "total_actions": 3,
  "actions": [
    {
      "id": "action_creation_1988",
      "type": "Creation",
      "date": "1988-10-05T00:00:00Z",
      "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@1988-10-05",
      "terminates_version_id": null,
      "source_version_id": "urn:lex:br:federal:constituicao:1988-10-05"
    },
    {
      "id": "action_amendment_2000",
      "type": "Amendment",
      "date": "2000-02-14T00:00:00Z",
      "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@2000-02-14",
      "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@1988-10-05",
      "source_version_id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26"
    },
    {
      "id": "action_amendment_2010",
      "type": "Amendment",
      "date": "2010-09-16T00:00:00Z",
      "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@2010-09-16",
      "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@2000-02-14",
      "source_version_id": "urn:lex:br:federal:emenda.constitucional:2010-09-16;64"
    }
  ]
}
```

**Agent Logic:**
```python
history = get_item_history(item_id=target_item_id)  # Returns list[Action]
# history.actions contains all legislative events in chronological order
```

---

### Step 3: Pinpoint the Pivotal Action

The agent must find the **first Action** in the history whose resulting text contains the keyword "moradia".

To do this efficiently:
1. Collect all `produces_version_id`s from the history
2. Make a single `getBatchTexts` call to retrieve all texts at once
3. Iterate through texts to identify the pivotal Action

```bash
# Batch retrieve all version texts
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;art6@1988-10-05",
      "urn:lex:br:federal:constituicao:1988-10-05;art6@2000-02-14",
      "urn:lex:br:federal:constituicao:1988-10-05;art6@2010-09-16"
    ],
    "language": "pt-br"
  }'
```

**Response:**
```json
[
  {
    "id": "text_1988",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@1988-10-05",
    "language": "pt-br",
    "content": "São direitos sociais a educação, a saúde, o trabalho, o lazer, a segurança, a previdência social..."
  },
  {
    "id": "text_2000",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@2000-02-14",
    "language": "pt-br",
    "content": "São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança..."
  },
  {
    "id": "text_2010",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;art6@2010-09-16",
    "language": "pt-br",
    "content": "São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia..."
  }
]
```

**Agent Logic:**
```python
# Collect all version IDs produced by actions
version_ids = [action.produces_version_id for action in history.actions]

# Batch retrieve all texts
texts = get_batch_text_units(
    version_ids=version_ids,
    language="pt-br"
)

# Find the first text containing "moradia"
pivotal_action = None
for i, text in enumerate(texts):
    if "moradia" in text.content.lower():
        pivotal_action = history.actions[i]
        break

# pivotal_action = action_amendment_2000
```

---

### Step 4: Compare "Before" and "After" States

The pivotal Action object contains direct references to the state it terminated and the state it created.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/compare?version_id_a=urn:lex:br:federal:constituicao:1988-10-05;art6@1988-10-05&version_id_b=urn:lex:br:federal:constituicao:1988-10-05;art6@2000-02-14"
```

**Response:**
```json
{
  "version_a": {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art6@1988-10-05",
    "validity_interval": ["1988-10-05T00:00:00Z", "2000-02-14T00:00:00Z"]
  },
  "version_b": {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;art6@2000-02-14",
    "validity_interval": ["2000-02-14T00:00:00Z", "2010-09-16T00:00:00Z"]
  },
  "changes": [
    {
      "type": "insertion",
      "position": 52,
      "text": "a moradia, ",
      "context_before": "...o trabalho, ",
      "context_after": "o lazer..."
    }
  ],
  "summary": "1 insertion, 0 deletions, 0 modifications"
}
```

**Agent Logic:**
```python
version_id_before = pivotal_action.terminates_version_id
version_id_after = pivotal_action.produces_version_id

diff_report = compare_versions(
    version_id_a=version_id_before,
    version_id_b=version_id_after
)
```

---

## Synthesized Outcome

The agent now has **complete, verifiable data** to pass to an LLM for synthesis:

```python
synthesis_data = {
    "pivotal_action": {
        "date": pivotal_action.date,
        "source_law": pivotal_action.source_version_id,
        "type": pivotal_action.type
    },
    "version_before": {
        "id": version_id_before,
        "validity_period": "1988-10-05 to 2000-02-14"
    },
    "version_after": {
        "id": version_id_after,
        "validity_period": "2000-02-14 to 2010-09-16"
    },
    "diff_report": diff_report
}

# LLM receives this structured, auditable data
```

### Generated Response

> "The right to 'housing' (moradia) was introduced into Article 6 by **Constitutional Amendment No. 26/2000**, effective on **February 14, 2000**, which terminated the validity of version `urn:lex:br:federal:constituicao:1988-10-05;art6@1988-10-05` and created version `urn:lex:br:federal:constituicao:1988-10-05;art6@2000-02-14`.
>
> **Exact Change:** The word 'moradia' (housing) was inserted after 'o trabalho,' (work) in the list of social rights.
>
> **Before:** _"São direitos sociais a educação, a saúde, o trabalho, o lazer, a segurança..."_
>
> **After:** _"São direitos sociais a educação, a saúde, o trabalho, **a moradia**, o lazer, a segurança..."_
>
> This answer is precise, verifiable, and causally grounded—a capability far beyond standard RAG systems."

---

## Key Takeaways

✅ **Causal Precision:** The API enables pinpointing the exact legislative event
✅ **Temporal Accuracy:** Deterministic before/after state identification
✅ **Verifiability:** Every claim is backed by canonical IDs and structured data
✅ **Efficiency:** Batch operations prevent N+1 query problems

This workflow demonstrates capabilities **impossible for standard RAG systems**:
- Causal understanding (linking word introduction to specific amendment)
- Deterministic versioning (exact before/after states)
- Auditable trail (every step traceable via IDs)

---

## Next Steps

- **[Causal Lineage Tracing](02-causal-lineage-tracing.md)** - Trace legal provenance with parallel tasks
- **[Hierarchical Impact Summarization](03-hierarchical-impact-summarization.md)** - Analyze hierarchical legislative changes
- **[Structural vs. Normative Predecessors](04-structural-normative-predecessors.md)** - Dual-path disambiguation
- **[Back to Fundamental Patterns](00-fundamental-patterns.md)** - Review atomic building blocks

---

*This use case is based on the research paper's real-world legal analysis scenarios.*
