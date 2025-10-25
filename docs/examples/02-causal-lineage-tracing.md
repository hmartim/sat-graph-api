# Use Case 2: Causal Lineage Tracing for Legal Audit

> **Based on:** Research Paper Section 5.4.2

## User Query

_"A legal case from 2022 references Article 6, paragraph 1 of the Brazilian Constitution. Which specific legal norm introduced this paragraph, and is its text still the same today?"_

## The Challenge

This query has two distinct requirements that are **impossible for standard RAG systems**:

1. ❌ **Historical Provenance:** Determining which specific legal norm introduced a provision
2. ❌ **Current Validity:** Confirming with precision that a retrieved text is the most current, valid version

A standard RAG system lacks:
- A causal model to trace origins
- Temporal guarantees for version validity
- Ability to prove text unchanged over time

## Agent Execution Plan

The agent recognizes **two parallelizable sub-tasks** that can be executed concurrently after an initial common grounding step.

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Initial Step: Ground the Reference

Both tasks require the canonical identifier for the target item.

```bash
curl -G "$BASE_URL/resolve-item-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "reference_text=Article 6, paragraph 1 of the Brazilian Constitution"
```

**Response:**
```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_par1",
    "label": "Article 6, paragraph 1",
    "type_id": "item-type:paragraph",
    "confidence": 0.97
  }
]
```

**Agent Logic:**
```python
candidates = resolve_item_reference(
    reference_text="Article 6, paragraph 1 of the Brazilian Constitution"
)
target_item_id = candidates[0].id
# target_item_id = "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_par1"
```

---

## Parallel Execution: Task A + Task B

> **Key Design Pattern:** These two tasks are **independent** and can execute in parallel for maximum efficiency.

---

## Task A: Determine Provenance

**Goal:** Find which specific law introduced this paragraph.

### Step A1: Retrieve the Past Version

Get the specific Version that was valid in 2022.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_par1/valid-version?timestamp=2022-01-01T12:00:00Z&policy=PointInTime"
```

**Response:**
```json
{
  "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1",
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_par1",
  "validity_interval": [
    "2021-12-16T00:00:00Z",
    null
  ]
}
```

**Agent Logic:**
```python
version_2022 = get_valid_version(
    item_id=target_item_id,
    timestamp="2022-01-01T12:00:00Z",
    policy="PointInTime"
)
# version_2022.id = "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1"
```

### Step A2: Trace Causality to the Source

Trace this version back to the Action that created it.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1/causality"
```

**Response:**
```json
{
  "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1",
  "creating_action": {
    "id": "action_amendment_2021_...",
    "type": "Insertion",
    "date": "2021-12-16T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2021-12-16;114@2021-12-16!art1_cpt_alt...",
    "terminates_version_id": null,
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1"
  },
  "terminating_action": null
}
```

**Agent Logic:**
```python
causality = trace_causality(version_id=version_2022.id)
creating_action = causality.creating_action
source_law_id = creating_action.source_version_id
# source_id = "urn:lex:br:federal:emenda.constitucional:2021-12-16;114@2021-12-16!art1_cpt_alt..."
```

### Step A3: Hydrate the Source for Readability

To provide a human-readable answer, hydrate the source ID to get its full label.

```bash
# First, get the Version object
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:emenda.constitucional:2021-12-16;114@2021-12-16!art1_cpt_alt..."
```

**Response:**
```json
{
  "id": "urn:lex:br:federal:emenda.constitucional:2021-12-16;114@2021-12-16!art1_cpt_alt...",
  "item_id": "urn:lex:br:federal:emenda.constitucional:2021-12-16;114!art1_cpt_alt...",
  "validity_interval": ["2021-12-16T00:00:00Z", null]
}
```

```bash
# Then, get the Item to access its label
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:emenda.constitucional:2021-12-16;114!art1_cpt_alt..."
```

**Response:**
```json
{
  "id": "urn:lex:br:federal:emenda.constitucional:2021-12-16;114!art1_cpt_alt...",
  "type_id": "item-type:caput",
  "label": "..."
}
```

**Agent Logic:**
```python
# Hydrate source law for human-readable label
source_version = get_version(version_id=source_law_id)
source_item = get_item(item_id=source_version.item_id)
amending_law_name = source_item.label
```

---

## Task B: Determine Current State

**Goal:** Check if the text is still the same today.

### Step B1: Retrieve the Current Version

Get the version valid as of "now" (current UTC timestamp).

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_par1/valid-version?timestamp=2025-10-06T10:30:00Z&policy=PointInTime"
  # considering as today
