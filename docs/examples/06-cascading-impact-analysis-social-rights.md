# Use Case 6: Cascading Impact Analysis - Temporal Evolution of Social Rights Protection

> **Based on:** Research Paper Section 5.4 - Causal Analysis and Impact Tracing

## User Query

_"Which legislative amendments — with their formal justifications — had direct or indirect impact on the scope of the social right 'protection to motherhood and childhood'? Generate: (a) the set of normative commands concatenated that produced this impact; (b) the versions of the provisions involved; (c) a causal chain (DAG) explaining how amendment A ↦ B ↦ C alters the applicable text/content for this social right."_

## The Challenge

This complex query requires understanding the **cascading causal chain** of legislative amendments affecting a single social right across time:

1. ❌ **Semantic Discovery:** Find the social right without knowing which document or article contains it
2. ❌ **Temporal Scope Variance:** Understand how the legal scope changed at different points in time
3. ❌ **Cascading Amendment Chains:** Trace A → B → C → ... changes with formal justifications
4. ❌ **Version Reconstruction:** Retrieve exact text for all versions involved
5. ❌ **Causal DAG Synthesis:** Build a complete chain showing provenance of each change

A standard RAG system would:
- ❌ Struggle to semantically locate the social right without prior knowledge
- ❌ Cannot answer "at point T in time, what was the scope?" questions reliably
- ❌ Lack structured causal relationships between amendments
- ❌ Cannot explain _why_ a provision changed (formal justifications are not indexed)
- ❌ Impossible to verify the complete chain of amendments

## Agent Execution Plan

The agent decomposes this into **5 sequential phases** that progressively narrow scope and reconstruct the causal chain:

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Phase 1: Semantic Discovery of Social Right

**Goal:** Without assuming prior knowledge, locate "proteção à maternidade e à infância" in the knowledge graph.

### Step 1a: Search for the Social Right Across All Documents

Perform a global semantic and lexical search for this social right.

```bash
curl -X POST "$BASE_URL/search-text-units" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content_query": {
      "strategy": "hybrid",
      "semantic": {
        "query_text": "protection to motherhood and childhood, maternal rights, infant protection",
        "weight": 0.6
      },
      "lexical": {
        "query_text": "proteção à maternidade e à infância",
        "weight": 0.4
      }
    },
    "language": "pt-br",
    "top_k": 15
  }'
```

**Response:**

```json
[
  {
    "text_unit": {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05~text;pt-br!art6_cpt",
      "source_type": "Version",
      "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt",
      "language": "pt-br",
      "aspect": "canonical",
      "content": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados."
    },
    "score": 0.99
  },
  {
    "text_unit": {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14~text;pt-br!art6_cpt",
      "source_type": "Version",
      "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
      "language": "pt-br",
      "aspect": "canonical",
      "content": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição."
    },
    "score": 0.99
  },
  {
    "text_unit": {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05~text;pt-br!art227_cpt",
      "source_type": "Version",
      "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art227_cpt",
      "language": "pt-br",
      "aspect": "canonical",
      "content": "Art. 227º É dever da família, da sociedade e do Estado assegurar à criança, ao adolescente e ao jovem, com absoluta prioridade, o direito à vida, à saúde, à alimentação, à educação, ao lazer, à profissionalização, à cultura, à dignidade, ao respeito, à liberdade e à convivência familiar e comunitária."
    },
    "score": 0.87
  }
]
```

**Agent Logic:**

```python
# Hybrid search found the primary provision
search_results = search_text_units(
    content_query={
        "strategy": "hybrid",
        "semantic": {
            "query_text": "protection to motherhood and childhood, maternal rights, infant protection",
            "weight": 0.6
        },
        "lexical": {
            "query_text": "proteção à maternidade e à infância",
            "weight": 0.4
        }
    },
    language="pt-br",
    top_k=15
)

# The agent identifies the primary item from the highest-scoring result
# Each result contains a text_unit with source_id (version ID) and source_type
primary_text_unit = search_results[0].text_unit
primary_version_id = search_results[0].text_unit.source_id
# primary_version_id = "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt"

# Extract the Item ID from the Version ID (last component is the item identifier)
# From the response, we also note a related provision (Article 227 for comprehensive scope)
related_text_unit = search_results[2].text_unit
# related_version_id = "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art227_cpt"
```

### Step 1b: Get Structural Context

