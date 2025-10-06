# Use Case 4: Distinguishing Structural and Normative Predecessors

> **Based on:** Research Paper Section 5.4.4

## User Query

_"What was the previous rule that governed this matter?"_

## The Challenge

This **seemingly simple question** hides a deep legal ambiguity. "Previous rule" can have **two distinct meanings**:

1. **Structural Predecessor:** The immediately preceding version of the same article (diachronic lineage within the same legal provision)

2. **Normative Predecessor:** An entirely different article, possibly in another law, that was revoked and replaced by the current provision (semantic succession across different legal texts)

**Standard systems can handle neither:**
- ❌ Lack versioning for structural predecessors
- ❌ Lack semantic understanding for normative predecessors
- ❌ Cannot disambiguate between the two interpretations

## Agent Execution Plan

Our API empowers an agent to **disambiguate and solve for both interpretations** using two distinct execution paths:

- **Path 1 (Structural):** Deterministic, optimized
- **Path 2 (Normative):** Heuristic, discovery-oriented

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Initial Context: Establish Target Item

For this example, assume the user is asking about **Article 10** and we've already established the context.

```python
# Assume we've established context through prior conversation
target_item_id = "urn:lex:br:federal:lei:2020-01-15;1234;art10"
```

---

## Path 1: Structural Predecessor (Deterministic)

**Goal:** Find the direct causal antecedent of the current version by tracing the event that created it.

### Step 1.1: Retrieve the Current Version

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:lei:2020-01-15;1234;art10/valid-version?timestamp=2025-10-06T10:30:00Z&policy=SnapshotLast"
```

**Response:**
```json
{
  "id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2023-03-20",
  "item_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10",
  "validity_interval": [
    "2023-03-20T00:00:00Z",
    null
  ],
  "parent": "urn:lex:br:federal:lei:2020-01-15;1234",
  "children": []
}
```

**Agent Logic:**
```python
current_version = get_valid_version(
    item_id=target_item_id,
    timestamp="2025-10-06T10:30:00Z",
    policy="SnapshotLast"
)
# current_version.id = "urn:lex:br:federal:lei:2020-01-15;1234;art10@2023-03-20"
```

### Step 1.2: Trace Causality to Find the Creating Action

Use `traceCausality` to find the Action that created this version.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:lei:2020-01-15;1234;art10@2023-03-20/causality"
```

**Response:**
```json
{
  "version_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2023-03-20",
  "creating_action": {
    "id": "action_amendment_2023",
    "type": "Amendment",
    "date": "2023-03-20T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:lei:2023-03-20;7890",
    "produces_version_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2023-03-20",
    "terminates_version_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2020-01-15"
  },
  "terminating_action": null
}
```

**Agent Logic:**
```python
causality = trace_causality(version_id=current_version.id)
creating_action = causality.creating_action

# The structural predecessor is the version that this action terminated
predecessor_version_id = creating_action.terminates_version_id
# predecessor_version_id = "urn:lex:br:federal:lei:2020-01-15;1234;art10@2020-01-15"
```

**This is it!** The structural predecessor is deterministically identified through the causal graph.

### Step 1.3: Get the Predecessor's Text

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:lei:2020-01-15;1234;art10@2020-01-15/text-unit?language=pt-br"
```

**Response:**
```json
{
  "id": "text_unit_predecessor",
  "version_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2020-01-15",
  "language": "pt-br",
  "aspect": "canonical",
  "content": "Public servants shall disclose financial assets within 30 days of appointment."
}
```

**Agent Logic:**
```python
predecessor_text = get_text_for_version(
    version_id=predecessor_version_id,
    language="pt-br"
)
```

### Path 1 Result

✅ **Deterministic:** 3 API calls, guaranteed result

✅ **Efficient:** Leverages explicit causal graph structure

✅ **Auditable:** Complete version chain with IDs and causal actions

---

## Path 2: Normative Predecessor (Heuristic)

**Goal:** Find a semantically similar but structurally distinct predecessor using temporal semantic search.

### Step 2.1: Gather Context Information

Get the current version's text and the date it became valid.

```bash
# Already have current_version from Path 1
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:lei:2020-01-15;1234;art10@2023-03-20/text-unit?language=pt-br"
```

**Response:**
```json
{
  "id": "text_unit_current",
  "version_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2023-03-20",
  "language": "pt-br",
  "aspect": "canonical",
  "content": "Public servants and their spouses shall disclose financial assets within 60 days of appointment, including holdings in trusts and offshore entities."
}
```

**Agent Logic:**
```python
# Get the start date of current version's validity
change_date = current_version.validity_interval[0]
# change_date = "2023-03-20T00:00:00Z"

