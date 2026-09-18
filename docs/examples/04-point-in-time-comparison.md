# Use Case 4: Point-in-Time Comparison and Causal Pinpointing

## User query

> What were the exact textual differences in Article 6 of the Brazilian Constitution before and after the amendment that introduced the right to housing?

The current SAT-Graph API does not expose a dedicated `compareVersions` primitive. The comparison is composed from causal tracing plus deterministic TextUnit retrieval.

## Step 1 — Resolve the target Item

```bash
curl -G "$BASE_URL/items/by-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "referenceText=Article 6, caput of the Brazilian Constitution"
```

Illustrative response:

```json
[
  {
    "item": {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
      "typeId": "article-component",
      "label": "Article 6, caput"
    },
    "confidence": 0.98
  }
]
```

## Step 2 — Retrieve the causal history

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/{itemId}/history"
```

Each Action can identify source Versions and Versions it terminates or produces.

## Step 3 — Identify the pivotal Action

A deterministic strategy is to collect the produced Version IDs, retrieve their primary legal text, and inspect the returned set for the first state containing the target expression.

```bash
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "versionIds": [
      "version-2000",
      "version-2010",
      "version-2015"
    ],
    "language": "pt-BR",
    "aspects": ["canonical"]
  }'
```

The `canonical` aspect is a legal-deployment convention discovered through `getSupportedTextUnitAspects`; it is not a universal SAT-Graph enum.

After finding the pivotal Action, use its links:

```text
beforeVersionId = pivotalAction.terminatesVersionIds[0]
afterVersionId  = pivotalAction.producesVersionIds[0]
```

The exact cardinality is domain- and event-dependent; clients should not assume every Action has exactly one terminated and one produced Version unless the deployment documents that convention.

## Step 4 — Retrieve the before and after texts

```bash
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "versionIds": ["beforeVersionId", "afterVersionId"],
    "language": "pt-BR",
    "aspects": ["canonical"]
  }'
```

At this point the consumer has both exact textual states. The textual diff itself can be computed locally by the application, agent harness, or another analysis component.

For example:

```python
before_text = text_by_version[beforeVersionId]
after_text = text_by_version[afterVersionId]
changes = local_diff(before_text, after_text)
```

## Why this composition is useful

The SAT-Graph API supplies the formal graph evidence needed for comparison:

- the stable target Item;
- its causal Action history;
- the exact Version IDs before and after the event;
- the exact TextUnits for those Version IDs.

The API does not need a monolithic comparison endpoint to support the workflow. Textual diffing is application logic over deterministically retrieved states.