Understand the hierarchical position of this social right.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt/context"
```

**Response:**

```json
{
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
  "parent": {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!tit2_cap2",
    "label": "Chapter II - Social Rights",
    "type_id": "item-type:chapter"
  },
  "siblings": [
    {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art5",
      "label": "Article 5 - Individual Rights"
    },
    {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art7",
      "label": "Article 7 - Workers' Rights"
    }
  ],
  "children": []
}
```

**Agent Logic:**

```python
context = get_item_context(item_id=primary_item_id)
# Now the agent knows: Article 6 is a **Social Right** in Chapter II
# This is important because social rights amendments follow specific constitutional procedures
```

---

## Phase 2: Temporal Coverage and Version History

**Goal:** Map the complete temporal landscape of versions for this social right.

### Step 2a: Get Temporal Coverage

Understand the entire time span for which this provision has existed and been modified.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt/temporal-coverage"
```

**Response:**

```json
[
  "1988-10-05T00:00:00Z",
  null
]
```

This returns a `TimeInterval` (array with 2 elements: start and end). The `null` end time indicates the provision is still valid.

**Agent Logic:**

```python
temporal_coverage = get_temporal_coverage(item_id=primary_item_id)
# temporal_coverage is a TimeInterval: [start_date, end_date or null]
# This tells the agent the known temporal boundaries
start_date = temporal_coverage[0]  # "1988-10-05T00:00:00Z"
end_date = temporal_coverage[1]    # null (still active)
```

### Step 2b: Retrieve All Versions in History

Get all versions to understand the complete evolution. Use query parameters to specify the time interval.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt/versions?start_time=1988-10-05T00:00:00Z&end_time=2025-10-26T00:00:00Z"
  # the end_time is today 
```

**Response:**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt",
    "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
    "validity_interval": ["1988-10-05T00:00:00Z", "2000-02-14T00:00:00Z"]
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
    "validity_interval": ["2000-02-14T00:00:00Z", "2010-02-04T00:00:00Z"]
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
    "validity_interval": ["2010-02-04T00:00:00Z", "2015-09-15T00:00:00Z"]
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt",
    "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
    "validity_interval": ["2015-09-15T00:00:00Z", null]
  }
]
```

**Agent Logic:**

```python
all_versions = get_versions_in_interval(
    item_id=primary_item_id,
    start_time="1988-10-05T00:00:00Z",
    end_time="2025-10-26T00:00:00Z"
)

# Response is a list of Version objects directly (not wrapped in an object)
version_ids = [v.id for v in all_versions]
# Now we have 4 version IDs to trace causality
```

---

## Phase 3: Causal Tracing - Amendment Chain

**Goal:** For each version, trace the Action (amendment) that created it, building a causal chain.

### Step 3a: Trace Causality for Amendment-Generated Versions

Using the version IDs from Step 2b, trace the causality (Actions) for each version **except the original 1988 version** (which was created by constitutional promulgation, not an amendment). These calls can be made in parallel for efficiency.

```bash
# For version 2 (created by EC 26/2000)
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt/causality"

# For version 3 (created by EC 59/2009)
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt/causality"

# For version 4 (created by EC 65/2010 or later amendment)
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt/causality"
```

> **Note:** These calls are independent and can be parallelized. They return `CausalityTrace` objects showing both the creating action (the amendment that produced this version) and the terminating action (the next amendment that superseded this version, if any).

**Response (Version 2 - After EC 26/2000):**

```json
{
  "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
  "creating_action": {
    "id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26@2000-02-14!art1_cpt_alt1_art6",
    "type": "Amendment",
    "date": "2000-02-14T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26@2000-02-14!art1_cpt_alt1",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "metadata": {
      "event_description": "Constitutional Amendment No. 26/2000",
      "formal_justification": "Establishing the right to food as a social right, complementing protection to motherhood and childhood"
    }
  },
  "terminating_action": {
    "id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2_art6",
    "type": "Amendment",
    "date": "2010-02-04T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "metadata": {
      "event_description": "Constitutional Amendment No. 59/2009",
      "formal_justification": "Making education compulsory and progressive from age 4, strengthening child protection framework"
    }
  }
}
```

**Response (Version 3 - After EC 59/2009):**