# Get the text
current_text = get_text_for_version(
    version_id=current_version.id,
    language="pt-br"
).content
```

### Step 2.2: Search for Semantically Similar Texts Before the Change

Search for texts that were valid **immediately before** the change date.

**Agent Logic:**
```python
from datetime import datetime, timedelta

# Calculate timestamp immediately prior to change_date
change_datetime = datetime.fromisoformat(change_date.replace('Z', '+00:00'))
prior_datetime = change_datetime - timedelta(seconds=1)
previous_timestamp = prior_datetime.isoformat().replace('+00:00', 'Z')
# previous_timestamp = "2023-03-19T23:59:59Z"
```

```bash
curl -X POST "$BASE_URL/search-text-units" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "semantic_query": "Public servants and their spouses shall disclose financial assets within 60 days of appointment, including holdings in trusts and offshore entities.",
    "timestamp": "2023-03-19T23:59:59Z",
    "language": "pt-br",
    "top_k": 5
  }'
```

**Response:**
```json
[
  {
    "text_unit": {
      "id": "text_unit_old_art10",
      "version_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2020-01-15",
      "language": "pt-br",
      "aspect": "canonical",
      "content": "Public servants shall disclose financial assets within 30 days of appointment."
    },
    "score": 0.89
  },
  {
    "text_unit": {
      "id": "text_unit_revoked_art150",
      "version_id": "urn:lex:br:federal:lei:1995-06-20;5555;art150@1995-06-20",
      "language": "pt-br",
      "aspect": "canonical",
      "content": "Officials in positions of public trust must declare all financial interests within two months of taking office."
    },
    "score": 0.85
  },
  {
    "text_unit": {
      "id": "text_unit_unrelated",
      "version_id": "urn:lex:br:federal:lei:2018-05-10;9999;art25@2018-05-10",
      "language": "pt-br",
      "aspect": "canonical",
      "content": "Financial disclosure requirements apply to contractors as specified in regulations."
    },
    "score": 0.72
  }
]
```

**Agent Logic:**
```python
# Search for semantically similar texts valid before change_date
candidates = search_text_units(
    semantic_query=current_text,
    timestamp="2023-03-19T23:59:59Z",  # One second before change
    language="pt-br",
    top_k=5
)
```

### Step 2.3: Filter and Identify Normative Predecessor

Analyze candidates and filter out the structural predecessor.

```python
# Filter out structural predecessor (it might appear in results)
normative_candidates = [
    c for c in candidates
    if c.text_unit.version_id != predecessor_version_id
]

# Top candidate is likely normative predecessor
normative_predecessor = normative_candidates[0]
# normative_predecessor.version_id = "urn:lex:br:federal:lei:1995-06-20;5555;art150@1995-06-20"
```

### Step 2.4: Verify the Normative Predecessor was Revoked

Check if this article was indeed revoked around the time the new provision was created.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:lei:1995-06-20;5555;art150@1995-06-20/causality"
```

**Response:**
```json
{
  "version_id": "urn:lex:br:federal:lei:1995-06-20;5555;art150@1995-06-20",
  "creating_action": {
    "id": "action_creation_1995",
    "type": "Creation",
    "date": "1995-06-20T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:lei:1995-06-20;5555",
    "produces_version_id": "urn:lex:br:federal:lei:1995-06-20;5555;art150@1995-06-20",
    "terminates_version_id": null
  },
  "terminating_action": {
    "id": "action_revocation_2023",
    "type": "Revocation",
    "date": "2023-03-20T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:lei:2023-03-20;7890",
    "produces_version_id": null,
    "terminates_version_id": "urn:lex:br:federal:lei:1995-06-20;5555;art150@1995-06-20"
  }
}
```

**Agent Logic:**
```python
causality = trace_causality(version_id=normative_predecessor.text_unit.version_id)

# Verify terminating action exists and date matches
if causality.terminating_action and causality.terminating_action.date == change_date:
    # This is likely the normative predecessor!
    normative_confirmed = True
```

### Path 2 Result

✅ **Heuristic but Grounded:** Uses semantic search but verifies with temporal snapshots

✅ **Discovery-Oriented:** Finds semantically related provisions across different laws

✅ **Verifiable:** Confirmation through causality tracing

---

