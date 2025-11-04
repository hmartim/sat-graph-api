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
  "$BASE_URL/versions/version_id_xyz/text-unit?language=pt-br"
```

**Possible Responses:**

**Success Case:**

```json
{
  "id": "text_unit_123",
  "source_type": "Version",
  "source_id": "version_id_xyz",
  "language": "pt-br",
  "aspect": "canonical",
  "content": "Texto em português..."
}
```

**Failure Case (404):**

```json
{
  "code": "TEXT_NOT_FOUND",
  "message": "No TextUnit found for version 'version_id_xyz' with language 'pt-br'"
}
```

---

## Step 2: Fallback to Default Language

If the first call fails, don't give up—retrieve in fallback language.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/version_id_xyz/text-unit?language=en"
```

**Response:**

```json
{
  "id": "text_unit_456",
  "source_type": "Version",
  "source_id": "version_id_xyz",
  "language": "en",
  "aspect": "canonical",
  "content": "Text in English..."
}
```

---

## Step 3: Inform User of Substitution

**Agent Logic:**

```python
def get_text_with_fallback(version_id, preferred_lang="pt-br", fallback_lang="en"):
    try:
        # Attempt preferred language
        text = get_text_for_version(version_id, preferred_lang)
        return {
            "content": text.content,
            "language": preferred_lang,
            "is_fallback": False
        }
    except NotFoundError:
        # Graceful fallback
        text = get_text_for_version(version_id, fallback_lang)
        return {
            "content": text.content,
            "language": fallback_lang,
            "is_fallback": True,
            "message": f"The requested text was not available in {preferred_lang}. Displaying the {fallback_lang} version instead."
        }

result = get_text_with_fallback(version_id="version_id_xyz")

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
    "version_id": "version_id_xyz",
    "requested_language": "pt-br",
    "actual_language": "en",
    "is_fallback": True,
    "message": "The requested text was not available in pt-br. Displaying the en version instead.",
    "content": "Text in English..."
}
```

---

## Advanced Pattern: Multiple Fallback Levels

For systems supporting many languages, agents can implement a fallback hierarchy:

```python
def get_text_with_fallback_chain(version_id, language_chain=["pt-br", "pt", "en", "es"]):
    """Try languages in order until one succeeds"""
    for lang in language_chain:
        try:
            text = get_text_for_version(version_id, lang)
            is_fallback = lang != language_chain[0]
            return {
                "content": text.content,
                "language": lang,
                "is_fallback": is_fallback,
                "preferred_language": language_chain[0],
                "message": f"Preferred language '{language_chain[0]}' not available, using '{lang}' instead." if is_fallback else None
            }
        except NotFoundError:
            continue

    # If all languages fail
    raise NoAvailableTextError(f"No text available in any of: {language_chain}")

result = get_text_with_fallback_chain(version_id="version_id_xyz")
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
