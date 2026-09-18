# Use Case 1: Point-in-Time Retrieval

## User query

> What was the text of Article 6 of the Brazilian Constitution on May 20, 2001?

This example uses the legal reference domain to demonstrate the generic workflow:

```text
ranked reference resolution
→ deterministic temporal resolution
→ deterministic text retrieval
```

## Step 1 — Resolve the Item

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

`confidence` is a normalized implementation-specific ranking signal, not a calibrated probability.

## Step 2 — Resolve the Version valid at the target time

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt/valid-versions?at=2001-05-20T00:00:00Z"
```

Illustrative response:

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "itemId": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6_cpt",
    "type": "statutory",
    "validityInterval": [
      "2000-02-14T00:00:00Z",
      "2010-02-04T00:00:00Z"
    ]
  }
]
```

`statutory` is a legal-deployment Version type, not a core enum.

## Step 3 — Retrieve the legal deployment's primary text

Because omission of `aspects` means all available aspects, this workflow requests the legal deployment's `canonical` aspect explicitly:

```bash
curl -G "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt/text-units" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "language=pt-BR" \
  --data-urlencode "aspects=canonical"
```

Illustrative response:

```json
[
  {
    "id": "text_unit_abc123",
    "sourceType": "Version",
    "sourceId": "urn:lex:br:federal:constituicao:1988-10-05;1988@2000-02-14!art6_cpt",
    "language": "pt-BR",
    "aspect": "canonical",
    "content": "[ Art. 6º ] São direitos sociais ..."
  }
]
```

If the Version exists but there is no TextUnit matching the requested language/aspect filters, the endpoint returns `200 []`. A nonexistent Version returns `404`.

## Why this pattern matters

Only the reference-resolution step is probabilistic. Once the Item ID is anchored, temporal resolution and text retrieval operate on formal graph identifiers and explicit temporal predicates.
