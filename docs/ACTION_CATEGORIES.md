# API Primitive Categories

This document provides a taxonomy of all canonical primitives in the SAT-Graph API, organized by their functional purpose and determinism guarantees.

## Primitive Category Overview

The SAT-Graph API primitives are organized into functional categories. Understanding these categories helps developers and agents select the appropriate primitive for each step in a retrieval plan.

| Category | Purpose | Determinism | Examples |
|----------|---------|-------------|----------|
| **Discovery & Search** | Probabilistic entry points for finding entities | Non-deterministic | `searchItems`, `resolveItemReference`, `searchTextUnits` |
| **Temporal Resolution** | Point-in-time version retrieval after canonical anchoring | Fully deterministic | `getValidVersions`, `getApplicableVersions`, `getItemVersions` |
| **Deterministic Fetch** | ID-based retrieval of full data objects | Fully deterministic | `getItemById`, `getVersionById`, `getActionById`, `getVersionTextUnits` |
| **Structural Navigation** | Hierarchy traversal and context retrieval | Fully deterministic | `getItemAncestors`, `getItemHierarchy`, `getVersionAncestors` |
| **Causal Analysis** | Event tracing and lineage analysis | Fully deterministic | `getItemHistory`, `getActionsBySource`, `queryActions` |
| **Analysis** | Comparative and structural analysis operations | Fully deterministic | `compareVersions` |
| **Introspection** | Schema and system capabilities discovery | Fully deterministic | `getAvailableLanguages`, `getSupportedActionTypes`, `getRootItemTypes` |

## Key Principles

### Maximal Determinism

The API is designed to **isolate probabilistic operations** at the entry points (Discovery & Search category). Once a formal identifier (ID) is obtained, all subsequent primitives are **guaranteed to be deterministic**.

This design enables:
- **Auditable retrieval plans** - Each step's certainty level is known
- **Reproducible results** - Same IDs always return same data
- **Verifiable reasoning** - Agents can provide complete audit trails

### Composability

Primitives are atomic building blocks that can be chained together. A typical workflow:

1. **Discover** (probabilistic): `resolveItemReference("Article 6")` → returns candidate IDs with confidence scores
2. **Fetch** (deterministic): `getItemById(id)` → returns full Item object
3. **Navigate** (deterministic): `getItemAncestors(id)` → returns hierarchical context
4. **Resolve** (deterministic): `getValidVersions(id, "2020-01-01")` → returns specific Versions
5. **Retrieve** (deterministic): `getVersionTextUnits(versionId)` → returns array of TextUnits

Each step builds upon the previous, creating a transparent, auditable chain.

---

## Category Details

### 1. Discovery & Search Primitives

**Purpose:** Probabilistic entry points for finding entities based on natural language, semantic similarity, or partial information.

**Determinism:** Non-deterministic (returns ranked candidates with confidence scores)

**When to Use:** When you don't have a formal ID and need to ground a natural language reference or discover relevant content.

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `resolveItemReference` | Natural language reference | Ranked list of Item candidates + confidence | "Article 6 of the Constitution" → canonical ID |
| `resolveThemeReference` | Theme name/description | Ranked list of Theme candidates + confidence | "Social Security" → theme ID |
| `resolveItemTypeReference` | Type name/description | Ranked list of ItemType candidates + confidence | "Constitutional Amendment" → item type ID |
| `searchTextUnits` | Semantic/lexical query + filters | Ranked list of TextUnits + scores | Find texts about "housing rights" valid in 2005 |
| `searchItems` | Semantic/lexical query + filters | Ranked list of Items + scores | Find structural entities associated with "housing" |

**Design Note:** All discovery primitives return confidence scores or relevance scores to support auditability even in probabilistic steps.

---

### 2. Temporal Resolution Primitives

**Purpose:** Deterministic point-in-time version retrieval. Given a canonical Item ID and temporal parameters, always return the same result for the same graph state.

**Determinism:** Fully deterministic after canonical anchoring

**When to Use:** After obtaining an Item ID from discovery, to determine which Version was valid (or applicable) at a specific point in time.

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `getValidVersions` | Item ID + `at?` + `observerTime?` | Array of Version objects | "Which version of Article 6 was formally valid on 2001-05-20?" |
| `getApplicableVersions` | Item ID + `at?` + `observerTime?` | Array of Version objects | "Which version was materially applicable (excluding vacatio legis) on that date?" |
| `getItemVersions` | Item ID + `startAt?` + `endAt?` | Chronological array of Versions | "What is the full evolutionary history of Article 6?" |
| `getBatchValidVersions` | List of Item IDs + `at` | Array of Version objects | Reconstruct the state of a full document structure at a point in time |

**Bi-temporal Semantics:** `getValidVersions` and `getApplicableVersions` support two temporal dimensions:
- **Valid Time** (`at`): When was the fact valid in the real world?
- **Transaction Time** (`observerTime`): From whose historical perspective? Defaults to "now" (current legal truth).

