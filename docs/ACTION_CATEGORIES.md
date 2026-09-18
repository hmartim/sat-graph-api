# API Primitive Categories

This document summarizes the current SAT-Graph API primitives by functional role.

## 1. Discovery & Search

Ranked, probabilistic entry points used to locate candidate graph anchors or content.

| Primitive | Purpose |
|---|---|
| `resolveItemReference` | Resolve a textual reference to ranked Item candidates |
| `resolveThemeReference` | Resolve a textual reference to ranked Theme candidates |
| `resolveItemTypeReference` | Resolve a textual reference to ranked ItemType candidates |
| `searchItems` | Ranked search over Items |
| `searchTextUnits` | Ranked semantic/lexical search over TextUnits |

Resolver `confidence` and search `score` values are normalized ranking signals, not calibrated probabilities. Ranked search does not become exhaustive by increasing `topK`.

## 2. Temporal Resolution

Deterministic temporal operations over known Items.

| Primitive | Purpose |
|---|---|
| `getValidVersions` | Resolve Version(s) valid at a time |
| `getApplicableVersions` | Resolve Version(s) applicable/effective at a time |
| `getItemVersions` | Enumerate an Item's Version history |
| `getBatchValidVersions` | Resolve valid Versions for multiple Items |

`at` represents valid/domain time. Where exposed, `observerTime` represents the transaction-time knowledge perspective.

## 3. Deterministic Fetch

Direct retrieval once formal identifiers are known.

| Primitive | Purpose |
|---|---|
| `getItemById` | Retrieve one Item |
| `getVersionById` | Retrieve one Version |
| `getActionById` | Retrieve one Action |
| `getThemeById` | Retrieve one Theme |
| `getItemTypeById` | Retrieve one ItemType |
| `getRelationById` | Retrieve one Relation |
| `getTextUnitById` | Retrieve one TextUnit |
| `getVersionTextUnits` | Retrieve TextUnits associated with one Version |
| `getBatchItems` | Retrieve multiple Items |
| `getBatchVersions` | Retrieve multiple Versions |
| `getBatchActions` | Retrieve multiple Actions |
| `getBatchTextUnits` | Retrieve TextUnits for multiple Versions |
| `getBatchItemTypes` | Retrieve multiple ItemTypes |

For `getVersionTextUnits`, omitting `aspects` returns all available aspects. An existing Version with no TextUnits satisfying optional filters returns an empty array; a nonexistent Version returns `404`.

## 4. Structural Navigation

### Item navigation

Item-level hierarchy is canonical and atemporal.

| Primitive | Purpose |
|---|---|
| `getItemChildren` | Immediate Item children |
| `getItemAncestors` | Item ancestor chain |
| `getItemHierarchy` | Descendant Item IDs from one root |

### Version navigation

Version-level navigation traverses structural relationships recorded for a specific stored Version state. It does not prescribe how those structures were ingested or assembled.

| Primitive | Purpose |
|---|---|
| `getVersionChildren` | Immediate child Versions of a stored Version state |
| `getVersionParents` | Parent Versions, optionally filtered by `at` |
| `getVersionAncestors` | Ancestor Versions, optionally contextualized by time |
| `getVersionHierarchy` | Descendant Version IDs of a stored Version state |

### Taxonomy navigation

| Primitive | Purpose |
|---|---|
| `getItemTypeHierarchy` | Expand an ItemType subtree |
| `getThemeHierarchy` | Expand a Theme subtree |
| `getThemesForItems` | Retrieve Themes associated with Items |

## 5. Causal Analysis

| Primitive | Purpose |
|---|---|
| `getItemHistory` | Retrieve Actions affecting an Item |
| `getActionsBySource` | Retrieve Actions associated with a source Work |
| `queryActions` | Query Actions using structured filters |

Actions are reified state-transition events. Concrete Action types are deployment-defined.

## 6. Graph Traversal

| Primitive | Purpose |
|---|---|
| `getRelations` | Query typed Relations by anchor, predicate, direction, time, or metadata |

Relation predicates are deployment-defined and discoverable at runtime.

## 7. Introspection & Metadata

| Primitive | Output |
|---|---|
| `getAvailableLanguages` | Supported language codes |
| `getSupportedActionTypes` | `VocabularyEntry[]` |
| `getSupportedVersionTypes` | `VocabularyEntry[]` |
| `getSupportedTextUnitAspects` | `VocabularyEntry[]` |
| `getSupportedRelationPredicates` | `VocabularyEntry[]` |
| `getImplementationGuide` | Deployment guidance in Markdown |
| `getRootItemTypes` | Root ItemType objects |
| `getRootThemes` | Root Theme objects |

Each `VocabularyEntry` contains `value`, `label`, and `description`. The structured introspection answers "which values exist and what do they mean?"; the implementation guide can describe broader materialization and usage conventions.

## Typical workflows

### Point-in-time text retrieval

```text
resolveItemReference(...)
→ getValidVersions(itemId, at=...)
→ getVersionTextUnits(versionId, language=..., aspects=[...])
```

Only the resolution step is probabilistic.

### Historically exact ranked search

```text
getValidVersions(containerItemId, at=t)
→ getVersionHierarchy(containerVersionId)
→ searchTextUnits(versionIds=[...], ...)
```

`versionIds` defines an exact Version candidate universe; the final search remains ranked.

### Exhaustive inspection of a known Version scope

```text
getVersionHierarchy(rootVersionId)
→ getBatchTextUnits(versionIds=[...], language=..., aspects=[...])
→ evaluate the desired criterion over the retrieved set
```

This is distinct from using `searchTextUnits(topK=...)` as if ranked search were enumeration.

## Auditability

The API returns structured identifiers, temporal states, and causal links that consumers can preserve as part of an auditable workflow. How calls, responses, intermediate reasoning, or logs are recorded is a consumer/harness decision, not a behavior guaranteed by the API itself.
