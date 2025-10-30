# API Action Categories

This document provides a taxonomy of all canonical actions in the SAT-Graph API, organized by their functional purpose and determinism guarantees.

## Action Category Overview

The SAT-Graph API actions are organized into seven functional categories. Understanding these categories helps developers and agents select the appropriate action for each step in a retrieval plan.

| Category | Purpose | Determinism | Examples |
|----------|---------|-------------|----------|
| **Discovery & Search** | Probabilistic entry points for finding entities | Non-deterministic | `searchItems`, `resolveItemReference`, `searchTextUnits`, `searchThemes` |
| **Deterministic Fetch** | ID-based retrieval of full data objects | Fully deterministic | `getItem`, `getItemType`, `getTheme`, `getVersion`, `getAction` |
| **Structural Navigation** | Hierarchy traversal and context retrieval | Fully deterministic | `getItemAncestors`, `getItemHierarchy`, `getItemContext` |
| **Temporal Resolution** | Point-in-time queries across versions | Fully deterministic | `getValidVersion`, `getVersionsInInterval` |
| **Causal Analysis** | Event tracing and lineage analysis | Fully deterministic | `traceCausality`, `compareVersions`, `getItemHistory` |
| **Aggregate Analysis** | Server-side computation and summarization | Fully deterministic | `summarizeImpact`, `getActionsBySource` |
| **Introspection** | System capabilities and boundary discovery | Fully deterministic | `getAvailableLanguages`, `getTemporalCoverage`, `getSupportedActionTypes`, `getItemTypes` |

## Key Principles

### Maximal Determinism

The API is designed to **isolate probabilistic operations** at the entry points (Discovery & Search category). Once a formal identifier (ID) is obtained, all subsequent actions are **guaranteed to be deterministic**.

This design enables:
- **Auditable retrieval plans** - Each step's certainty level is known
- **Reproducible results** - Same IDs always return same data
- **Verifiable reasoning** - Agents can provide complete audit trails

### Composability

Actions are atomic building blocks that can be chained together. A typical workflow:

1. **Discover** (probabilistic): `resolveItemReference("Article 6")` → returns candidate IDs with confidence scores
2. **Fetch** (deterministic): `getItem(id)` → returns full Item object
3. **Navigate** (deterministic): `getItemAncestors(id)` → returns hierarchical context
4. **Resolve** (deterministic): `getValidVersion(id, "2020-01-01")` → returns specific Version
5. **Retrieve** (deterministic): `getTextForVersion(version_id)` → returns TextUnit

Each step builds upon the previous, creating a transparent, auditable chain.

---

## Category Details

### 1. Discovery & Search Actions

**Purpose:** Probabilistic entry points for finding entities based on natural language, semantic similarity, or partial information.

**Determinism:** Non-deterministic (returns ranked candidates with confidence scores)

**When to Use:** When you don't have a formal ID and need to ground a natural language reference or discover relevant content.

| Action | Input | Output | Use Case |
|--------|-------|--------|----------|
| `resolveItemReference` | Natural language reference | Ranked list of Item IDs + confidence | "Article 6 of the Constitution" → canonical ID |
| `resolveThemeReference` | Theme name/description | Ranked list of Theme IDs + confidence | "Social Security" → theme ID |
| `searchTextUnits` | Semantic/lexical query + filters | Ranked list of TextUnits + scores | Find texts about "housing rights" in 2005 |
| `searchItems` | Semantic/lexical query + filters | Ranked list of Items + scores | Find structural entities that ever mentioned "housing" |
| `searchThemes` | Semantic/lexical query | Ranked list of Theme IDs + scores | Find themes related to "environmental protection" |

**Design Note:** All search actions return confidence scores/relevance scores to support auditability even in probabilistic steps.

---

### 2. Deterministic Fetch Actions

**Purpose:** ID-based retrieval of complete data objects.

**Determinism:** Fully deterministic (same ID always returns same object)

**When to Use:** After obtaining an ID from discovery or navigation, retrieve the full data object.