```json
{
  "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
  "creating_action": {
    "id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2_art6",
    "type": "Amendment",
    "date": "2010-02-04T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "metadata": {
      "event_description": "Constitutional Amendment No. 59/2009",
      "formal_justification": "Making public education compulsory and progressive from age 4 to 17, directly expanding child protection mandates"
    }
  },
  "terminating_action": {
    "id": "urn:lex:br:federal:emenda.constitucional:2015-09-15;65@2015-09-15!art1_cpt_alt3_art6",
    "type": "Amendment",
    "date": "2015-09-15T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2015-09-15;65@2015-09-15!art1_cpt_alt3",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt",
    "metadata": {
      "event_description": "Constitutional Amendment No. 65/2010",
      "formal_justification": "Elevating youth as a distinct constitutional category with special protections"
    }
  }
}
```

**Response (Version 4 - After EC 65/2010):**

```json
{
  "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt",
  "creating_action": {
    "id": "urn:lex:br:federal:emenda.constitucional:2015-09-15;65@2015-09-15!art1_cpt_alt3_art6",
    "type": "Amendment",
    "date": "2015-09-15T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2015-09-15;65@2015-09-15!art1_cpt_alt3",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt",
    "metadata": {
      "event_description": "Constitutional Amendment No. 65/2010",
      "formal_justification": "Establishing youth (13-29 years) as a distinct constitutional category, extending temporal scope of childhood protection"
    }
  },
  "terminating_action": null
}
```

> This is the current version (still valid), indicated by `terminating_action: null`.

**Agent Logic:**

```python
# Trace causality for the 3 amendment-generated versions
causality_traces = {}
for version_id in [
    "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt"
]:
    causality = trace_causality(version_id=version_id)
    causality_traces[version_id] = causality

# Build the causal chain (only amendment-generated versions)
amendments_chain = []
for version_id in causality_traces:
    trace = causality_traces[version_id]
    amendments_chain.append({
        "version_id": version_id,
        "creating_action": trace.creating_action,
        "terminating_action": trace.terminating_action
    })
```

---

## Phase 4: Retrieve and Compare Textual Versions

**Goal:** Get the actual text for each version to show what changed.

### Step 4a: Batch Retrieve Text Units for All Versions

Retrieve the text for all 4 versions retrieved in Step 2b (the original plus the 3 amendment-generated versions). This will allow us to compare the exact textual changes.

```bash
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt"
    ],
    "language": "pt-br"
  }'
```

**Response:**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05~text;pt-br!art6_cpt",
    "source_type": "Version",
    "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt",
    "language": "pt-br",
    "aspect": "canonical",
    "content": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados."
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14~text;pt-br!art6_cpt",
    "source_type": "Version",
    "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "language": "pt-br",
    "aspect": "canonical",
    "content": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição."
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04~text;pt-br!art6_cpt",
    "source_type": "Version",
    "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "language": "pt-br",
    "aspect": "canonical",
    "content": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição. (Redação dada pela Emenda Constitucional nº 59, de 2009)"
  },
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15~text;pt-br!art6_cpt",
    "source_type": "Version",
    "source_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2015-09-15!art6_cpt",
    "language": "pt-br",
    "aspect": "canonical",
    "content": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição. (Redação dada pela Emenda Constitucional nº 59, de 2009; Emenda Constitucional nº 65, de 2010)"
  }
]
```

**Agent Logic:**

```python
text_units = get_batch_text_units(
    version_ids=version_ids,
    language="pt-br"
)

# Create a mapping using source_id (the version ID) for easy comparison
text_by_version = {tu.source_id: tu.content for tu in text_units}
```

### Step 4b: Compare Versions to Show Changes

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/compare?version_id_a=urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt&version_id_b=urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt"
```

**Response:**

```json
{
  "changes": [
    {
      "type": "addition",
      "level": "sentence",
      "component_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
      "content_before": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados.",
      "content_after": "Art. 6º São direitos sociais a educação, a saúde, o trabalho, a moradia, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição."
    }
  ]
}
```

---

## Phase 5: Retrieve Amendment History and Causal DAG Synthesis

**Goal:** Retrieve all amendments affecting this social right using query-actions, then synthesize into a DAG.

### Step 5a: Query All Actions Affecting This Item

Use `/query-actions` to get all actions that affected this specific item:

```bash
curl -X POST "$BASE_URL/query-actions" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt"
    ],
    "time_interval": ["1988-10-05T00:00:00Z", "2025-10-26T00:00:00Z"],
    "action_types": ["Amendment", "Creation"]
  }'
```

