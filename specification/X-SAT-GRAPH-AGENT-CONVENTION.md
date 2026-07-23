# `x-sat-graph-agent` — Per-primitive agent-usage metadata convention

A vendor extension (`x-sat-graph-agent`) that declares, in a **structured,
machine-consumable** form, *when*, *when-not*, and *how carefully* to use each
primitive. It is the single source of truth for the intrinsic, client-independent
usage knowledge an agent needs beyond the HTTP contract.

**This is not part of the MCP protocol.** It is an OpenAPI vendor extension; it
only takes effect because a consumer chooses to read it. The SAT-Graph MCP adapter
(`sat-graph-expert`) builds each tool's description from `summary` +
`x-sat-graph-agent`. The name is namespaced (not `x-mcp`) precisely to avoid
implying an official MCP extension, and because the metadata is agent-oriented and
would serve any client, not MCP specifically.

`x-sat-graph-agent` is documentation only. It never alters routes, parameters, or
entities; it is an additive sibling of `operationId` / `description`.

## Location

In each operation file under `specification/paths/**/*.yaml`, as a sibling of `description`.

## Schema

```yaml
x-sat-graph-agent:
  version:     1                    # REQUIRED — schema version of this block
  when-to-use: <string>             # REQUIRED — the trigger for choosing this tool
  not-for:     <string>             # optional — the antipattern + the correct sibling tool
  caveats:     <string>             # optional — intrinsic correctness warnings (see below)
  pairs-with:  [<operationId>, ...] # optional — operationIds typically chained from this one
  role:        <enum>               # REQUIRED — planning class (below)
```

`role` vocabulary: `anchor` · `search` · `temporal` · `structural` · `hydration` ·
`causal` · `graph` · `introspection`.

## `caveats` — what belongs here (and what does not)

`caveats` carries **intrinsic, primitive-level correctness warnings** that the HTTP
contract implies but a short selection blurb would drop — facts a caller must know
to use the result *correctly*, independent of client or jurisdiction. Examples:

- discovery results are **scored candidates, not final evidence** — they require
  downstream verification (`searchTextUnits`, `searchItems`, `resolveItemReference`);
- **bitemporality**: `observerTime` chooses "current truth about the past" vs "what
  was known at a past date" (`getValidVersions`, `getApplicableVersions`);
- **breadth without a time anchor**: omitting `at` can span the whole history
  (`getVersionParents`);
- **overlays**: an item's history includes interpretive versions overlaying the
  statutory text, not only textual amendments (`getItemHistory`, `getItemVersions`).

What does **not** belong in `caveats`: multi-step planning discipline, stopping
criteria, jurisdiction rules, or output policy. Those are the consumer's skill/agent
layer, not the spec.

## Rules

1. `when-to-use` says *when to pick this tool*, not what it returns; keep it terse.
2. `not-for` always names the correct alternative, not just a negation.
3. `caveats` is a one- or two-sentence intrinsic warning; deeper discipline lives
   in the consumer's skills.
4. `pairs-with` uses canonical `operationId` (camelCase).
5. Nothing here may depend on jurisdiction or on any particular product/agent.
6. The block is a distilled summary of `### Discussion`; when one changes, review
   the other.

## Example

```yaml
x-sat-graph-agent:
  version: 1
  when-to-use: >-
    First step of any referential plan: turn a textual reference or URN into a
    canonical itemId before temporal, structural, or causal navigation.
  not-for: >-
    Thematic questions with no explicit reference (use searchTextUnits/searchItems);
    structural class names like "Article" (use resolveItemTypeReference).
  caveats: >-
    Returns confidence-scored candidates; if confidence is low or several are close,
    disambiguate before deterministic traversal.
  pairs-with: [getValidVersions, getItemVersions, getItemChildren]
  role: anchor
```

## Coverage

All 40 operations under `paths/**` carry an `x-sat-graph-agent` block. Every new
operation added to the spec must include one; the extractor
(`sat-graph-expert/scripts/extract_xmcp.py`) indexes them by `operationId`.
