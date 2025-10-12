# Scope and Boundaries

This document clarifies what SAT-Graph **does** and **does not** provide, establishing clear boundaries for the specification and helping implementers understand where SAT-Graph fits within a complete legal document management pipeline.

---

## What SAT-Graph Provides

SAT-Graph is a **specification** (not an implementation) for:

1. **Temporal Graph Data Model**
   - Representing documents as hierarchical, temporally-aware graphs
   - Modeling versions, items, themes, relations, and actions
   - Supporting temporal reuse (M:N relationships between items and versions)

2. **Deterministic Retrieval API**
   - Point-in-time queries (`at` parameter) for temporal consistency
   - Batch operations to prevent N+1 query problems
   - Filtering by datasources for federated/multi-tenant scenarios

3. **Semantic Interoperability Guidelines**
   - Best practices for using schema.org vocabularies in metadata
   - URI-based identification using standards like LEX URN
   - Zero-shot AI understanding through structured metadata

4. **Audit Trail Foundation**
   - Action entities to track events (e.g. amendments, revocations, etc. for legal domain)
   - Temporal intervals for validity tracking
   - Provenance metadata for assertion sources

---

## What SAT-Graph Does NOT Provide

### 1. Document Parsing and Extraction

**SAT-Graph does NOT provide tooling for converting raw text documents into structured representations.**

The initial conversion of a legal norm (or any document) from raw text into SAT-Graph's structured, hierarchical, and temporal format is considered a **pre-processing step** outside the scope of this specification.

#### This Pre-Processing Phase Typically Involves:

- **Text segmentation**: Breaking documents into hierarchical components (articles, paragraphs, clauses)
- **Structure identification**: Detecting document hierarchy and relationships
- **Action detection**: Identifying events (e.g. amendments, revocations, etc.)
- **Temporal resolution**: Determining validity intervals for versions
- **Version reuse analysis**: Detecting when components are reused across documents

#### Recommended Approaches for Pre-Processing:

1. **Rule-Based Parsers**
   - Pros: Fast, precise, deterministic
   - Cons: Rigid, require manual rules for each document format
   - Best for: Well-structured, standardized document formats (e.g., Brazilian legislation with consistent numbering)

2. **Fine-Tuned LLMs**
   - Pros: Flexible, can handle format variations
   - Cons: Expensive, non-deterministic, require training data
   - Best for: Complex documents, semantic understanding, action identification

3. **Hybrid Approaches**
   - Combine rule-based extraction with LLM-based validation
   - Use LLMs for ambiguous cases, rules for standard patterns
   - Best for: Production systems requiring both flexibility and reliability

#### Version Reuse Detection

SAT-Graph supports temporal reuse (0..M parent cardinality in versions), but **does not specify how to identify which components should be reused**. This analysis must be performed during the pre-processing phase:

- Manual annotation by experts
- Similarity analysis (textual diffing, embeddings)
- LLM-based semantic comparison
- Hybrid approaches combining multiple strategies

---

### 2. Implementation

SAT-Graph is a **specification**, not an implementation. It defines:

- Data models (schemas)
- API contracts (endpoints)
- Behavioral requirements (temporal semantics)

**SAT-Graph does NOT provide:**

- Database implementation (graph DB, relational DB, etc.)
- API server implementation
- Client libraries or SDKs
- Deployment configurations

Implementers are free to choose any technology stack that satisfies the specification (e.g., Neo4j, PostgreSQL with temporal tables, custom graph database).

---

### 3. User Interfaces

SAT-Graph does NOT provide:

- Web interfaces for document browsing
- Diff viewers for comparing versions
- Administrative dashboards
- End-user search interfaces

These are application-layer concerns that should be built **on top of** SAT-Graph-compliant APIs.

---

### 4. Authorization and Authentication

While SAT-Graph supports **datasource-based filtering** (useful for multi-tenancy and access control), it does NOT specify:

- Authentication mechanisms (OAuth, JWT, etc.)
- Authorization policies (RBAC, ABAC, etc.)
- User management
- API key management

Implementers must layer their own auth mechanisms on top of SAT-Graph endpoints.

---

## The Complete Pipeline

Understanding where SAT-Graph fits in the complete workflow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RAW DOCUMENTS (Out of Scope)                             │
│    - PDFs, HTML, XML, plain text                            │
│    - Unstructured or semi-structured formats                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PARSING & EXTRACTION (Out of Scope)                      │
│    - Text segmentation                                      │
│    - Structure identification                               │
│    - Action detection                                       │
│    - Temporal resolution                                    │
│    - Version reuse analysis                                 │
│                                                             │
│    Tools: Custom parsers, fine-tuned LLMs, hybrid systems   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. STRUCTURED DATA                                          │
│    - Items, Versions, Relations, Actions                    │
│    - Hierarchical structure (parent/children)               │
│    - Temporal intervals (validity_interval)                 │
│    - Metadata (schema.org vocabularies)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SAT-GRAPH API (IN SCOPE) ✓                               │
│    - Storage: Persist structured data                       │
│    - Retrieval: Deterministic, auditable queries            │
│    - Temporal semantics: Point-in-time consistency          │
│    - Batch operations: Efficient data fetching              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. APPLICATIONS (Out of Scope)                             │
│    - Web UIs for document browsing                          │
│    - Diff viewers and comparison tools                      │
│    - Search interfaces                                      │
│    - RAG pipelines for AI-assisted legal research           │
└─────────────────────────────────────────────────────────────┘
```

---

## Why This Separation?

### 1. **Separation of Concerns**
- Parsing is a **non-deterministic ML/NLP problem**
- Storage/retrieval is a **deterministic data modeling problem**
- Each requires different expertise and tools

### 2. **Flexibility**
- Clients can choose **any** parsing strategy
- SAT-Graph remains agnostic to upstream tooling
- Parsing strategies can evolve without changing the API

### 3. **Testability**
- SAT-Graph implementations can be tested with synthetic data
- No dependency on parsing quality for API testing
- Clear contracts between pipeline stages

### 4. **Auditability**
- Parsing may be non-deterministic (LLMs evolve)
- SAT-Graph guarantees deterministic retrieval
- Clear boundary for what must be auditable

---

## For Implementers

If you're building a **complete legal document management system**, you'll need:

1. **Pre-Processing Pipeline** (your responsibility)
   - Document ingestion
   - Parsing and extraction
   - Version reuse detection
   - Data validation

2. **SAT-Graph-Compliant API** (implement per this spec)
   - Database layer
   - API endpoints
   - Temporal query logic
   - Datasource filtering

3. **Application Layer** (your responsibility)
   - User interfaces
   - Authentication/authorization
   - Business logic
   - Integration with other systems

---

## Related Documentation

- **[Metadata Best Practices](METADATA_BEST_PRACTICES.md)**: Guidelines for structuring metadata within SAT-Graph
- **[README.md](../README.md)**: Overview of SAT-Graph specification
- **[Example Use Cases](../specification/schemas/examples/)**: Practical examples of SAT-Graph data models