```

**Response:**
```json
{
  "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1",
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_par1",
  "validity_interval": [
    "2021-12-16T00:00:00Z",
    null
  ],
}
```

**Agent Logic:**
```python
version_current = get_valid_version(
    item_id=target_item_id,
    timestamp="2025-10-06T10:30:00Z",
    policy="PointInTime"
)
# version_current.id = "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1"
```

### Step B2: Compare Historical and Current Versions

Check if the text has changed by comparing the two versions.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/compare?version_id_a=urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1&version_id_b=urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1"
```

**Response:**
```json
{
  "version_a": {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1",
    "validity_interval": ["2021-12-16T00:00:00Z", null]
  },
  "version_b": {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1",
    "validity_interval": ["2021-12-16T00:00:00Z", null]
  },
  "changes": [],
  "summary": "No changes - versions are identical"
}
```

**Agent Logic:**
```python
diff_report = compare_versions(
    version_id_a=version_2022.id,
    version_id_b=version_current.id
)

text_unchanged = (len(diff_report.changes) == 0)
# text_unchanged = True
```

---

## Synthesized Outcome

The agent's planner now combines the results from both parallel tasks.

### Data Available for Synthesis

```python
synthesis_data = {
    "task_a": {
        "amending_law": amending_law_name,
        "effective_date": creating_action.date,
        "action_type": creating_action.type
    },
    "task_b": {
        "text_unchanged": text_unchanged,
        "version_2022_id": version_2022.id,
        "version_current_id": version_current.id
    }
}
```

### Optional: Get the Text for Complete Answer

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1/text-unit?language=pt-br"
```

**Response:**
```json
{
  "id": "text_unit_...",
  "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1",
  "language": "pt-br",
  "aspect": "canonical",
  "content": "[ Art. 6º ] Parágrafo único. Todo brasileiro em situação de vulnerabilidade social terá direito a uma renda básica familiar, garantida pelo poder público em programa permanente de transferência de renda, cujas normas e requisitos de acesso serão determinados em lei, observada a legislação fiscal e orçamentária."
}
```

### Generated Response

> "The version of **Article 6, paragraph 1** of the Constitution, valid in 2022, was introduced by **Constitutional Amendment No. 114/2021**, effective on **Dec 16, 2021**.
>
> A comparison with the current version shows that **the text has not changed** since its creation. Both the 2022 version and today's version are identical (ID: `urn:lex:br:federal:constituicao:1988-10-05;1988@2021-12-16!art6_par1`).
>
> The text reads: _'[ Art. 6º ] Parágrafo único. Todo brasileiro em situação de vulnerabilidade social terá direito a uma renda básica familiar, garantida pelo poder público em programa permanente de transferência de renda, cujas normas e requisitos de acesso serão determinados em lei, observada a legislação fiscal e orçamentária.'_
>
> This answer is **precise, verifiable, and causally grounded**—demonstrating how the API enables complete legal audit trails."

---

## Key Takeaways

✅ **Parallel Execution:** Tasks A and B are independent and can run concurrently (DAG pattern)

✅ **Causal Tracing:** `traceCausality()` enables deterministic provenance tracking

✅ **Temporal Guarantees:** `getValidVersion()` ensures exact historical accuracy

✅ **Verifiable Comparison:** ID-based comparison proves text unchanged over time

✅ **Complete Audit Trail:** Every claim backed by canonical IDs and structured data

### Capabilities Impossible for Standard RAG Systems

| Capability | Standard RAG | SAT-Graph API |
|------------|--------------|---------------|
| **Determine which law introduced a provision** | ❌ No causal model | ✅ traceCausality() |
| **Guarantee historical version accuracy** | ❌ Probabilistic retrieval | ✅ Deterministic getValidVersion() |
| **Prove text unchanged over time** | ❌ Cannot verify | ✅ compareVersions() with IDs |
| **Parallel task execution** | ❌ Sequential only | ✅ DAG-based planning |

---

## Execution Pattern Summary

```
Initial Grounding (Sequential):
└── resolveItemReference()

Parallel Execution (Task A ‖ Task B):
├── Task A: Provenance
│   ├── getValidVersion(2022)
│   ├── traceCausality()
│   └── getItem() [hydration]
│
└── Task B: Current State
    ├── getValidVersion(now)
    └── compareVersions()

Synthesis (Sequential):
└── Combine results + generate answer
```

---

*This use case demonstrates the power of parallel task execution and causal tracing for legal audit workflows.*
