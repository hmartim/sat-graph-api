# Error Handling Guide

This document provides comprehensive guidance on error handling in the SAT-Graph API, including HTTP status codes, error response formats, and error scenarios for each primitive category.

---

## Table of Contents

- [Overview](#overview)
- [HTTP Status Codes](#http-status-codes)
- [Error Response Format](#error-response-format)
- [Error Scenarios by Primitive Category](#error-scenarios-by-primitive-category)
- [Client-Side Error Handling Patterns](#client-side-error-handling-patterns)

---

## Overview

The SAT-Graph API follows RESTful conventions for error handling, using standard HTTP status codes and structured JSON error responses. All errors return:

1. **Appropriate HTTP status code** (4xx for client errors, 5xx for server errors)
2. **Structured JSON error object** with machine-readable codes and human-readable messages

This consistent error model ensures:
- ✅ **Auditability** - All errors can be logged and traced
- ✅ **Debuggability** - Clear information about what went wrong
- ✅ **Recoverability** - Clients can programmatically handle errors

---

## HTTP Status Codes

### Success Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| **200 OK** | Request succeeded | All successful GET/POST requests with response body |
| **204 No Content** | Request succeeded, no content to return | Successful operations with no response body (rare in this API) |

---

### Client Error Codes (4xx)

| Code | Meaning | When Used |
|------|---------|-----------|
| **400 Bad Request** | Invalid request parameters or malformed request | Invalid parameter values, type mismatches, constraint violations |
| **401 Unauthorized** | Missing or invalid authentication | No `Authorization` header, invalid API key |
| **403 Forbidden** | Insufficient permissions | Valid API key but no access to requested data source or resource |
| **404 Not Found** | Resource does not exist | Invalid ID, no version exists at the given time, text unavailable in language |
| **422 Unprocessable Entity** | Request is well-formed but semantically invalid | Logically inconsistent parameters (e.g., endDate before startDate) |
| **429 Too Many Requests** | Rate limit exceeded | Too many requests in time window (if rate limiting enabled) |

---

### Server Error Codes (5xx)

| Code | Meaning | When Used |
|------|---------|-----------|
| **500 Internal Server Error** | Unexpected server error | Database errors, unhandled exceptions |
| **503 Service Unavailable** | Service temporarily unavailable | Maintenance mode, database connection issues |

---

## Error Response Format

All error responses return a structured JSON object with the following format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Machine-readable error code (uppercase, snake_case) |
| `message` | string | Human-readable error message |

---

## Standard Error Codes

### Authentication & Authorization Errors

#### MISSING_API_KEY
```json
{
  "code": "MISSING_API_KEY",
  "message": "Authorization header is required. Please provide a valid API key."
}
```
**HTTP Status:** `401 Unauthorized`

---

#### INVALID_API_KEY
```json
{
  "code": "INVALID_API_KEY",
  "message": "The provided API key is invalid or has been revoked."
}
```
**HTTP Status:** `401 Unauthorized`

---

#### DATASOURCE_ACCESS_DENIED
```json
{
  "code": "DATASOURCE_ACCESS_DENIED",
  "message": "Your API key does not have access to the requested data source."
}
```
**HTTP Status:** `403 Forbidden`

---

### Resource Not Found Errors

#### RESOURCE_NOT_FOUND
```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "The requested resource does not exist."
}
```
**HTTP Status:** `404 Not Found`

---

#### NO_VALID_VERSION
```json
{
  "code": "NO_VALID_VERSION",
  "message": "No valid version exists for the specified item at the given time."
}
```
**HTTP Status:** `404 Not Found`

---

#### TEXT_NOT_AVAILABLE
```json
{
  "code": "TEXT_NOT_AVAILABLE",
  "message": "Text content is not available for the specified version in the requested language."
}
```
**HTTP Status:** `404 Not Found`

---

### Parameter Validation Errors

#### INVALID_PARAMETER
```json
{
  "code": "INVALID_PARAMETER",
  "message": "One or more parameters contain invalid values."
}
```
**HTTP Status:** `400 Bad Request`

---

#### MISSING_REQUIRED_PARAMETER
```json
{
  "code": "MISSING_REQUIRED_PARAMETER",
  "message": "A required parameter is missing from the request."
}
```
**HTTP Status:** `400 Bad Request`

---

#### INVALID_DATE_RANGE
```json
{
  "code": "INVALID_DATE_RANGE",
  "message": "Invalid date range: end date must be after start date."
}
```
**HTTP Status:** `422 Unprocessable Entity`

---

### Rate Limiting Errors

#### RATE_LIMIT_EXCEEDED
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "API rate limit exceeded. Please retry after the specified time."
}
```
**HTTP Status:** `429 Too Many Requests`

**Response Headers:**
```
Retry-After: 3600
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1696604400
```

---

## Error Scenarios by Primitive Category

### Discovery & Search Primitives

These primitives are **probabilistic** and may return empty results (not errors) when no matches are found.

#### resolveItemReference

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| No matches found | `200 OK` | N/A | Returns empty array `[]` |
| Invalid `referenceText` (empty) | `400` | `INVALID_PARAMETER` | Text cannot be empty |
| Invalid `topK` (negative) | `400` | `INVALID_PARAMETER` | Must be positive integer |
| Invalid `contextId` | `404` | `RESOURCE_NOT_FOUND` | Context item doesn't exist |

---

#### searchTextUnits

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| No results found | `200 OK` | N/A | Returns empty array |
| Invalid time format | `400` | `INVALID_PARAMETER` | Must be ISO 8601 |
| Invalid language code | `400` | `INVALID_PARAMETER` | Must be valid IETF BCP 47 code |
| Empty query (no semantic/lexical) | `400` | `MISSING_REQUIRED_PARAMETER` | At least one query type required |

---

#### searchItems

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| No results found | `200 OK` | N/A | Returns empty array |
| Invalid metadata filter syntax | `400` | `INVALID_PARAMETER` | Filter must be valid JSON object |
| Invalid themeId | `404` | `RESOURCE_NOT_FOUND` | Theme doesn't exist |

---

### Deterministic Fetch Primitives

These primitives are **fully deterministic** and will return `404` if resource doesn't exist.

#### getItemById

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Item exists | `200 OK` | N/A | Returns Item object |
| Invalid ID format | `400` | `INVALID_PARAMETER` | ID must be valid |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | No item with this ID |
| No access to data source | `403` | `DATASOURCE_ACCESS_DENIED` | Item in restricted data source |

**Example: Item Not Found**
```bash
GET /items/urn:lex:br:federal:lei:9999;art999
```
```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "No Item found with the specified ID."
}
```
**HTTP Status:** `404 Not Found`

---

#### getValidVersions

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Versions exist at given time | `200 OK` | N/A | Returns array of Version objects |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid itemId |
| No version at given time | `404` | `NO_VALID_VERSION` | Item created after the given time |
| Invalid time | `400` | `INVALID_PARAMETER` | Must be ISO 8601 |

**Example: No Valid Version**
```bash
GET /items/urn:lex:br:federal:lei:2020;1234;art10/valid-versions?at=1950-01-01T00:00:00Z
```
```json
{
  "code": "NO_VALID_VERSION",
  "message": "No valid version exists for this item at the specified time."
}
```
**HTTP Status:** `404 Not Found`

---

#### getVersionTextUnits

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| TextUnits exist (optional language filter) | `200 OK` | N/A | Returns array of TextUnit objects |
| Version doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid versionId |
| Text not available in language | `404` | `TEXT_NOT_AVAILABLE` | Language not available |
| Invalid language code | `400` | `INVALID_PARAMETER` | Must be IETF BCP 47 code |

**Example: Text Not Available**
```bash
GET /versions/urn:lex:...:art10@2020-01-15/text-units?language=fr
```
```json
{
  "code": "TEXT_NOT_AVAILABLE",
  "message": "Text is not available in the requested language."
}
```
**HTTP Status:** `404 Not Found`

---

### Structural Navigation Primitives

#### getItemHierarchy

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Items found | `200 OK` | N/A | Returns array of Item IDs |
| Scope is empty (no children) | `200 OK` | N/A | Returns empty array `[]` |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Item doesn't exist |
| Invalid depth (negative, not -1) | `400` | `INVALID_PARAMETER` | Depth must be non-negative or -1 |

---

#### getItemAncestors

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Item has ancestors | `200 OK` | N/A | Returns array of Item IDs |
| Item is root (Work) | `200 OK` | N/A | Returns empty array `[]` |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid itemId |

---

### Causal Analysis Primitives

#### getItemHistory

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Item has history | `200 OK` | N/A | Returns array of Actions |
| Item never changed (only created) | `200 OK` | N/A | Returns single Action (creation) |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid itemId |

---

#### compareVersions

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Versions comparable | `200 OK` | N/A | Returns TextDiffReport |
| Either version doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid versionId |
| Versions from different items | `400` | `INVALID_PARAMETER` | Can only compare versions of same item |

---

### Introspection Primitives

#### getAvailableLanguages

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Always succeeds | `200 OK` | N/A | Returns array of language codes |

---

## Client-Side Error Handling Patterns

### Pattern 1: Graceful Degradation with Fallback

**Scenario:** Retrieve text in preferred language, fallback to default if unavailable

```python
def get_text_with_fallback(version_id, preferred_lang="pt-br", fallback_lang="en"):
    """
    Attempt to retrieve text in preferred language, fallback to default.
    """
    try:
        response = api.get_text_for_version(version_id, preferred_lang)
        return {
            "text": response.content,
            "language": preferred_lang,
            "is_fallback": False
        }
    except APIError as e:
        if e.code == "TEXT_NOT_AVAILABLE":
            # Try fallback language
            try:
                response = api.get_text_for_version(version_id, fallback_lang)
                return {
                    "text": response.content,
                    "language": fallback_lang,
                    "is_fallback": True,
                    "message": f"Text not available in {preferred_lang}, using {fallback_lang}"
                }
            except APIError:
                raise ValueError(f"Text not available in {preferred_lang} or {fallback_lang}")
        else:
            raise
```

---

### Pattern 2: Retry with Exponential Backoff

**Scenario:** Handle transient errors and rate limiting

```python
import time

def api_call_with_retry(func, *args, max_retries=3, **kwargs):
    """
    Retry API call with exponential backoff for transient errors.
    """
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except APIError as e:
            if e.code == "RATE_LIMIT_EXCEEDED":
                retry_after = 60
                print(f"Rate limited. Retrying after {retry_after} seconds...")
                time.sleep(retry_after)
            elif e.status_code >= 500:  # Server errors
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Server error. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                # Client error, don't retry
                raise

    raise Exception(f"Max retries ({max_retries}) exceeded")
```

---

### Pattern 3: Validation Before API Call

**Scenario:** Validate parameters client-side before making API call

```python
from datetime import datetime

def validate_date_range(start_date, end_date):
    """
    Validate date range before making API call.
    """
    try:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

        if end <= start:
            raise ValueError("end_date must be after start_date")

        return True
    except ValueError as e:
        raise ValueError(f"Invalid date format or range: {e}")

# Usage
try:
    validate_date_range("2019-01-01T00:00:00Z", "2022-12-31T23:59:59Z")
    response = api.get_versions_in_interval(
        itemId="...",
        startAt="2019-01-01T00:00:00Z",
        endAt="2022-12-31T23:59:59Z"
    )
except ValueError as e:
    print(f"Validation error: {e}")
```

---

### Pattern 4: Comprehensive Error Logging

**Scenario:** Log all errors with context for debugging

```python
import logging

logger = logging.getLogger(__name__)

def log_api_error(error, context=None):
    """
    Log API error with full context for debugging.
    """
    error_details = {
        "error_code": error.code,
        "message": error.message,
        "status": error.status_code,
        "context": context or {}
    }

    logger.error(f"API Error: {error.code}", extra=error_details)

    # For critical errors, could send to monitoring service
    if error.status_code >= 500:
        send_to_monitoring_service(error_details)

# Usage
try:
    item = api.get_item("urn:lex:br:federal:lei:2020;1234;art10")
except APIError as e:
    log_api_error(e, context={
        "operation": "get_item",
        "itemId": "urn:lex:br:federal:lei:2020;1234;art10",
        "user_id": current_user.id
    })
    raise
```

---

## Best Practices Summary

### ✅ Do's

1. **Always check HTTP status codes** - Don't rely solely on response content
2. **Parse error responses** - Extract `code` and `message` for handling
3. **Implement retry logic** - For transient errors (5xx) and rate limiting (429)
4. **Validate parameters** - Client-side validation before API calls saves round trips
5. **Log errors with context** - Include relevant IDs for debugging with support
6. **Use error codes** - Leverage `code` for programmatic error handling
7. **Respect rate limits** - Use `Retry-After` header and implement backoff

### ❌ Don'ts

1. **Don't ignore 4xx errors** - They indicate client-side issues that won't resolve with retries
2. **Don't retry authentication errors** - 401/403 require credential fixes, not retries
3. **Don't retry 404s blindly** - Resource may genuinely not exist
4. **Don't swallow errors silently** - Always log for debugging
5. **Don't assume success** - Always check status codes and error fields
6. **Don't hard-code error messages** - Use `error.code` for logic, not `error.message`

---

## Related Documentation

- **[OpenAPI Specification](../specification/openapi.yaml)** - Complete primitive specifications
- **[Getting Started Guide](./getting-started.md)** - Authentication and first requests
- **[Primitive Categories](./ACTION_CATEGORIES.md)** - Understanding deterministic vs probabilistic primitives

---

**Last Updated:** 2026-02-17