| Action | Input | Output | Use Case |
|--------|-------|--------|----------|
| `getItem` | Item ID | Item object | Get full metadata for a specific article |
| `getItemChildren` | Item ID | Array of child Item IDs | Get immediate structural children of an item |
| `getVersion` | Version ID | Version object | Get full metadata for a specific version |
| `getVersionChildren` | Version ID | Array of child Version IDs | Get immediate structural children of a version |
| `getVersionParent` | Version ID + optional timestamp | Parent Version ID (or null) | Get parent version valid at specific time |
| `getTheme` | Theme ID | Theme object | Get full theme taxonomy info |
| `getItemType` | ItemType ID | ItemType object | Get full type taxonomy info |
| `getAction` | Action ID | Action object | Get details of a specific legislative event |
| `getValidVersion` | Item ID + timestamp + policy | Version object | Get the version valid on a specific date |
| `getTextForVersion` | Version ID + language | TextUnit object | Get the canonical text of a specific version |

**Design Note:** These are primary-key lookups - extremely fast and guaranteed to be deterministic.

---

### 3. Structural Navigation Actions

**Purpose:** Traverse the hierarchical (parent/child) and thematic (membership) structures.

**Determinism:** Fully deterministic (structure is fixed at query time)

**When to Use:** To explore the document hierarchy, get context, or enumerate members of a scope.

| Action | Input | Output | Use Case |
|--------|-------|--------|----------|
| `getItemHierarchy` | Scope (Item IDs or Theme IDs) + depth | List of Item objects | Get all articles in a chapter |
| `getItemAncestors` | Item ID | Ordered list of ancestors | Get hierarchical path: Article → Chapter → Title → Work |
| `getItemContext` | Item ID | StructuralContext object | Get parent + siblings + children in one call |
| `getThemesForItem` | Item ID | List of Theme objects | Get all themes classifying an item |
| `getItemTypeHierarchy` | ItemType ID | Flat list of descendant ItemType IDs | Get all subtypes of "Normative Component" for filtering |
| `getThemeHierarchy` | Theme ID | Flat list of descendant Theme IDs | Get all sub-themes of "Public Law" for filtering |

**Design Note:** These actions enable context-aware retrieval and hierarchical filtering, essential for legal interpretation and type-based searches.

---

### 4. Temporal Resolution Actions

**Purpose:** Query the temporal dimension - finding versions valid at specific times.

**Determinism:** Fully deterministic (temporal logic is precisely defined)

**When to Use:** For point-in-time analysis or historical version retrieval.

| Action | Input | Output | Use Case |
|--------|-------|--------|----------|
| `getValidVersion` | Item ID + timestamp + policy | Version object | "What was Article 6 on Jan 1, 2000?" |
| `getVersionsInInterval` | Item ID + start date + end date | List of Versions | "All versions of Article 6 from 2010-2020" |

**Design Note:** The `policy` parameter (`PointInTime` vs `SnapshotLast`) ensures deterministic handling of boundary conditions.

---

### 5. Causal Analysis Actions

**Purpose:** Trace causal relationships - which events created or modified which versions.

**Determinism:** Fully deterministic (causal graph is explicit)

**When to Use:** For provenance tracking, change analysis, or impact assessment.

| Action | Input | Output | Use Case |
|--------|-------|--------|----------|
| `getItemHistory` | Item ID | Time-ordered list of Actions | Get complete legislative timeline for an article |
| `traceCausality` | Version ID | {creating_action, terminating_action} | "Which law created this version?" |
| `compareVersions` | 2 Version IDs | TextDiffReport | Get exact textual differences between versions |
| `getActionsBySource` | Source Work ID + filters | List of Actions | "What did Constitutional Amendment #99 do?" |

**Design Note:** These actions enable complete audit trails from any version back to its authorizing legislation.

---

### 6. Aggregate Analysis Actions

**Purpose:** Server-side computation for macro-level queries.

**Determinism:** Fully deterministic (aggregation logic is well-defined)

**When to Use:** For complex queries that would require many client-side calls to replicate.

| Action | Input | Output | Use Case |
|--------|-------|--------|----------|
| `summarizeImpact` | Scope + time interval + filters | ImpactReport (lightweight summary) | "Summarize all changes in Tax chapter 2019-2022" |
| `getActionsBySource` | Source Work ID + action type filter | List of Actions | "All revocations by Law #123" |

