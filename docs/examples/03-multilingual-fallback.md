# Use Case 3: Robustness with Multilingual Fallback

> **Based on:** Research Paper Section 5.3.1: "API as a Foundation for Agentic Reasoning"

## User Query

_User prefers Portuguese (pt-BR) but some texts may not be available in that language_

## The Challenge

A standard RAG system would likely:
- ❌ Fail completely when the preferred language isn't available
- ❌ Provide no indication to the user that content is in a different language
- ❌ Require complex pre-filtering to determine language availability

## Agent Execution Plan

The agent's strategy is to **build robust and user-friendly behaviors through graceful fallback strategies**.

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Step 1: Attempt Preferred Language

Try to retrieve text in user's preferred language.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/version_id_xyz/text-units?language=pt-br"
```

**Possible Responses:**

**Success Case** (200 with results):

```json
[
  {
    "id": "text_unit_123",
    "sourceType": "Version",
    "sourceId": "version_id_xyz",
    "language": "pt-br",
    "aspect": "canonical",
    "content": "Texto em português..."
  }
]
```

**No Content Case** (200 with empty array — language not available):

```json
[]
```

**Note:** The endpoint always returns 200. An empty array means no TextUnits exist for the requested language. A 404 is only returned when the `versionId` itself does not exist.

---

## Step 2: Fallback to Default Language

If the first call returns an empty array, retrieve in the fallback language.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/version_id_xyz/text-units?language=en"
```

**Response:**

```json
[
  {
    "id": "text_unit_456",
    "sourceType": "Version",
    "sourceId": "version_id_xyz",
    "language": "en",
    "aspect": "canonical",
    "content": "Text in English..."
  }
]
```

---

## Step 3: Inform User of Substitution

**Agent Logic:**

```python
def get_text_with_fallback(versionId, preferred_lang="pt-br", fallback_lang="en"):
    text_units = get_version_text_units(versionId, language=preferred_lang)
    if text_units:
        return {
            "content": text_units[0].content,
            "language": preferred_lang,
            "is_fallback": False
        }
    # Graceful fallback
    text_units = get_version_text_units(versionId, language=fallback_lang)
    return {
        "content": text_units[0].content,
        "language": fallback_lang,
        "is_fallback": True,
        "message": f"The requested text was not available in {preferred_lang}. Displaying the {fallback_lang} version instead."
    }

result = get_text_with_fallback(versionId="version_id_xyz")

if result["is_fallback"]:
    print(f"⚠️ {result['message']}")
print(result["content"])
```

**User Experience:**

```
⚠️ The requested text was not available in pt-br. Displaying the en version instead.

Text in English...
```

---

## Synthesized Outcome

The agent provides a seamless experience that combines robustness with transparency:

```python
result = {
    "versionId": "version_id_xyz",
    "requestedLanguage": "pt-br",
    "actualLanguage": "en",
    "is_fallback": True,
    "message": "The requested text was not available in pt-br. Displaying the en version instead.",
    "content": "Text in English..."
}
```

---

## Advanced Pattern: Multiple Fallback Levels

For systems supporting many languages, agents can implement a fallback hierarchy:

```python
def get_text_with_fallback_chain(versionId, language_chain=["pt-br", "pt", "en", "es"]):
    """Try languages in order until one returns results"""
    for lang in language_chain:
        text_units = get_version_text_units(versionId, language=lang)
        if text_units:
            is_fallback = lang != language_chain[0]
            return {
                "content": text_units[0].content,
                "language": lang,
                "is_fallback": is_fallback,
                "preferred_language": language_chain[0],
                "message": f"Preferred language '{language_chain[0]}' not available, using '{lang}' instead." if is_fallback else None
            }

    # If all languages return empty
    raise NoAvailableTextError(f"No text available in any of: {language_chain}")

result = get_text_with_fallback_chain(versionId="version_id_xyz")
```

---

## Key Takeaways

✅ **Resilience:** Graceful degradation instead of failure
✅ **Transparency:** User is informed about the substitution and its reason
✅ **Composability:** Clear separation of concerns enables sophisticated behavior
✅ **Flexibility:** Easily extend to multiple fallback levels and language chains
✅ **Atomic Operations:** The basic retrieval operation is simple and composable; robustness is added at the orchestration layer

**Why This Matters:** This pattern demonstrates that the API's **atomic nature** enables agents to build sophisticated, user-friendly behaviors without requiring special "fallback" endpoints or complex server-side logic. The intelligence lives entirely in the agent orchestration layer.

---

*This use case is based on the research paper's real-world legal analysis scenarios.*