## Synthesized Outcome

The agent now has **complete information** from both paths and can provide a sophisticated, multi-faceted answer.

### Data Available for Synthesis

```python
synthesis_data = {
    "structural_predecessor": {
        "version_id": "urn:lex:br:federal:lei:2020-01-15;1234;art10@2020-01-15",
        "text": "Public servants shall disclose financial assets within 30 days...",
        "method": "Deterministic (traceCausality → terminates_version_id)"
    },
    "normative_predecessor": {
        "version_id": "urn:lex:br:federal:lei:1995-06-20;5555;art150@1995-06-20",
        "article": "Article 150 of Law 5555/1995",
        "text": "Officials in positions of public trust must declare all financial interests...",
        "revoked_date": "2023-03-20",
        "method": "Heuristic (semantic search + causality verification)"
    }
}
```

### Generated Response

> "The query **'previous rule'** can have two meanings:
>
> ### 1. Structural Predecessor (Direct Previous Version)
>
> The direct previous version of **Article 10** (its _structural predecessor_) had the following text:
>
> _"Public servants shall disclose financial assets within 30 days of appointment."_
>
> This version was valid from **January 15, 2020** until **March 20, 2023**, when it was amended.
>
> ### 2. Normative Predecessor (Semantically Related Provision)
>
> However, the new version created on **March 20, 2023** appears to have replaced a different, semantically related provision. The most likely _normative predecessor_ is:
>
> **Article 150 of Law No. 5555/1995**, which stated:
>
> _"Officials in positions of public trust must declare all financial interests within two months of taking office."_
>
> This article was **revoked on March 20, 2023** (the same date the new version of Article 10 became effective), suggesting it was replaced by the new provision.
>
> ### Summary
>
> - **Structural:** Article 10's previous version (same article, earlier text)
> - **Normative:** Article 150 of Law 5555/1995 (different article, replaced provision)
>
> Would you like to see more details about either predecessor?"

---

## Key Takeaways

✅ **Dual-Path Strategy:** Deterministic for structural, heuristic for normative

✅ **Disambiguation:** Agent can solve for both interpretations of ambiguous query

✅ **Verification:** Even heuristic path is grounded in verifiable temporal snapshots

✅ **Nuanced Legal Reasoning:** Supports sophisticated analysis beyond simple retrieval

### Strategic Comparison

| Aspect | Structural Path | Normative Path |
|--------|----------------|----------------|
| **Method** | Deterministic | Heuristic |
| **Data Source** | `traceCausality` + `terminates_version_id` | Semantic search + causality |
| **Efficiency** | 3 API calls | 4-5 API calls |
| **Certainty** | Guaranteed | Probabilistic (requires verification) |
| **Scope** | Same article only | Cross-document |

---

## Capabilities Impossible for Standard Systems

| Capability | Standard RAG | SAT-Graph API |
|------------|--------------|---------------|
| **Find structural predecessor** | ❌ No versioning | ✅ traceCausality() + terminates_version_id |
| **Find normative predecessor** | ❌ No semantic+temporal search | ✅ searchTextUnits(timestamp) |
| **Verify revocation timing** | ❌ No causal model | ✅ traceCausality() |
| **Disambiguate query intent** | ❌ Single interpretation | ✅ Dual-path execution |

---

## Execution Pattern Summary

```
Dual-Path Execution:

Path 1: Structural Predecessor (Deterministic)
├── getValidVersion(current)
├── traceCausality(current version)
├── Extract terminates_version_id from creating_action
└── getTextForVersion(predecessor) → Done in 3 calls

Path 2: Normative Predecessor (Heuristic)
├── getValidVersion(current)
├── getTextForVersion(current)
├── Calculate prior timestamp
├── searchTextUnits(semantic + temporal)
├── Filter candidates (exclude structural predecessor)
└── traceCausality(verify revocation) → Done in 4-5 calls

Synthesis:
└── Combine both results and present disambiguation
```

---

## Next Steps

- **[Point-in-Time Comparison](01-point-in-time-comparison.md)** - Causal pinpointing workflow
- **[Causal Lineage Tracing](02-causal-lineage-tracing.md)** - Parallel task execution
- **[Hierarchical Impact Summarization](03-hierarchical-impact-summarization.md)** - Server-side aggregation
- **[Back to Fundamental Patterns](00-fundamental-patterns.md)** - Review atomic building blocks

---

*This use case demonstrates the API's ability to support nuanced legal reasoning through dual-path execution strategies.*