**Design Note:** These actions prevent N+1 query problems by performing aggregation server-side, returning lightweight summaries with IDs for selective hydration.

---

### 7. Introspection Actions

**Purpose:** Discover system capabilities and knowledge boundaries at runtime.

**Determinism:** Fully deterministic (system state is well-defined)

**When to Use:** For adaptive agents that need to validate queries or discover available options.

| Action | Input | Output | Use Case |
|--------|-------|--------|----------|
| `getTemporalCoverage` | Item ID | TimeInterval | "What date range is available for this item?" |
| `getAvailableLanguages` | None | List of language codes | "Which languages are supported?" |
| `getSupportedActionTypes` | None | List of action type strings | "What action types can I filter by?" |
| `getItemTypes` | Optional: category | List of item type strings | "What item types exist? (e.g., Constitution, Article)" |
| `getRootItemTypes` | Optional: category | List of root ItemType objects | "What are the root types in the taxonomy?" |
| `getRootThemes` | None | List of root Theme objects | "What are the top-level thematic categories?" |

**Design Note:** These actions enable graceful degradation - agents can validate before querying and provide helpful error messages.

---

## Batch Operations

For efficiency, the API provides batch-enabled versions of core fetch actions:

| Batch Action | Equivalent Single Action | Benefit |
|--------------|-------------------------|---------|
| `getBatchItems` | `getItem` | Avoid N+1 queries when hydrating multiple IDs |
| `getBatchVersions` | `getVersion` | Hydrate multiple Versions efficiently (e.g., from history) |
| `getBatchValidVersions` | `getValidVersion` | Reconstruct point-in-time structure in one call |
| `getBatchTextUnits` | `getTextForVersion` | Retrieve multiple version texts efficiently |
| `getBatchActions` | `getAction` | Hydrate action details from impact summaries |

**Performance Impact:** Batch operations can reduce API calls from O(N) to O(1), providing 10-100x latency improvements for complex queries.

---

## Workflow Patterns

### Pattern 1: Point-in-Time Retrieval

```
1. [Discovery] resolveItemReference("Article 6") → item_id + confidence
2. [Temporal]  getValidVersion(item_id, "1999-01-01") → version
3. [Fetch]     getTextForVersion(version.id, "pt-br") → text
```

**Determinism:** Step 1 is probabilistic, steps 2-3 are deterministic

---

### Pattern 2: Causal Impact Analysis

```
1. [Discovery]  resolveItemReference("Amendment #110") → source_work_id
2. [Causal]     getActionsBySource(source_work_id, ["Revocation"]) → action_ids
3. [Batch]      getBatchActions(action_ids) → full action details
4. [Navigation] Extract affected_item_ids from actions
5. [Batch]      getBatchItems(affected_item_ids) → full item details
```

**Determinism:** Step 1 is probabilistic, steps 2-5 are deterministic

---

### Pattern 3: Hierarchical Scope with Temporal Filtering

```
1. [Discovery]  resolveItemReference("Tax System chapter") → chapter_id
2. [Navigation] getItemHierarchy(chapter_id) → all descendant items
3. [Temporal]   getBatchValidVersions(item_ids, "2020-01-01") → versions
4. [Search]     searchTextUnits(version_ids, "exemption") → relevant texts
```

**Determinism:** Step 1 is probabilistic, steps 2-3 are deterministic, step 4 is probabilistic (semantic search)

---

## Summary

This categorization demonstrates the API's **two-layer determinism model**:

1. **Probabilistic Entry Layer** (Discovery & Search) - Natural language grounding with confidence scores
2. **Deterministic Execution Layer** (All other categories) - Guaranteed reproducible results

This architecture enables agents to:
- Build transparent, auditable retrieval plans
- Clearly communicate uncertainty (only in discovery phase)
- Provide complete verification trails
- Compose complex workflows from simple, verifiable primitives

For complete action specifications, see the [API Reference](./api-reference.md) and [OpenAPI Specification](../specification/openapi.yaml).