**Response:**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!creation_art6",
    "type": "Creation",
    "date": "1988-10-05T00:00:00Z",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt"
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26@2000-02-14!art1_cpt_alt1_art6",
    "type": "Amendment",
    "date": "2000-02-14T00:00:00Z",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt"
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2_art6",
    "type": "Amendment",
    "date": "2010-02-04T00:00:00Z",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt"
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2019-12-12;65@2019-12-12!art1_cpt_alt3_art6",
    "type": "Amendment",
    "date": "2019-12-12T00:00:00Z",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2019-12-12!art6_cpt"
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2022-03-10;108@2022-03-10!art1_cpt_alt4_art6",
    "type": "Amendment",
    "date": "2022-03-10T00:00:00Z",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2022-03-10!art6_cpt"
  }
]
```

### Step 5b: Fetch Detailed Action Metadata

For each action in the chain, get its full metadata including formal justifications:

```bash
curl -X POST "$BASE_URL/actions/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988!creation_art6",
      "urn:lex:br:federal:emenda.constitucional:2000-02-14;26@2000-02-14!art1_cpt_alt1_art6",
      "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2_art6",
      "urn:lex:br:federal:emenda.constitucional:2019-12-12;65@2019-12-12!art1_cpt_alt3_art6",
      "urn:lex:br:federal:emenda.constitucional:2022-03-10;108@2022-03-10!art1_cpt_alt4_art6"
    ]
  }'
```

**Response:**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!creation_art6",
    "type": "Creation",
    "date": "1988-10-05T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!constituicao_promulgada",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt",
    "metadata": {
      "event_type": "Constitutional Promulgation",
      "formal_justification": "Establishing the foundational social rights framework for the Brazilian democratic state, with special emphasis on vulnerable populations including mothers and children"
    }
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26@2000-02-14!art1_cpt_alt1_art6",
    "type": "Amendment",
    "date": "2000-02-14T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26@2000-02-14!art1_cpt_alt1",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "metadata": {
      "event_type": "Constitutional Amendment No. 26/2000",
      "formal_justification": "Elevating the right to food to constitutional status. This amendment recognizes food security as essential to maternal health and child development, directly impacting the scope of 'protection to motherhood and childhood'",
      "amending_instrument_id": "urn:lex:br:federal:emenda.constitucional:2000-02-14;26"
    }
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2_art6",
    "type": "Amendment",
    "date": "2010-02-04T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59@2010-02-04!art1_cpt_alt2",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "metadata": {
      "event_type": "Constitutional Amendment No. 59/2009",
      "formal_justification": "Making public education compulsory and progressive from age 4 to 17. This directly expands the scope of child protection by mandating educational access throughout childhood, strengthening the constitutional framework for protecting infants and children",
      "amending_instrument_id": "urn:lex:br:federal:emenda.constitucional:2010-02-04;59"
    }
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2019-12-12;65@2019-12-12!art1_cpt_alt3_art6",
    "type": "Amendment",
    "date": "2019-12-12T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2019-12-12;65@2019-12-12!art1_cpt_alt3",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2010-02-04!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2019-12-12!art6_cpt",
    "metadata": {
      "event_type": "Constitutional Amendment No. 65/2010",
      "formal_justification": "Establishing youth as a distinct constitutional category with specific rights. This indirectly expands the scope of 'protection to childhood' by recognizing the developmental period from childhood through youth and establishing special constitutional protections",
      "amending_instrument_id": "urn:lex:br:federal:emenda.constitucional:2019-12-12;65"
    }
  },
  {
    "id": "urn:lex:br:federal:emenda.constitucional:2022-03-10;108@2022-03-10!art1_cpt_alt4_art6",
    "type": "Amendment",
    "date": "2022-03-10T00:00:00Z",
    "source_version_id": "urn:lex:br:federal:emenda.constitucional:2022-03-10;108@2022-03-10!art1_cpt_alt4",
    "terminates_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2019-12-12!art6_cpt",
    "produces_version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2022-03-10!art6_cpt",
    "metadata": {
      "event_type": "Constitutional Amendment No. 108/2020",
      "formal_justification": "Establishing emergency assistance for vulnerable populations. This amendment creates direct social protection mechanisms for mothers and children during periods of crisis, operationalizing the constitutional mandate for 'protection to motherhood and childhood' through emergency welfare programs",
      "amending_instrument_id": "urn:lex:br:federal:emenda.constitucional:2022-03-10;108"
    }
  }
]
```

---

## Synthesis: Causal DAG and Final Answer

### (a) Normative Commands Concatenated

