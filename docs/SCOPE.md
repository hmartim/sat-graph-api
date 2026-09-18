# Scope and Boundaries

This document defines what the SAT-Graph API does and does not specify.

## Domain neutrality

SAT-Graph is domain-neutral. It models structured Items, temporal Versions, reified Actions, textual representations, classifications, and Relations without requiring a particular application domain.

Legal information is the motivating and primary reference domain used in the accompanying research and examples. Legal constructs such as statutes, amendments, precedents, URN LEX identifiers, and legal TextUnit aspects are therefore useful implementation examples, not universal requirements of the core contract unless explicitly stated.

## What SAT-Graph provides

SAT-Graph specifies a query and retrieval interface over structured temporal graph data:

1. **Structured graph model**
   - stable Items and Item hierarchies;
   - temporal Versions and Version-level structural states;
   - reified Actions for causal state transitions;
   - Themes, ItemTypes, TextUnits, and typed Relations.

2. **Temporal resolution**
   - valid-time resolution through `at`;
   - optional transaction-time perspective through `observerTime` where exposed;
   - distinction between validity and applicability.

3. **Deterministic retrieval and navigation**
   - direct fetch by identifier;
   - batch retrieval;
   - structural navigation;
   - causal and relational traversal.

4. **Ranked discovery**
   - natural-language reference resolution;
   - semantic, lexical, and hybrid ranked retrieval;
   - explicit separation between ranked discovery and exhaustive inspection of an already enumerated scope.

5. **Runtime introspection**
   - available languages;
   - deployment-defined Action types, Version types, TextUnit aspects, and Relation predicates;
   - root taxonomies and deployment implementation guidance.

Structured outputs and composable primitives allow consumers to construct verifiable and auditable workflows. The API does not itself define how an agent records, preserves, or presents an audit trail.

## What SAT-Graph does not provide

### Document parsing and extraction

SAT-Graph does not specify how raw PDF, HTML, XML, or plain text is converted into Items, Versions, Actions, Relations, or TextUnits. Segmentation, structure detection, event extraction, version reuse detection, and materialization are upstream implementation concerns.

### Ingestion and persistence policy

The API describes the observable graph and retrieval semantics. It does not prescribe how a deployment stores data, constructs Version structures, propagates temporal changes, materializes TextUnits, or maps source documents into graph objects.

Implementations may use relational databases, graph databases, temporal stores, search indexes, or other technologies, provided the exposed behavior satisfies the API contract.

### Search technology

SAT-Graph defines observable ranked-retrieval semantics, not a specific database, vector store, full-text engine, embedding model, fusion algorithm, or ranking implementation.

### Agent orchestration

The API provides primitives and lightweight agent-oriented usage metadata. Planning strategies, stopping criteria, retries, logging, audit-trail preservation, and output policy belong to the consuming application or agent harness.

### User interfaces

Web applications, administrative interfaces, diff viewers, and end-user search experiences are application-layer concerns.

## Authentication and authorization

Authentication and authorization are not part of the SAT-Graph graph model or retrieval semantics. The OpenAPI profile in this repository uses API-key authentication through the `Authorization` header. Other deployments may use different security mechanisms while preserving the same SAT-Graph API semantics.

DataSource scoping is part of this profile and can be used by implementations to restrict the data visible to a credential.

## Reference domain: legal information

The repository intentionally retains rich legal examples because they make temporal, structural, and causal behavior concrete. In the legal reference domain, implementations may use conventions such as:

- URN LEX identifiers;
- statutory and interpretive Version types;
- canonical, ratio, facts, and holding TextUnit aspects;
- legislative and judicial Action vocabularies;
- schema.org/Legislation metadata.

These examples illustrate the API; deployment-defined vocabularies can differ and are discoverable through the introspection primitives.

## Related documentation

- [README](../README.md)
- [API Primitive Categories](ACTION_CATEGORIES.md)
- [Metadata Best Practices](METADATA_BEST_PRACTICES.md)
- [Getting Started](getting-started.md)
- [OpenAPI specification](../specification/openapi.yaml)
