# Metadata Best Practices: Structured Vocabularies for Semantic Interoperability

## Overview

The SAT-Graph API provides a flexible `metadata` field in core entities (`Item`, `Version`, `Theme`, `ItemType`) that accepts any valid JSON structure. While this flexibility enables diverse use cases, we **strongly recommend** using internationally recognized semantic vocabularies—particularly [schema.org](https://schema.org)—to maximize interoperability and enable zero-shot understanding by AI agents.

## Why Use Structured Vocabularies?

### 1. **Self-Describing Data**

Structured vocabularies make metadata semantically meaningful without requiring custom documentation or parsing logic.

**Example: Ambiguous vs. Self-Describing**

```json
// ❌ Ambiguous - requires custom documentation
{
  "metadata": {
    "pub_date": "1988-10-05",
    "jurisdiction": "BR",
    "type": "Constitution"
  }
}

// ✅ Self-describing with schema.org
{
  "metadata": {
    "@context": "https://schema.org",
    "@type": "Legislation",
    "datePublished": "1988-10-05",
    "legislationJurisdiction": {
      "@type": "AdministrativeArea",
      "name": "Brazil",
      "identifier": "BR"
    },
    "legislationType": "Constitution"
  }
}
```

### 2. **Zero-Shot AI Understanding**

Large Language Models (LLMs) are trained on billions of web pages that use schema.org markup. They inherently understand schema.org properties without additional instructions.

**Agentic Workflow Example:**

```
User: "What is the publication date of the Brazilian Constitution?"

Agent reasoning:
1. Calls resolveItemReference("Brazilian Constitution") → gets item_id
2. Calls getItem(item_id) → receives Item with metadata
3. Recognizes metadata["@type"] = "Legislation"
4. Extracts metadata["datePublished"] → "1988-10-05"
5. Responds: "The Brazilian Federal Constitution was published on October 5, 1988."

✅ No custom instructions needed - the agent already knows what "datePublished" means!
```

### 3. **Interoperability Across Systems**

Using standard vocabularies enables seamless integration with:

- **Knowledge Graphs:** Wikidata, DBpedia, legal ontologies
- **Search Engines:** Google Rich Snippets, structured data indexing
- **Legal Tech Tools:** Other systems using schema.org or legal ontologies
- **Data Exchange:** Cross-institutional data sharing with consistent semantics

### 4. **Queryability and Validation**

Structured metadata enables:

- Programmatic queries (e.g., "find all legislation from 2020")
- Schema validation (ensure required properties are present)
- Type-safe extraction (agents know what data type to expect)

## Recommended Vocabularies

### Primary: schema.org

[schema.org](https://schema.org) is the de facto standard for structured data on the web, maintained by Google, Microsoft, Yahoo, and Yandex.

#### **For Legal Norms (Item and Version entities)**

Use the series of articles that begins with: [Legal Knowledge Graph Foundations, Part I: URI-Addressable Abstract Works (LRMoo F1 to schema.org)](https://arxiv.org/abs/2508.00827)

#### **For Organizations (Action sources, legislative bodies)**

Use [schema.org/GovernmentOrganization](https://schema.org/GovernmentOrganization)

```json
{
  "@type": "GovernmentOrganization",
  "name": "Senado Federal",
  "alternateName": "Federal Senate of Brazil",
  "identifier": "senado-federal-br",
  "url": "https://www12.senado.leg.br",
  "location": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Brasília",
      "addressRegion": "DF",
      "addressCountry": "BR"
    }
  }
}
```

#### **For Thematic Concepts (Theme entity)**

Use [schema.org/DefinedTerm](https://schema.org/DefinedTerm)

**Example: Theme metadata**

```json
{
  "@context": { "@vocab": "https://schema.org/" },
  "@id": "https://normas.leg.br/?urn=urn:lex:br:federal:tema:direito.publico",
  "@type": [
    "DefinedTerm",
    "DefinedTermSet" // added when the Theme has subthemes
  ],
  "identifier": "urn:lex:br:federal:tema:direito.publico",
  "name": "Direito Público",
  "description": "...",
  "inLanguage": "pt-BR",
  // Subthemes
  "hasDefinedTerm": [
    { "@id": "https://normas.leg.br/?urn=urn:lex:br:federal:tema:direito.constitucional" },
    { "@id": "https://normas.leg.br/?urn=urn:lex:br:federal:tema:direito.administrativo" }
  ]
}
```

#### **For Item Type Taxonomy (ItemType entity)**

Use [schema.org/CategoryCode](https://schema.org/CategoryCode) to represent classification codes in the poly-hierarchical taxonomy

**Rationale:** `CategoryCode` is specifically designed for codes used in categorization schemes (like document type codes), while `DefinedTerm` is better suited for conceptual vocabulary terms (like Theme). ItemType represents structural type codes (Article, Paragraph, etc.) rather than semantic concepts.

**Example: Item Type metadata**

```json
{
  "@context": { "@vocab": "https://schema.org/" },
  "@type": "CategoryCode",
  "@id": "https://normas.leg.br/?urn=urn:lex:br:federal:tipo.norma:constituicao",
  "identifier": "urn:lex:br:federal:tipo.norma:constituicao",
  "name": "Constituição",
  "description": "Norma fundamental e suprema do ordenamento jurídico brasileiro, que estrutura o Estado e define os direitos e garantias fundamentais.",
  "codeValue": "constituicao",
  "inCodeSet": {
    "@type": "CategoryCodeSet",
    "@id": "https://normas.leg.br/?urn=urn:lex:br:federal:conceito:tipo.norma"
  },
  "additionalProperty": {
    "@type": "PropertyValue",
    "name": "kelsenLevel",
    "value": "0"
  }
}
```

**Benefits:**
- **Semantic precision:** `CategoryCode` explicitly represents classification codes, not conceptual terms
- **Standardized structure:** `codeValue` + `inCodeSet` is the standard pattern for categorization
- AI agents understand this is a **type code** rather than a semantic concept
- `codeValue` provides the short code (ART, CONST) for programmatic use
- `inCodeSet` groups codes into coherent classification systems
- Supports multilingual labels via `name` and `alternateName`

### Secondary: Domain-Specific Ontologies

For specialized legal domains, consider combining schema.org with:

#### **ELI (European Legislation Identifier)**

- Standard: [ELI Ontology](https://op.europa.eu/en/web/eu-vocabularies/eli)
- Use case: European legal documents
- Compatible with LEX URN

#### **FRBR/LRMoo (Legal Resource Metadata)**

- Paper: [Legal Knowledge Graph Foundations](https://arxiv.org/abs/2508.00827)
- Use case: Fine-grained bibliographic modeling
- Aligns with SAT-Graph's Work/Version separation

#### **LKIF (Legal Knowledge Interchange Format)**

- Standard: [LKIF Core Ontology](http://www.estrellaproject.org/lkif-core/)
- Use case: Legal concepts, norms, and arguments

## Best Practices

### 1. **Always Include @context and @type**

```json
{
  "@context": "https://schema.org",
  "@type": "Legislation"
  // ... other properties
}
```

This makes the metadata unambiguous and machine-readable.

### 2. **Use Nested Objects for Complex Entities**

```json
{
  "legislationJurisdiction": {
    "@type": "AdministrativeArea",
    "name": "State of São Paulo",
    "containedInPlace": {
      "@type": "Country",
      "name": "Brazil"
    }
  }
}
```

### 3. **Validate Against Schema.org**

Use tools like:

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- JSON-LD Playground

## Implementation Guidance

### For API Providers

When populating the `metadata` field:

1. **Map your internal fields to schema.org properties**

   ```
   Internal field: pub_date → schema.org: datePublished
   Internal field: jurisdiction_code → schema.org: legislationJurisdiction
   ```
2. **Generate metadata programmatically**

   ```python
   def build_legislation_metadata(item):
       return {
           "@context": "https://schema.org",
           "@type": "Legislation",
           "datePublished": item.publication_date,
           "legislationJurisdiction": {
               "@type": "Country",
               "name": item.jurisdiction_name,
               "identifier": item.jurisdiction_code
           }
       }
   ```
3. **Validate before storing**

### For API Consumers (Agents)

When reading metadata:

1. **Check for @type to determine structure**

   ```python
   if metadata.get("@type") == "Legislation":
       publication_date = metadata.get("datePublished")
   ```
2. **Graceful fallback for non-structured metadata**

   ```python
   # Try structured first
   date = metadata.get("datePublished")
   # Fallback to custom fields
   if not date:
       date = metadata.get("pub_date") or metadata.get("publication_date")
   ```
3. **Use JSON-LD libraries for robust parsing**

   - Python: `pyld`, `rdflib`
   - JavaScript: `jsonld.js`
   - Java: `Apache Jena`

## Academic Foundation

This approach is detailed in the research paper:

> **Legal Knowledge Graph Foundations, Part-I: URI-Addressable Abstract Works (LRMoo F1 to schema.org)**
> [https://arxiv.org/abs/2508.00827](https://arxiv.org/abs/2508.00827)

The paper demonstrates how LRMoo (IFLA's Library Reference Model for legal resources) can be mapped to schema.org, providing both semantic precision and practical interoperability.

## Summary

Using structured vocabularies in the `metadata` field transforms it from a generic JSON blob into **semantically rich, self-documenting data** that:

✅ AI agents understand without custom instructions
✅ Integrates seamlessly with knowledge graphs and search engines
✅ Enables cross-system interoperability
✅ Provides queryable, validatable structure

**Recommendation:** Use `schema.org/Legislation` for legal norms, augmented with domain ontologies (ELI, LRMoo) for specialized use cases.

---

## Related Documentation

- **[Scope and Boundaries](SCOPE.md)**: Understand what SAT-Graph does and does not provide (parsing, extraction, implementation)
- **[README.md](../README.md)**: Overview of SAT-Graph API specification
- **[OpenAPI Specification](../specification/openapi.yaml)**: Complete API reference

---

*This document is part of the SAT-Graph API specification. For questions or contributions, please see the [main repository](https://github.com/anthropics/sat-graph-api).*