Based on the API responses, the agent synthesizes the complete set of normative commands that produced impact:

**Causal Chain of Normative Commands:**

```
[1988-10-05] Creation: Constitution of 1988, Article 6
             └─> Establishes "protection to motherhood and childhood" as a social right

[2000-02-14] Amendment EC 26/2000
             ├─ Source: urn:lex:br:federal:emenda.constitucional:2000-02-14;26
             ├─ Formal Justification: "Elevating the right to food to constitutional status"
             └─> IMPACT: Expands child protection scope by ensuring nutritional foundation

[2010-02-04] Amendment EC 59/2009
             ├─ Source: urn:lex:br:federal:emenda.constitucional:2010-02-04;59
             ├─ Formal Justification: "Making education compulsory from age 4-17"
             └─> IMPACT: Expands child protection through mandatory educational access

[2019-12-12] Amendment EC 65/2010
             ├─ Source: urn:lex:br:federal:emenda.constitucional:2019-12-12;65
             ├─ Formal Justification: "Establishing youth as distinct constitutional category"
             └─> IMPACT: Extends temporal scope of childhood protection through youth phase

[2022-03-10] Amendment EC 108/2020
             ├─ Source: urn:lex:br:federal:emenda.constitucional:2022-03-10;108
             ├─ Formal Justification: "Emergency assistance for vulnerable populations"
             └─> IMPACT: Operationalizes mother/child protection through emergency welfare
```

### (b) Versions of Provisions Involved

**Complete Version History:**

| Date | Version ID | Text Snippet | Amendment/Source |
|------|-----------|--------------|------------------|
| 1988-10-05 | `art6_cpt@1988-10-05` | "...proteção à maternidade e à infância..." | Original Constitution |
| 2000-02-14 | `art6_cpt@2000-02-14` | "...proteção à maternidade e à infância, a assistência aos desamparados, **na forma desta Constituição**" | EC 26/2000 |
| 2010-02-04 | `art6_cpt@2010-02-04` | Same text + education now compulsory from age 4 | EC 59/2009 |
| 2019-12-12 | `art6_cpt@2019-12-12` | Same + youth category established elsewhere | EC 65/2010 |
| 2022-03-10 | `art6_cpt@2022-03-10` | Same + emergency assistance mechanism | EC 108/2020 |

### (c) Causal DAG Explaining Amendment Chain

```
                    ┌─────────────────────────────────────────┐
                    │ 1988 Constitution Promulgated            │
                    │ "Art. 6: Social Rights"                  │
                    │ └─ Establishes maternal/child protection  │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ EC 26/2000                   │
                    │ "Right to Food"              │
                    │ └─ Nutritional foundation    │
                    │    for mothers & children    │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ EC 59/2009                   │
                    │ "Compulsory Education 4-17"  │
                    │ └─ Educational access       │
                    │    expands child protection  │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ EC 65/2010                   │
                    │ "Youth as Category"          │
                    │ └─ Extends protection       │
                    │    through youth phase       │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ EC 108/2020                  │
                    │ "Emergency Assistance"       │
                    │ └─ Operationalizes          │
                    │    mother/child protection   │
                    │    through welfare programs  │
                    └──────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ 2025: Current Scope         │
                    │ ─────────────────────────   │
                    │ Protection to Motherhood    │
                    │ and Childhood includes:     │
                    │ • Nutrition (food right)    │
                    │ • Education (4-17)          │
                    │ • Youth development         │
                    │ • Emergency assistance      │
                    └──────────────────────────────┘
```

**DAG Explanation (A ↦ B ↦ C ↦ D ↦ E):**

1. **A (1988): Constitutional Foundation**
   - Creates Article 6, establishing "protection to motherhood and childhood"
   - Scope: Basic enunciation of rights (aspirational)

2. **A ↦ B (2000): Nutritional Dimension**
   - EC 26/2000 adds "right to food"
   - **Direct impact:** Mothers need nutrition; children need nutrition
   - **Scope expansion:** From aspirational right to inclusive of food security

3. **B ↦ C (2010): Educational Dimension**
   - EC 59/2009 makes education compulsory (age 4-17)
   - **Direct impact:** Child development requires education
   - **Scope expansion:** Now includes mandatory educational access throughout childhood

4. **C ↦ D (2019): Temporal Extension**
   - EC 65/2010 establishes youth as constitutional category
   - **Indirect impact:** Extends protective age range beyond early childhood
   - **Scope expansion:** "Childhood" protection now extends through youth phase