---

### 3. Deterministic Fetch Primitives

**Purpose:** ID-based retrieval of complete data objects.

**Determinism:** Fully deterministic (same ID always returns same object)

**When to Use:** After obtaining an ID from discovery or navigation, retrieve the full data object.

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `getItemById` | Item ID | Item object | Get full metadata for a specific article |
| `getVersionById` | Version ID | Version object | Get full metadata for a specific version |
| `getActionById` | Action ID | Action object | Get details of a specific legislative event |
| `getThemeById` | Theme ID | Theme object | Get full theme taxonomy info |
| `getItemTypeById` | ItemType ID | ItemType object | Get full structural type info |
| `getVersionTextUnits` | Version ID + `language?` + `aspect?` | Array of TextUnit objects | Get the canonical text of a specific version |
| `getRelationById` | Relation ID | Relation object | Get full details of a semantic cross-reference |
| `getTextUnitById` | TextUnit ID | TextUnit object | Get a specific text fragment by ID |

**Design Note:** These are primary-key lookups — extremely fast and guaranteed to be deterministic.

---

### 4. Structural Navigation Primitives

**Purpose:** Traverse the hierarchical (parent/child) and taxonomic structures.

**Determinism:** Fully deterministic (structure is fixed at query time)

**When to Use:** To explore the document hierarchy, get context, enumerate scope members, or traverse taxonomies.

#### Item (Atemporal) Navigation

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `getItemChildren` | Item ID | Array of child Item objects | Get immediate structural children of an item |
| `getItemAncestors` | Item ID | Ordered array of ancestor Items | Get hierarchical path: Article → Chapter → Title → Work |
| `getItemHierarchy` | Item ID + `depth?` | Array of descendant Item IDs | Get all article IDs in a chapter for batch processing |

#### Version (Temporal) Navigation

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `getVersionChildren` | Version ID | Array of child Version objects | Get immediate structural child Versions |
| `getVersionParents` | Version ID | Array of parent Version objects | Get parent Versions (multiple possible due to structural sharing) |
| `getVersionAncestors` | Version ID + `at?` | Ordered array of ancestor Versions | Get breadcrumb of a provision as it existed at a point in time |
| `getVersionHierarchy` | Version ID + `at?` | HierarchyResponse | Get full temporal subtree at a point in time |

#### Taxonomy Navigation

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `getItemTypeHierarchy` | ItemType ID | Array of descendant ItemType IDs | Get all subtypes of "Normative Component" for type-constrained filtering |
| `getThemeHierarchy` | Theme ID | HierarchyResponse | Get all sub-themes of "Public Law" for thematic scoping |
| `getThemesForItems` | Array of Item IDs | Array of Themes | Map retrieved Items to their associated thematic categories |

**Design Note:** `getItemHierarchy` and taxonomy hierarchy primitives return IDs (lightweight) rather than full objects for deep traversal efficiency. Use batch fetch operations when full objects are needed.

---

### 5. Causal Analysis Primitives

**Purpose:** Trace causal relationships — which events created, modified, or terminated which versions.

**Determinism:** Fully deterministic (causal graph is explicit)

**When to Use:** For provenance tracking, change analysis, backward traceability, or forward impact assessment.

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `getItemHistory` | Item ID + `startTime?` + `endTime?` + `actionTypes?` + `granularity?` | Time-ordered list of Actions | Get complete legislative timeline for an article |
| `getActionsBySource` | Source Work ID + `actionTypes?` + `granularity?` | List of Actions | "What did Constitutional Amendment No. 26/2000 do?" |
| `queryActions` | `itemIds?` + `producesVersionIds?` + `actionTypes?` + `timeInterval?` | List of Actions | Batch impact analysis: "Which events affected these 50 articles?" |

**Granularity Parameter:** `getItemHistory` and `getActionsBySource` support `granularity`:
- `macro`: Returns only top-level events (e.g., the promulgating law as a whole)
- `micro`: Returns only atomic changes (e.g., the specific alteration of a single article)
- Omitted: Returns both levels

**Design Note:** These primitives enable complete audit trails from any version back to its authorizing legislation, and forward from a source law to all the provisions it affected.

---

### 6. Analysis Primitives

**Purpose:** Comparative and structural analysis of versioned content.

**Determinism:** Fully deterministic

**When to Use:** When an agent needs to understand what changed between two known versions.

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `compareVersions` | 2 Version IDs | TextDiffReport | Get exact textual differences between versions |

---

### 7. Introspection Primitives

**Purpose:** Discover schema vocabularies and system boundaries at runtime.

**Determinism:** Fully deterministic (system state is well-defined)

**When to Use:** Before formulating a retrieval plan, to validate available types, themes, and action vocabulary. Enables lazy loading of schema knowledge rather than hardcoding it into prompts.

