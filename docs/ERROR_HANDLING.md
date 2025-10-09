# Error Handling Guide

This document provides comprehensive guidance on error handling in the SAT-Graph API, including HTTP status codes, error response formats, and error scenarios for each action category.

---

## Table of Contents

- [Overview](#overview)
- [HTTP Status Codes](#http-status-codes)
- [Error Response Format](#error-response-format)
- [Error Scenarios by Action Category](#error-scenarios-by-action-category)
- [Client-Side Error Handling Patterns](#client-side-error-handling-patterns)
- [Batch Operation Errors](#batch-operation-errors)

---

## Overview

The SAT-Graph API follows RESTful conventions for error handling, using standard HTTP status codes and structured JSON error responses. All errors return:

1. **Appropriate HTTP status code** (4xx for client errors, 5xx for server errors)
2. **Structured JSON error object** with machine-readable codes and human-readable messages
3. **Additional context** when applicable (e.g., which parameter was invalid)

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
| **400 Bad Request** | Invalid request parameters or malformed request | Invalid parameter values, type mismatches, constraint violations, mutually exclusive parameters used together |
| **401 Unauthorized** | Missing or invalid authentication | No `Authorization` header, invalid API key |
| **403 Forbidden** | Insufficient permissions | Valid API key but no access to requested datasource or resource |
| **404 Not Found** | Resource does not exist | Invalid ID, no version exists at timestamp, text unavailable in language |
| **422 Unprocessable Entity** | Request is well-formed but semantically invalid | Logically inconsistent parameters (e.g., end_date before start_date) |
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
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional: Additional context
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_abc123xyz"
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Machine-readable error code (uppercase, snake_case) |
| `message` | string | Human-readable error message |
| `details` | object | (Optional) Additional context about the error |
| `timestamp` | string | ISO 8601 timestamp when error occurred |
| `request_id` | string | Unique request identifier for debugging |

---

## Standard Error Codes

### Authentication & Authorization Errors

#### MISSING_API_KEY
```json
{
  "error": {
    "code": "MISSING_API_KEY",
    "message": "Authorization header is required. Please provide a valid API key.",
    "details": {
      "header": "Authorization"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_001"
  }
}
```
**HTTP Status:** `401 Unauthorized`

---

#### INVALID_API_KEY
```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or has been revoked.",
    "details": {
      "provided_key": "key_abc...xyz"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_002"
  }
}
```
**HTTP Status:** `401 Unauthorized`

---

#### DATASOURCE_ACCESS_DENIED
```json
{
  "error": {
    "code": "DATASOURCE_ACCESS_DENIED",
    "message": "Your API key does not have access to the requested datasource.",
    "details": {
      "requested_datasource": "datasource_SupremeCourt",
      "granted_datasources": ["datasource_Senate", "datasource_Chamber"]
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_003"
  }
}
```
**HTTP Status:** `403 Forbidden`

---

### Resource Not Found Errors

#### RESOURCE_NOT_FOUND
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource does not exist.",
    "details": {
      "resource_type": "Item",
      "requested_id": "urn:lex:br:federal:lei:2020;1234;art10",
      "action": "getItem"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_004"
  }
}
```
**HTTP Status:** `404 Not Found`

---

#### NO_VALID_VERSION
```json
{
  "error": {
    "code": "NO_VALID_VERSION",
    "message": "No valid version exists for the specified item at the given timestamp.",
    "details": {
      "item_id": "urn:lex:br:federal:lei:2020;1234;art10",
      "timestamp": "1950-01-01T00:00:00Z",
      "policy": "PointInTime",
      "temporal_coverage": {
        "start": "2020-01-15T00:00:00Z",
        "end": null
      }
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_005"
  }
}
```
**HTTP Status:** `404 Not Found`

**Note:** The `temporal_coverage` in details helps clients understand why no version was found.

---

#### TEXT_NOT_AVAILABLE
```json
{
  "error": {
    "code": "TEXT_NOT_AVAILABLE",
    "message": "Text content is not available for the specified version in the requested language.",
    "details": {
      "version_id": "urn:lex:br:federal:lei:2020;1234;art10@2020-01-15",
      "requested_language": "fr",
      "available_languages": ["pt-br", "en"]
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_006"
  }
}
```
**HTTP Status:** `404 Not Found`

**Note:** The `available_languages` in details helps clients implement fallback strategies.

---

### Parameter Validation Errors

#### INVALID_PARAMETER
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "One or more parameters contain invalid values.",
    "details": {
      "invalid_parameters": [
        {
          "parameter": "top_k",
          "value": -5,
          "constraint": "Must be a positive integer between 1 and 100"
        },
        {
          "parameter": "timestamp",
          "value": "2025-99-99",
          "constraint": "Must be a valid ISO 8601 datetime"
        }
      ]
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_007"
  }
}
```
**HTTP Status:** `400 Bad Request`

---

#### MUTUALLY_EXCLUSIVE_PARAMETERS
```json
{
  "error": {
    "code": "MUTUALLY_EXCLUSIVE_PARAMETERS",
    "message": "Cannot use mutually exclusive parameters together.",
    "details": {
      "action": "searchTextUnits",
      "conflicting_parameters": ["version_ids", "item_ids"],
      "usage": "Use either 'version_ids' (Mode 1) OR 'item_ids/theme_ids + timestamp' (Mode 2), but not both"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_008"
  }
}
```
**HTTP Status:** `400 Bad Request`

---

#### MISSING_REQUIRED_PARAMETER
```json
{
  "error": {
    "code": "MISSING_REQUIRED_PARAMETER",
    "message": "A required parameter is missing from the request.",
    "details": {
      "action": "getValidVersion",
      "missing_parameters": ["item_id", "timestamp"],
      "provided_parameters": ["policy"]
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_009"
  }
}
```
**HTTP Status:** `400 Bad Request`

---

#### INVALID_DATE_RANGE
```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Invalid date range: end date must be after start date.",
    "details": {
      "action": "getVersionsInInterval",
      "start_date": "2022-01-01T00:00:00Z",
      "end_date": "2020-01-01T00:00:00Z"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_010"
  }
}
```
**HTTP Status:** `422 Unprocessable Entity`

---

### Rate Limiting Errors

#### RATE_LIMIT_EXCEEDED
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Please retry after the specified time.",
    "details": {
      "limit": 1000,
      "window": "1 hour",
      "retry_after": 3600,
      "reset_time": "2025-10-06T15:30:00Z"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_011"
  }
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

## Error Scenarios by Action Category

### Discovery & Search Actions

These actions are **probabilistic** and may return empty results (not errors) when no matches are found.

#### resolveItemReference

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| No matches found | `200 OK` | N/A | Returns empty array `[]` |
| Invalid `reference_text` (empty) | `400` | `INVALID_PARAMETER` | Text cannot be empty |
| Invalid `top_k` (negative) | `400` | `INVALID_PARAMETER` | Must be positive integer |
| Invalid `context_id` | `404` | `RESOURCE_NOT_FOUND` | Context item doesn't exist |

**Example: No Matches**
```json
{
  "results": [],
  "message": "No items found matching the reference text."
}
```
**HTTP Status:** `200 OK` (empty result is not an error)

---

#### searchTextUnits

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| No results found | `200 OK` | N/A | Returns empty array |
| `version_ids` + `item_ids` both provided | `400` | `MUTUALLY_EXCLUSIVE_PARAMETERS` | Use one mode only |
| Invalid timestamp format | `400` | `INVALID_PARAMETER` | Must be ISO 8601 |
| Invalid language code | `400` | `INVALID_PARAMETER` | Must be valid ISO 639 code |
| Empty query (no semantic/lexical) | `400` | `MISSING_REQUIRED_PARAMETER` | At least one query type required |

---

#### searchItems

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| No results found | `200 OK` | N/A | Returns empty array |
| Invalid metadata filter syntax | `400` | `INVALID_PARAMETER` | Filter must be valid JSON object |
| Invalid theme_id | `404` | `RESOURCE_NOT_FOUND` | Theme doesn't exist |

---

### Deterministic Fetch Actions

These actions are **fully deterministic** and will return `404` if resource doesn't exist.

#### getItem

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Item exists | `200 OK` | N/A | Returns Item object |
| Invalid ID format | `400` | `INVALID_PARAMETER` | ID must be valid URN |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | No item with this ID |
| No access to datasource | `403` | `DATASOURCE_ACCESS_DENIED` | Item in restricted datasource |

**Example: Item Not Found**
```bash
GET /items/urn:lex:br:federal:lei:9999;art999
```
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "No Item found with the specified ID.",
    "details": {
      "resource_type": "Item",
      "requested_id": "urn:lex:br:federal:lei:9999;art999"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_012"
  }
}
```
**HTTP Status:** `404 Not Found`

---

#### getValidVersion

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Version exists at timestamp | `200 OK` | N/A | Returns Version object |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid item_id |
| No version at timestamp | `404` | `NO_VALID_VERSION` | Item created after timestamp |
| Invalid timestamp | `400` | `INVALID_PARAMETER` | Must be ISO 8601 |
| Invalid policy value | `400` | `INVALID_PARAMETER` | Must be PointInTime or SnapshotLast |

**Example: No Valid Version**
```bash
GET /items/urn:lex:br:federal:lei:2020;1234;art10/valid-version?timestamp=1950-01-01T00:00:00Z
```
```json
{
  "error": {
    "code": "NO_VALID_VERSION",
    "message": "No valid version exists for this item at the specified timestamp.",
    "details": {
      "item_id": "urn:lex:br:federal:lei:2020;1234;art10",
      "timestamp": "1950-01-01T00:00:00Z",
      "temporal_coverage": {
        "start": "2020-01-15T00:00:00Z",
        "end": null
      },
      "suggestion": "This item was created on 2020-01-15. Please query a date on or after this."
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_013"
  }
}
```
**HTTP Status:** `404 Not Found`

---

#### getTextForVersion

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Text exists in language | `200 OK` | N/A | Returns TextUnit object |
| Version doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid version_id |
| Text not available in language | `404` | `TEXT_NOT_AVAILABLE` | Language not available |
| Invalid language code | `400` | `INVALID_PARAMETER` | Must be ISO 639 code |

**Example: Text Not Available**
```bash
GET /versions/urn:lex:...:art10@2020-01-15/text-unit?language=fr
```
```json
{
  "error": {
    "code": "TEXT_NOT_AVAILABLE",
    "message": "Text is not available in the requested language.",
    "details": {
      "version_id": "urn:lex:br:federal:lei:2020;1234;art10@2020-01-15",
      "requested_language": "fr",
      "available_languages": ["pt-br", "en"],
      "suggestion": "Try one of the available languages: pt-br, en"
    },
    "timestamp": "2025-10-06T14:30:00Z",
    "request_id": "req_014"
  }
}
```
**HTTP Status:** `404 Not Found`

---

### Structural Navigation Actions

#### enumerateItems

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Items found | `200 OK` | N/A | Returns array of Items |
| Scope is empty (no children) | `200 OK` | N/A | Returns empty array `[]` |
| Neither item_ids nor theme_ids provided | `400` | `MISSING_REQUIRED_PARAMETER` | At least one scope required |
| Both item_ids and theme_ids provided | `400` | `MUTUALLY_EXCLUSIVE_PARAMETERS` | Use one scope type |
| Invalid scope ID | `404` | `RESOURCE_NOT_FOUND` | Scope item/theme doesn't exist |
| Invalid depth (negative) | `400` | `INVALID_PARAMETER` | Depth must be non-negative |

---

#### getItemAncestors

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Item has ancestors | `200 OK` | N/A | Returns array of Items |
| Item is root (Work) | `200 OK` | N/A | Returns empty array `[]` |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid item_id |

---

### Causal & Lineage Analysis Actions

#### getItemHistory

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Item has history | `200 OK` | N/A | Returns array of Actions |
| Item never changed (only created) | `200 OK` | N/A | Returns single Action (creation) |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid item_id |

---

#### traceCausality

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Version has causality | `200 OK` | N/A | Returns {creating_action, terminating_action?} |
| Version doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid version_id |

**Example Success (Version Still Valid):**
```json
{
  "creating_action": {
    "id": "action_001",
    "type": "Creation",
    "date": "2020-01-15T00:00:00Z",
    ...
  },
  "terminating_action": null
}
```

**Example Success (Version Terminated):**
```json
{
  "creating_action": {
    "id": "action_001",
    "type": "Creation",
    ...
  },
  "terminating_action": {
    "id": "action_015",
    "type": "Amendment",
    "date": "2023-05-20T00:00:00Z",
    ...
  }
}
```

---

#### compareVersions

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Versions comparable | `200 OK` | N/A | Returns TextDiffReport |
| Either version doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid version_id |
| Versions from different items | `400` | `INVALID_PARAMETER` | Can only compare versions of same item |

---

### Aggregate Analysis Actions

#### summarizeImpact

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Impact found | `200 OK` | N/A | Returns ImpactReport |
| No actions in interval | `200 OK` | N/A | Returns report with 0 counts |
| Invalid time_interval | `422` | `INVALID_DATE_RANGE` | End before start |
| Invalid action_types | `400` | `INVALID_PARAMETER` | Unknown action type |
| Neither item_ids nor theme_ids | `400` | `MISSING_REQUIRED_PARAMETER` | At least one scope required |

---

### Introspection Actions

#### getTemporalCoverage

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Item has coverage | `200 OK` | N/A | Returns TimeInterval |
| Item doesn't exist | `404` | `RESOURCE_NOT_FOUND` | Invalid item_id |

---

#### getAvailableLanguages

| Scenario | Status | Error Code | Description |
|----------|--------|------------|-------------|
| Always succeeds | `200 OK` | N/A | Returns array of language codes |

---

## Batch Operation Errors

Batch operations handle errors differently - they return **partial results** with detailed error information for failed items.

### Batch Response Format

```json
{
  "results": [
    {
      "id": "id_001",
      "data": { /* Item/Version/Action object */ },
      "status": "success"
    },
    {
      "id": "id_002",
      "data": { /* Item/Version/Action object */ },
      "status": "success"
    }
  ],
  "errors": [
    {
      "id": "id_003",
      "status": "error",
      "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "Item not found"
      }
    },
    {
      "id": "id_004",
      "status": "error",
      "error": {
        "code": "DATASOURCE_ACCESS_DENIED",
        "message": "No access to datasource"
      }
    }
  ],
  "summary": {
    "total_requested": 4,
    "successful": 2,
    "failed": 2
  }
}
```

**HTTP Status:** `200 OK` (even with partial failures)

**Note:** Batch operations return `200 OK` even when some items fail. Check the `errors` array to identify failed items.

---

### Batch Operation Examples

#### getBatchItems - Partial Success

**Request:**
```bash
POST /items/batch-get
```
```json
{
  "ids": [
    "urn:lex:br:federal:lei:2020;1234;art10",
    "urn:lex:br:federal:lei:INVALID",
    "urn:lex:br:federal:lei:2020;5678;art20"
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "urn:lex:br:federal:lei:2020;1234;art10",
      "data": {
        "id": "urn:lex:br:federal:lei:2020;1234;art10",
        "category": "Work Component",
        "type": "Article",
        ...
      },
      "status": "success"
    },
    {
      "id": "urn:lex:br:federal:lei:2020;5678;art20",
      "data": {
        "id": "urn:lex:br:federal:lei:2020;5678;art20",
        "category": "Work Component",
        "type": "Article",
        ...
      },
      "status": "success"
    }
  ],
  "errors": [
    {
      "id": "urn:lex:br:federal:lei:INVALID",
      "status": "error",
      "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "No Item found with the specified ID."
      }
    }
  ],
  "summary": {
    "total_requested": 3,
    "successful": 2,
    "failed": 1
  }
}
```
**HTTP Status:** `200 OK`

---

#### getBatchValidVersions - Mixed Errors

**Request:**
```bash
POST /items/batch-valid-versions
```
```json
{
  "item_ids": [
    "urn:lex:br:federal:lei:2020;1234;art10",
    "urn:lex:br:federal:lei:2020;1234;art99",
    "urn:lex:br:federal:lei:2020;5678;art20"
  ],
  "timestamp": "1950-01-01T00:00:00Z",
  "policy": "PointInTime"
}
```

**Response:**
```json
{
  "results": [],
  "errors": [
    {
      "id": "urn:lex:br:federal:lei:2020;1234;art10",
      "status": "error",
      "error": {
        "code": "NO_VALID_VERSION",
        "message": "No valid version exists at the specified timestamp.",
        "details": {
          "temporal_coverage": {
            "start": "2020-01-15T00:00:00Z"
          }
        }
      }
    },
    {
      "id": "urn:lex:br:federal:lei:2020;1234;art99",
      "status": "error",
      "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "Item does not exist."
      }
    },
    {
      "id": "urn:lex:br:federal:lei:2020;5678;art20",
      "status": "error",
      "error": {
        "code": "NO_VALID_VERSION",
        "message": "No valid version exists at the specified timestamp.",
        "details": {
          "temporal_coverage": {
            "start": "2020-03-01T00:00:00Z"
          }
        }
      }
    }
  ],
  "summary": {
    "total_requested": 3,
    "successful": 0,
    "failed": 3
  }
}
```
**HTTP Status:** `200 OK`

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
                retry_after = e.details.get("retry_after", 60)
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

### Pattern 3: Batch Operation Error Handling

**Scenario:** Process batch results and handle partial failures

```python
def process_batch_results(batch_response):
    """
    Process batch operation results, separating successes from failures.
    """
    successful_items = []
    failed_items = []

    # Process successful results
    for result in batch_response.get("results", []):
        successful_items.append({
            "id": result["id"],
            "data": result["data"]
        })

    # Process errors
    for error in batch_response.get("errors", []):
        failed_items.append({
            "id": error["id"],
            "error_code": error["error"]["code"],
            "error_message": error["error"]["message"]
        })

    # Log summary
    summary = batch_response.get("summary", {})
    print(f"Batch operation: {summary['successful']} succeeded, {summary['failed']} failed")

    # Decide on strategy
    if failed_items:
        if summary["failed"] < summary["total_requested"] * 0.1:  # < 10% failure
            # Acceptable failure rate, continue with partial results
            print("Continuing with partial results")
        else:
            # High failure rate, may need to abort or retry
            print("Warning: High failure rate detected")

    return successful_items, failed_items
```

---

### Pattern 4: Validation Before API Call

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
    response = api.summarize_impact(
        item_ids=["..."],
        time_interval=["2019-01-01T00:00:00Z", "2022-12-31T23:59:59Z"]
    )
except ValueError as e:
    print(f"Validation error: {e}")
```

---

### Pattern 5: Comprehensive Error Logging

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
        "request_id": error.request_id,
        "timestamp": error.timestamp,
        "details": error.details,
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
        "item_id": "urn:lex:br:federal:lei:2020;1234;art10",
        "user_id": current_user.id
    })
    raise
```

---

## Best Practices Summary

### ✅ Do's

1. **Always check HTTP status codes** - Don't rely solely on response content
2. **Parse error responses** - Extract `code`, `message`, and `details` for handling
3. **Implement retry logic** - For transient errors (5xx) and rate limiting (429)
4. **Validate parameters** - Client-side validation before API calls saves round trips
5. **Log errors with context** - Include `request_id` for debugging with support
6. **Handle batch errors gracefully** - Process partial results, don't fail completely
7. **Use error details** - Leverage `available_languages`, `temporal_coverage` for smart fallbacks
8. **Respect rate limits** - Use `Retry-After` header and implement backoff

### ❌ Don'ts

1. **Don't ignore 4xx errors** - They indicate client-side issues that won't resolve with retries
2. **Don't retry authentication errors** - 401/403 require credential fixes, not retries
3. **Don't retry 404s blindly** - Resource may genuinely not exist
4. **Don't swallow errors silently** - Always log for debugging
5. **Don't assume success** - Always check status codes and error fields
6. **Don't hard-code error messages** - Use `error.code` for logic, not `error.message`

---

## Related Documentation

- **[API Reference](./api-reference.md)** - Complete action specifications
- **[Getting Started Guide](./getting-started.md)** - Authentication and first requests
- **[Temporal Resolution Guide](./TEMPORAL_RESOLUTION.md)** - Handling temporal queries
- **[Action Categories](./ACTION_CATEGORIES.md)** - Understanding deterministic vs probabilistic actions

---

**Last Updated:** 2025-10-06
