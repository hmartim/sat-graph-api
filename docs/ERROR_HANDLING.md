# Error Handling Guide

This document summarizes the error behavior of the current SAT-Graph API profile. The authoritative source is the OpenAPI specification.

## Standard response shape

Errors use the shared `ErrorResponse` structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

## Common status codes

| Status | Meaning |
|---|---|
| `400 Bad Request` | Missing, malformed, or semantically invalid request parameters |
| `401 Unauthorized` | Missing or invalid authentication credentials for this OpenAPI profile |
| `403 Forbidden` | Authenticated request without access to the requested data/resource |
| `404 Not Found` | Requested graph resource does not exist, or an endpoint explicitly defines absence as not found |
| `500 Internal Server Error` | Unexpected server-side failure |

Implementations may expose additional operational errors such as rate limiting or temporary unavailability.

## Discovery & Search

Discovery operations return ranked candidates. No match is normally represented by a successful empty result rather than an error.

Examples:

- `resolveItemReference` with no candidates → `200 []`.
- `searchItems` with no results → `200 []`.
- `searchTextUnits` with no results → `200 []`.
- invalid `topK` → `400`.
- `temporalPredicate` supplied to `searchTextUnits` without `at` → `400`.

Search `score` and resolver `confidence` are normalized ranking signals, not probabilities.

## Deterministic fetch

Direct fetch endpoints return `404` when the requested primary resource does not exist.

### `getVersionTextUnits`

This endpoint distinguishes resource absence from an empty filtered result:

- requested Version does not exist → `404`;
- Version exists but no TextUnits match optional `language` and/or `aspects` filters → `200 []`;
- matching TextUnits exist → `200` with an array.

This distinction supports client-side fallback without treating a missing language or aspect as a missing Version.

### `getBatchTextUnits`

The batch endpoint returns an array of TextUnits. Implementations may document how requested Version IDs that cannot be resolved are handled, particularly when partial batch results are possible.

Operational batch-size limits may be implementation-specific. The source specification documents the behavior required when an accepted batch cannot be completely processed.

## Temporal Resolution

### `getValidVersions`

- Item/temporal target can be resolved → `200` with one or more Versions.
- Item does not exist, or the endpoint defines no valid Version at the requested time as not found → `404`.
- invalid time syntax → `400`.

### `getApplicableVersions`

Follows the same general pattern using applicability semantics.

## Structural Navigation

Navigation endpoints return empty arrays when a valid resource has no matching structural neighbors, for example:

- root Item has no ancestors;
- root Version has no parents;
- leaf Item or Version has no children.

A nonexistent anchor resource returns `404` where specified by the endpoint.

## Introspection

Introspection endpoints normally return `200`, including empty vocabularies or taxonomies where a deployment supports none for a particular category.

Deployment-defined vocabulary endpoints return structured entries containing:

```json
{
  "value": "...",
  "label": "...",
  "description": "..."
}
```

## Client guidance

Consumers should branch on the contract of the specific primitive rather than treating all empty results as errors or all `404` responses as equivalent.

In particular:

- ranked discovery with no match is not an exceptional condition;
- an existing Version with no TextUnits for a requested language/aspect is not a missing Version;
- batch behavior for unresolved IDs may be deployment-specific and can be described in the deployment's implementation documentation.