5. **D ↦ E (2022): Operationalization**
   - EC 108/2020 creates emergency assistance mechanisms
   - **Direct impact:** Materializes protection through welfare programs
   - **Scope expansion:** Converts constitutional mandate into concrete assistance programs

---

## Key Takeaways

✅ **Semantic Discovery:** Without prior assumptions, the agent located the social right using full-text search

✅ **Temporal Reconstruction:** Retrieved all 5 versions spanning 37 years of constitutional evolution

✅ **Causal Tracing:** Each version linked to its originating amendment via Action entities

✅ **Formal Justifications:** Amendment metadata provided the "why" behind each change

✅ **Complete Lineage:** Built a deterministic, auditable chain: 1988 → 2000 → 2010 → 2019 → 2022

✅ **Scope Analysis:** Demonstrated how each amendment cascaded to expand the scope of "protection to motherhood and childhood"

### Capabilities Impossible for Standard RAG

| Question | Baseline RAG | SAT-Graph API |
|----------|--------------|---------------|
| **Locate right without prior knowledge** | ❌ Fragmented results | ✅ Semantic + structural discovery |
| **Show all versions at different points in time** | ❌ Flat index across versions | ✅ Temporal reconstruction with validity intervals |
| **Trace amendment chain with formal justifications** | ❌ Cannot model causal links | ✅ Action entities with metadata |
| **Explain why each amendment was made** | ❌ Justifications not indexed | ✅ Formal justifications in action metadata |
| **Verify complete scope evolution** | ❌ Cannot guarantee completeness | ✅ Impact summary + complete version history |
| **Show cascading impacts (A ↦ B ↦ C)** | ❌ No causal model | ✅ Deterministic DAG from causality traces |
| **Answer "what was the scope on date X?"** | ❌ No point-in-time semantics | ✅ `getValidVersion(timestamp=X)` guaranteed |

---

## Execution Pattern Summary

```
Initial Grounding (Sequential):
├── search_text_units() [finds social right semantically]
└── get_item_context() [understands hierarchical position]

Phase 2: Temporal Mapping (Sequential):
├── get_temporal_coverage() [discovers 5 versions]
└── get_versions_in_interval() [retrieves all version IDs]

Phase 3: Causal Tracing (Parallelizable):
├── trace_causality(version_1)
├── trace_causality(version_2)
├── trace_causality(version_3)
├── trace_causality(version_4)
└── trace_causality(version_5) [all independent, can run in parallel]

Phase 4: Text Reconstruction (Batch):
├── batch_get_text_units() [all 5 versions in one request]
└── compare_versions() [pairwise comparisons of consecutive versions]

Phase 5: Amendment History (Query):
├── query_actions() [retrieve all amendments affecting the item]
└── batch_get_actions() [hydrate metadata for each amendment]

Synthesis:
└── Agent synthesizes DAG from causality traces + versions + text
```

---

## Real-World Legal Sources

This example is grounded in Brazil's actual constitutional evolution:

### Amendments Cited
- **Constitution of 1988** - [Federal Constitution](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) - Article 6
- **Amendment No. 26/2000** - [Right to Food](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc26.htm)
- **Amendment No. 59/2009** - [Compulsory Education](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc59.htm)
- **Amendment No. 65/2010** - [Youth Rights](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc65.htm)
- **Amendment No. 108/2020** - [Emergency Assistance](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc108.htm)

---

## Key Insights for API Design

This use case demonstrates **critical API capabilities** for cascading impact analysis:

1. **Semantic Discovery Without Grounding** - Find rights/concepts by natural language alone
2. **Complete Temporal Reconstruction** - Retrieve all versions with validity intervals
3. **Causal Chain Linking** - Actions connect versions to their originating amendments
4. **Formal Justification Metadata** - Understand _why_ amendments were made
5. **Composable Queries** - `query_actions()` provides transparent, auditable amendment retrieval without hidden aggregation
6. **Deterministic Point-in-Time** - Answer "what was valid on date X?" with certainty
7. **Scope Evolution** - Track how a single right's legal scope expanded over time
8. **Cascading Causality** - Show how A ↦ B ↦ C ↦ D changes eventually affect E

This use case demonstrates how the SAT-Graph API enables sophisticated causal analysis for complex regulatory evolution, moving beyond text retrieval to provide complete, auditable understanding of how legal frameworks change and impact specific rights over time.
