# Temporal Resolution Guide

This guide explains how the SAT-Graph API handles temporal queries, focusing on the two temporal resolution policies and their behavior in various scenarios.

---

## Table of Contents

- [Overview](#overview)
- [Why Temporal Resolution Matters](#why-temporal-resolution-matters)
- [Temporal Resolution Policies](#temporal-resolution-policies)
- [Comparative Examples](#comparative-examples)
- [Edge Cases and Boundary Conditions](#edge-cases-and-boundary-conditions)
- [Use Case Decision Guide](#use-case-decision-guide)
- [API Actions Using Temporal Resolution](#api-actions-using-temporal-resolution)
- [Best Practices](#best-practices)

---

## Overview

Many types of documents, like legal norms, are **time-sensitive** - the same article can have different text and meaning at different points in time. The SAT-Graph API provides **deterministic temporal resolution** through two distinct policies:


| Policy           | Semantics                                 | Use Case                                                    |
| ---------------- | ----------------------------------------- | ----------------------------------------------------------- |
| **PointInTime**  | Strict containment - exact moment in time | Legal compliance, audit trails, precise historical analysis |
| **SnapshotLast** | Snapshot semantics - end-of-day state     | General queries, user-facing applications, research         |

**Default:** `SnapshotLast` (most intuitive for general use)

---

## Why Temporal Resolution Matters

### The Challenge: Multiple Events on the Same Day

In some domains, multiple changes can occur on the same day:

```
Item: Topic 1 of Document X

Timeline:
├── Version A [2020-01-01, 2020-06-15)  ← Valid from Jan 1 to Jun 14
├── Version B [2020-06-15, 2020-06-15)  ← Valid ONLY on Jun 15 (single day)
└── Version C [2020-06-15, null]        ← Valid from Jun 15 onwards
```

**Question:** What was Topic 1 on June 15, 2020?

**Answer depends on policy:**

- `PointInTime` at `2020-06-15T00:00:00Z` → **Version A** (still valid at start of day)
- `PointInTime` at `2020-06-15T23:59:59Z` → **Version C** (valid at end of day)
- `SnapshotLast` at `2020-06-15` → **Version C** (last version that day)

### Why This Matters for Legal Systems

1. **Compliance Queries:** "Was my action legal on date X?" requires **PointInTime** precision
2. **Historical Research:** "What was the law at end of 2020?" uses **SnapshotLast** semantics
3. **Audit Trails:** Regulatory audits need exact moment-in-time answers
4. **User Experience:** Most users think "end of day" when asking about a date

---

## Temporal Resolution Policies

### PointInTime (Strict Containment)

**Definition:** Returns the version whose validity interval **strictly contains** the exact timestamp.

**Formal Logic:**

```
Given:
  - Query timestamp: T
  - Version validity: [start, end)  (end-exclusive interval)

Return version if:
  start <= T < end
```

**Key Characteristics:**

- ✅ **Precise:** Exact moment in time
- ✅ **Deterministic:** Same timestamp always returns same result
- ⚠️ **Boundary-sensitive:** Timestamp at boundary returns "before" state
- 🎯 **Use for:** Compliance, audit trails, precise historical analysis

**Behavior:**

```
Version validity interval: [2020-06-15T00:00:00Z, 2020-12-31T23:59:59Z)

Query: 2020-06-15T00:00:00Z  → ✅ Returns this version (start included)
Query: 2020-06-15T12:00:00Z  → ✅ Returns this version (within interval)
Query: 2020-12-31T23:59:59Z  → ❌ Does NOT return (end excluded)
Query: 2020-12-31T23:59:58Z  → ✅ Returns this version (before end)
```

---

### SnapshotLast (Snapshot Semantics)

**Definition:** Returns the **last version** whose validity interval started on or before the queried date, treating the query as "end of day."

**Formal Logic:**

```
Given:
  - Query date: D (treated as end of day D)
  - All versions with start dates <= D

Return:
  The version with the LATEST start date <= D
```

**Key Characteristics:**

- ✅ **Intuitive:** Matches how people think ("What was the law on date X?")
- ✅ **Simple:** No need to specify exact time
- ✅ **Snapshot-oriented:** Gives you the state at end of specified day
- 🎯 **Use for:** General queries, user-facing apps, historical research

**Behavior:**

```
Timeline:
- Version A starts: 2020-01-01
- Version B starts: 2020-06-15 (morning)
- Version C starts: 2020-06-15 (afternoon)

Query: 2020-06-14  → Returns Version A (latest before Jun 15)
Query: 2020-06-15  → Returns Version C (latest on Jun 15)
Query: 2020-12-31  → Returns Version C (still latest)
```

---

## Comparative Examples

### Example 1: Single Change on a Date

**Timeline:**

```
Version 1: [2020-01-01, 2020-06-15)  "Topic text: Old version"
Version 2: [2020-06-15, null]        "Topic text: New version"
```

**Query Date:** June 15, 2020


| Policy         | Timestamp               | Result        | Explanation                                  |
| -------------- | ----------------------- | ------------- | -------------------------------------------- |
| `PointInTime`  | `2020-06-15T00:00:00Z`  | **Version 1** | Exact start moment - old version still valid |
| `PointInTime`  | `2020-06-15T00:00:01Z`  | **Version 2** | One second after change                      |
| `PointInTime`  | `2020-06-15T23:59:59Z`  | **Version 2** | End of day - new version                     |
| `SnapshotLast` | `2020-06-15` (any time) | **Version 2** | Last version that day                        |

**Visualization:**

```
2020-06-15
00:00:00 ├─────────────────────────────────────┤ 23:59:59
         ↑                                      ↑
    Version 1 → Version 2                Version 2
    (boundary)                          (end of day)
```

---

### Example 2: Multiple Changes on Same Day

**Timeline:**

```
Version A: [2020-06-15T00:00:00Z, 2020-06-15T10:00:00Z)  "Morning version"
Version B: [2020-06-15T10:00:00Z, 2020-06-15T16:00:00Z)  "Midday version"
Version C: [2020-06-15T16:00:00Z, null]                  "Afternoon version"
```

**Query Date:** June 15, 2020


| Policy         | Timestamp               | Result        | Explanation                |
| -------------- | ----------------------- | ------------- | -------------------------- |
| `PointInTime`  | `2020-06-15T00:00:00Z`  | **Version A** | Exact start of day         |
| `PointInTime`  | `2020-06-15T09:59:59Z`  | **Version A** | Just before 10am change    |
| `PointInTime`  | `2020-06-15T10:00:00Z`  | **Version B** | Exactly at 10am change     |
| `PointInTime`  | `2020-06-15T15:59:59Z`  | **Version B** | Just before 4pm change     |
| `PointInTime`  | `2020-06-15T16:00:00Z`  | **Version C** | Exactly at 4pm change      |
| `PointInTime`  | `2020-06-15T23:59:59Z`  | **Version C** | End of day                 |
| `SnapshotLast` | `2020-06-15` (any time) | **Version C** | Always last version of day |

**Key Insight:** `SnapshotLast` ignores intra-day changes and always returns the final state.

---

### Example 3: No Version Exists at Date

**Timeline:**

```
Version 1: [2025-01-01, null]  "Item created in 2025"
```

**Query Date:** 2020-06-15 (before item existed)


| Policy         | Timestamp              | Result            | HTTP Status        |
| -------------- | ---------------------- | ----------------- | ------------------ |
| `PointInTime`  | `2020-06-15T12:00:00Z` | **404 Not Found** | `NO_VALID_VERSION` |
| `SnapshotLast` | `2020-06-15`           | **404 Not Found** | `NO_VALID_VERSION` |

**Error Response:**

```json
{
  "error": {
    "code": "NO_VALID_VERSION",
    "message": "No valid version exists at the specified timestamp.",
    "details": {
      "item_id": "urn:lex:...",
      "timestamp": "2020-06-15T12:00:00Z",
      "temporal_coverage": {
        "start": "2025-01-01T00:00:00Z",
        "end": null
      },
      "suggestion": "This item was created on 2025-01-01. Please query a date on or after this."
    }
  }
}
```

---

### Example 4: Version Terminated (No Longer Valid)

**Timeline:**

```
Version 1: [2020-01-01, 2020-12-31)  "Old version (revoked)"
[Gap - item no longer valid]
```

**Query Date:** 2025-06-15 (after revocation, item doesn't exist anymore)


| Policy                         | Result            | Explanation                    |
| ------------------------------ | ----------------- | ------------------------------ |
| `PointInTime` at `2025-06-15`  | **404 Not Found** | No version valid at this date  |
| `SnapshotLast` at `2025-06-15` | **404 Not Found** | No version exists at this date |

**Note:** Some legal items can be revoked without replacement, creating gaps in coverage.

---

## Edge Cases and Boundary Conditions

### Edge Case 1: Timestamp Exactly at Boundary

**Scenario:** Query timestamp exactly matches version start/end

**Timeline:**

```
Version A: [2020-06-15T00:00:00Z, 2020-12-31T00:00:00Z)
Version B: [2020-12-31T00:00:00Z, null]
```

**Boundary Queries:**


| Timestamp              | PointInTime Result | Explanation                                   |
| ---------------------- | ------------------ | --------------------------------------------- |
| `2020-06-15T00:00:00Z` | **Version A**      | Start time is**included**                     |
| `2020-12-31T00:00:00Z` | **Version B**      | End time is**excluded** from previous version |

**Rule:** Intervals are **[start, end)** - start inclusive, end exclusive.

---

### Edge Case 2: Microsecond Precision

**Question:** Do microseconds matter?

**Answer:** Yes, the API uses full RFC 3339 precision.

**Example:**

```
Version A ends:   2020-06-15T12:00:00.000000Z
Version B starts: 2020-06-15T12:00:00.000001Z  (1 microsecond later)

Query: 2020-06-15T12:00:00.000000Z → Version A (inclusive start)
Query: 2020-06-15T12:00:00.000001Z → Version B (1μs after boundary)
```

**Recommendation:** Use whole seconds (`T12:00:00Z`) for clarity unless you need microsecond precision.

---

### Edge Case 3: Time Zones and UTC

**Important:** All timestamps in the API are in **UTC** (Coordinated Universal Time).

**Example Problem:**

```
User thinks: "June 15, 2020 in São Paulo" (BRT = UTC-3)
User queries: 2020-06-15T00:00:00Z (midnight UTC)
Actual local time: June 14, 2020 at 9:00 PM BRT

Result: Might get wrong version!
```

**Solution:** Always convert local times to UTC before querying.

**Conversion Examples:**

```python
from datetime import datetime, timezone

# São Paulo (BRT = UTC-3) - June 15, 2020 at midnight local time
local_time = datetime(2020, 6, 15, 0, 0, 0)
utc_time = local_time.replace(tzinfo=timezone.utc)  # Treat as UTC
# Query: 2020-06-15T00:00:00Z

# If you need actual BRT conversion:
from zoneinfo import ZoneInfo
local_time_brt = datetime(2020, 6, 15, 0, 0, 0, tzinfo=ZoneInfo("America/Sao_Paulo"))
utc_time = local_time_brt.astimezone(timezone.utc)
# Result: 2020-06-15T03:00:00Z (June 15 midnight BRT = June 15 3am UTC)
```

---

### Edge Case 4: Single-Day Versions

**Scenario:** A version valid for only one day (rare but possible)

**Timeline:**

```
Version A: [2020-06-14, 2020-06-15)  "Valid only June 14"
Version B: [2020-06-15, 2020-06-16)  "Valid only June 15"
Version C: [2020-06-16, null]        "Valid from June 16 onwards"
```

**Queries:**


| Policy         | Date                   | Result        | Explanation                      |
| -------------- | ---------------------- | ------------- | -------------------------------- |
| `PointInTime`  | `2020-06-15T00:00:00Z` | **Version B** | Start of June 15                 |
| `PointInTime`  | `2020-06-15T23:59:59Z` | **Version B** | End of June 15 (still within)    |
| `SnapshotLast` | `2020-06-15`           | **Version B** | Last (and only) version that day |

**Note:** Even single-day versions work correctly with both policies.

---

### Edge Case 5: Leap Seconds

**Question:** Does the API handle leap seconds?

**Answer:** The API follows RFC 3339, which **does not support leap seconds**. The format allows times like `23:59:60`, but the underlying system uses standard 86,400-second days.

**Recommendation:** Use `23:59:59Z` for end-of-day queries, not `23:59:60Z`.

---

## Use Case Decision Guide

### When to Use PointInTime

✅ **Use PointInTime when:**

- Performing **legal compliance checks** ("Was this action legal at exactly 2:30 PM on June 15?")
- Creating **audit trails** that require exact timestamps
- Analyzing **before/after states** of specific legislative events
- Building **deterministic test suites** where precision matters
- Querying **intra-day changes** (multiple versions on same day)

**Example Scenarios:**

```
- "What was the law when the contract was signed at 2020-06-15T14:30:00Z?"
- "Show me the version immediately before Amendment #123 took effect"
- "Verify compliance at the exact moment of the audit: 2020-12-31T23:59:59Z"
```

---

### When to Use SnapshotLast (Default)

✅ **Use SnapshotLast when:**

- Building **user-facing applications** where users think in dates, not timestamps
- Performing **historical research** ("What was the law at end of 2020?")
- Creating **reports** that summarize end-of-period states
- Answering **general questions** about legislation on a date
- **Simplifying** queries (no need to specify exact time)

**Example Scenarios:**

```
- "What was Article 5 on December 31, 2020?"
- "Show me the state of the Constitution on Independence Day 1988"
- "Generate a report of all laws as they existed at year-end 2022"
```

---

### Decision Tree

```
Do you need exact moment-in-time precision?
├─ YES → Use PointInTime
│   └─ Do you know the exact timestamp?
│       ├─ YES → Provide full timestamp (2020-06-15T14:30:00Z)
│       └─ NO → Maybe you actually need SnapshotLast?
│
└─ NO → Use SnapshotLast (default)
    └─ Do you want end-of-day state?
        ├─ YES → Perfect! Use SnapshotLast
        └─ NO → Consider if PointInTime with start-of-day (T00:00:00Z) works
```

---

## API Actions Using Temporal Resolution

### Primary Actions

#### getValidVersion

**Signature:**

```
GET /items/{item_id}/valid-version?timestamp={date}&policy={TemporalPolicy}
```

**Parameters:**

- `item_id` (required): Item to query
- `timestamp` (required): ISO 8601 date-time (e.g., `2020-06-15T12:00:00Z`)
- `policy` (optional): `PointInTime` or `SnapshotLast` (default: `SnapshotLast`)

**Example:**

```bash
# PointInTime query
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:lei:2020;1234;art10/valid-version?timestamp=2020-06-15T14:30:00Z&policy=PointInTime"

# SnapshotLast query (default)
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:lei:2020;1234;art10/valid-version?timestamp=2020-06-15T00:00:00Z"
```

---

#### getBatchValidVersions

**Signature:**

```
POST /items/batch-valid-versions
```

**Request Body:**

```json
{
  "item_ids": ["urn:lex:...", "urn:lex:..."],
  "timestamp": "2020-06-15T12:00:00Z",
  "policy": "PointInTime"
}
```

**Use Case:** Reconstruct the entire state of a document (e.g., all articles of a law) at a specific point in time.

---

#### searchTextUnits (with timestamp)

**Note:** When using `searchTextUnits` with a `timestamp` parameter, the temporal resolution uses **SnapshotLast semantics** implicitly.

**Example:**

```bash
curl -X POST "$BASE_URL/search-text-units" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": ["urn:lex:br:federal:constituicao:1988"],
    "timestamp": "2020-06-15T00:00:00Z",
    "content_query": {
      "semantic": {
        "query_text": "housing rights"
      }
    }
  }'
```

**Behavior:** Searches only in versions that were valid at **end of** June 15, 2020.

---

### Secondary Actions (Introspection)

#### getTemporalCoverage

**Purpose:** Discover the available date range for an item

**Example:**

```bash
GET /items/urn:lex:br:federal:lei:2020;1234;art10/temporal-coverage
```

**Response:**

```json
{
  "start": "2020-01-15T00:00:00Z",
  "end": null
}
```

**Use:** Validate that your query timestamp falls within coverage before calling `getValidVersion`.

---

## Best Practices

### 1. Default to SnapshotLast for User-Facing Apps

```python
# Good: Simple and intuitive for users
def get_law_on_date(item_id, date_str):
    """Get the law as it existed at end of the specified date."""
    timestamp = f"{date_str}T00:00:00Z"  # Midnight UTC
    return api.get_valid_version(item_id, timestamp)
    # Uses SnapshotLast by default

# User query: "What was Article 6 on December 31, 2020?"
result = get_law_on_date("urn:lex:...:art6", "2020-12-31")
```

---

### 2. Use PointInTime for Audit Trails

```python
# Good: Exact timestamp for compliance
def verify_compliance_at_time(item_id, exact_timestamp):
    """Verify law state at exact moment for audit trail."""
    return api.get_valid_version(
        item_id,
        exact_timestamp,
        policy="PointInTime"
    )

# Compliance check: "Was action legal at 2020-06-15 14:30:00 UTC?"
result = verify_compliance_at_time(
    "urn:lex:...:art6",
    "2020-06-15T14:30:00Z"
)
```

---

### 3. Validate Temporal Coverage First

```python
# Good: Check coverage before querying
def safe_get_version(item_id, timestamp):
    """Get version with coverage validation."""
    coverage = api.get_temporal_coverage(item_id)

    query_time = datetime.fromisoformat(timestamp)
    start_time = datetime.fromisoformat(coverage["start"])

    if query_time < start_time:
        raise ValueError(
            f"Query date {timestamp} is before item creation {coverage['start']}"
        )

    return api.get_valid_version(item_id, timestamp)
```

---

### 4. Handle Time Zones Correctly

```python
from datetime import datetime
from zoneinfo import ZoneInfo

# Good: Convert local time to UTC
def query_in_local_timezone(item_id, local_date_str, timezone_str):
    """Query using local date, properly converted to UTC."""
    # Parse local date
    local_time = datetime.fromisoformat(local_date_str)
    local_tz = ZoneInfo(timezone_str)
    local_aware = local_time.replace(tzinfo=local_tz)

    # Convert to UTC
    utc_time = local_aware.astimezone(timezone.utc)
    utc_str = utc_time.isoformat()

    return api.get_valid_version(item_id, utc_str)

# User in São Paulo asks: "What was the law on June 15, 2020 at midnight?"
result = query_in_local_timezone(
    "urn:lex:...:art6",
    "2020-06-15T00:00:00",
    "America/Sao_Paulo"
)
# Queries: 2020-06-15T03:00:00Z (BRT midnight = 3am UTC)
```

---

### 5. Use Whole Seconds for Clarity

```python
# Good: Use whole seconds
timestamp = "2020-06-15T14:30:00Z"  # Clear and readable

# Avoid unless necessary: Microseconds add complexity
timestamp = "2020-06-15T14:30:00.123456Z"  # Only if truly needed
```

---

### 6. Document Your Policy Choice

```python
# Good: Document why you chose a policy
def get_year_end_snapshot(item_id, year):
    """
    Get the version valid at end of specified year.

    Uses SnapshotLast policy to ensure we get the final state
    of the year, even if multiple changes occurred on Dec 31.
    """
    timestamp = f"{year}-12-31T23:59:59Z"
    return api.get_valid_version(
        item_id,
        timestamp,
        policy="SnapshotLast"
    )
```

---

### 7. Test Boundary Conditions

```python
# Good: Test edge cases
def test_version_at_boundary():
    """Test that boundary behavior is correct."""
    # Version A valid: [2020-06-15, 2020-12-31)
    # Version B valid: [2020-12-31, null]

    # Exactly at boundary (end of Version A)
    result_end = api.get_valid_version(
        item_id,
        "2020-12-31T00:00:00Z",
        policy="PointInTime"
    )
    assert result_end.id == "version_b"  # End excluded from A

    # One second before boundary
    result_before = api.get_valid_version(
        item_id,
        "2020-12-30T23:59:59Z",
        policy="PointInTime"
    )
    assert result_before.id == "version_a"  # Still within A
```

---

## Related Documentation

- **[Error Handling Guide](./ERROR_HANDLING.md)** - Handling `NO_VALID_VERSION` errors
- **[API Reference](./api-reference.md)** - Complete action specifications
- **[Action Categories](./ACTION_CATEGORIES.md)** - Understanding deterministic actions
- **[Getting Started Guide](./getting-started.md)** - Basic temporal queries

---

## Summary

### Key Takeaways

1. **PointInTime** = Exact moment precision (use for compliance, audits)
2. **SnapshotLast** = End-of-day state (use for general queries, user apps)
3. **Default is SnapshotLast** - most intuitive for users
4. **Timestamps are UTC** - always convert local times
5. **Boundaries are [start, end)** - start inclusive, end exclusive
6. **Validate coverage first** - avoid 404 errors

### Quick Reference


| Scenario                  | Policy         | Timestamp Format       | Example                |
| ------------------------- | -------------- | ---------------------- | ---------------------- |
| General query "on date X" | `SnapshotLast` | `YYYY-MM-DDT00:00:00Z` | `2020-06-15T00:00:00Z` |
| Compliance at exact time  | `PointInTime`  | Full timestamp         | `2020-06-15T14:30:00Z` |
| End-of-year snapshot      | `SnapshotLast` | `YYYY-12-31T23:59:59Z` | `2020-12-31T23:59:59Z` |
| Before/after event        | `PointInTime`  | Event timestamp ± 1s  | `2020-06-15T10:00:00Z` |

---

**Last Updated:** 2025-10-06