| Primitive | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `getRootItemTypes` | None | List of root ItemType objects | "What are the root structural types in this graph?" |
| `getRootThemes` | None | List of root Theme objects | "What are the top-level thematic categories?" |
| `getSupportedActionTypes` | None | List of action type strings | "What action types can I filter by in `getItemHistory`?" |
| `getAvailableLanguages` | None | List of BCP 47 language codes | "Which languages are available in the text index?" |

**Design Note:** These primitives support lazy bootstrapping — an agent can fetch the relevant vocabulary when needed rather than relying on a potentially stale system prompt.

---

## Batch Operations

For efficiency, the API provides batch-enabled versions of core fetch primitives:

| Batch Primitive | Single Equivalent | Benefit |
|-----------------|-------------------|---------|
| `getBatchItems` | `getItemById` | Avoid N+1 queries when hydrating multiple IDs |
| `getBatchVersions` | `getVersionById` | Hydrate multiple Versions efficiently (e.g., from history) |
| `getBatchValidVersions` | `getValidVersions` | Reconstruct point-in-time structure across many items in one call |
| `getBatchTextUnits` | `getVersionTextUnits` | Retrieve TextUnits for multiple versions efficiently |
| `getBatchActions` | `getActionById` | Hydrate action details from causal analysis results |
| `getBatchItemTypes` | `getItemTypeById` | Hydrate type taxonomy nodes in bulk |

**Performance Impact:** Batch operations reduce API calls from O(N) to O(1), providing significant latency improvements for complex queries.

---

## Workflow Patterns

### Pattern 1: Point-in-Time Retrieval

```
1. [Discovery]   resolveItemReference("Article 6 of the Brazilian Constitution")
                 → itemId + confidence
2. [Temporal]    getValidVersions(itemId, at="2001-05-20")
                 → versions[]
3. [Fetch]       getVersionTextUnits(versions[0].id, language="pt-BR", aspect="canonical")
                 → text[]
```

**Determinism:** Step 1 is probabilistic; steps 2–3 are deterministic.

---

### Pattern 2: Provenance Tracing (Backward Causality)

```
1. [Discovery]   resolveItemReference("Article 6, caput, Brazilian Constitution")
                 → itemId
2. [Temporal]    getItemVersions(itemId) → versions[]
3. [Fetch]       [getVersionTextUnits(v.id, aspect="canonical") for v in versions]
                 → identify version introducing "moradia"
4. [Fetch]       getActionById(versionAfter.producedByActionId) → action
5. [Fetch]       getVersionById(action.sourceVersionIds[0]) → sourceVersion
6. [Navigation]  getItemAncestors(sourceVersion.itemId) → amending norm hierarchy
```

**Determinism:** Step 1 is probabilistic; steps 2–6 are deterministic.

---

### Pattern 3: Forward Causality (Cascade Impact Analysis)

```
1. [Discovery]  resolveItemReference("Constitutional Amendment No. 26 of 2000")
                → sourceWorkId
2. [Causal]     getActionsBySource(sourceWorkId, granularity="micro")
                → actions[]
3. [Batch]      getBatchVersions([...produced and terminated version IDs from actions])
                → versions[]
```

**Determinism:** Step 1 is probabilistic; steps 2–3 are deterministic.

---

### Pattern 4: Thematic + Hierarchical Impact Analysis

```
Phase 1 — Scope Resolution:
1. [Discovery]   resolveThemeReference("Digital Security") → themeId
2. [Navigation]  getThemeHierarchy(themeId) → expanded theme IDs
3. [Discovery]   searchItems(themeIds=[...expanded IDs]) → anchor itemIds
4. [Navigation]  [getItemHierarchy(anchorId, depth=-1) for anchorId in anchors]
                 → all descendant item IDs

Phase 2 — Historical Analysis:
5. [Causal]      queryActions(itemIds=[...all IDs], timeInterval={startTime="2000-01-01"})
                 → actions[]
```

**Determinism:** Steps 1 and 3 are probabilistic; steps 2, 4, and 5 are deterministic.

**Note:** `searchTextUnits` performs hierarchical traversal internally — passing a root Item ID scopes the search across all its descendants. For temporal pinning or explicit enumeration, `getItemHierarchy` is still required.

---

## Summary

This categorization demonstrates the API's **two-layer determinism model**:

1. **Probabilistic Entry Layer** (Discovery & Search) — Natural language grounding with confidence scores
2. **Deterministic Execution Layer** (all other categories) — Guaranteed reproducible results after canonical anchoring

This architecture enables agents to:
- Build transparent, auditable retrieval plans
- Clearly communicate uncertainty (only in the discovery phase)
- Provide complete verification trails
- Compose complex workflows from simple, verifiable primitives

For complete primitive specifications, see the [OpenAPI Specification](../specification/openapi.yaml).
