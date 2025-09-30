# Canonical Action API for the Structure-Aware Temporal Graph RAG

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenAPI Spec](https://img.shields.io/badge/OpenAPI-3.0.3-blue.svg)](./specification/openapi.yaml)

This repository contains the official OpenAPI 3.x specification for the **Canonical Action API**, a formal, auditable interface for querying the Structure-Aware Temporal Graph (SAT-Graph).

This API is the practical implementation of the architectural framework proposed in the paper:

**[Orchestrating Deterministic Legal Retrieval: A Canonical Action API for Querying the Structure-Aware Temporal Graph RAG](https://example.com/link-to-your-paper)**

## The Problem: The Limits of Standard RAG in Structured Domains

Standard Retrieval-Augmented Generation (RAG) systems, while powerful, treat complex documents as a "flat-text" collection. This approach fails in high-stakes, structured domains like law, leading to critical errors:

-   **Temporal Naivety:** Standard RAG cannot distinguish between a law's current version and its outdated historical versions, making point-in-time analysis impossible.
-   **Context Blindness:** It is unaware of the rigid hierarchical structure of a document (e.g., a Chapter's relationship to an Article), losing essential context.
-   **Causal Opacity:** It cannot trace the legislative events (e.g., an amendment) that cause a legal norm to change over time.

## The Solution: A Two-Layer Architecture for Trustworthy AI

The SAT-Graph RAG framework addresses these challenges with a two-layer architecture:

1.  **[The SAT-Graph (The Knowledge Substrate)](https://arxiv.org/abs/2505.00039):** A verifiable knowledge graph that explicitly models the hierarchy, diachronic evolution, and causal events of legal norms.
2.  **The Canonical Action API (The Interaction Protocol):** This API. It serves as the single, secure, and auditable bridge between a reasoning agent (like an LLM) and the SAT-Graph.

This repository specifies this critical second layer. Instead of a monolithic query engine, this API provides a library of **atomic, composable, and auditable actions** that serve as the fundamental building blocks for constructing reliable retrieval plans.

## Core Design Principles

The API design is guided by three principles to ensure trustworthiness:

-   **1. Maximal Determinism:** We isolate probabilistic natural language interpretation at the entry points (e.g., `resolveItemReference`). Once a formal identifier (URI/URN) is obtained, all subsequent actions that operate on it are **guaranteed to be deterministic**.
-   **2. Composability:** Actions are atomic "building blocks." A higher-level agent can chain them together to construct complex, flexible query workflows.
-   **3. Verifiability through Auditability:** Every action returns a structured output, including confidence scores where applicable. The sequence of calls and responses forms a complete, human-readable audit trail, making the agent's entire reasoning process transparent and verifiable.

## Getting Started

The complete API specification is located in the `specification/` directory.

-   **Primary Specification File:** [`specification/openapi.yaml`](./specification/openapi.yaml)

### Exploring the API

You can explore the API specification using any OpenAPI 3 compatible tool. We recommend:

-   **[Swagger Editor](https://editor.swagger.io/):** Paste the content of `openapi.yaml` to visualize the endpoints and data models interactively.
-   **[ReDoc](https://redocly.github.io/redoc/):** Generate clean, three-panel documentation for easy reading.

### Reusing the Specification: Generating a Client

The primary goal of this specification is to enable third-party reuse. You can automatically generate a client (SDK) for your preferred programming language using the **[OpenAPI Generator](https://openapi-generator.tech/)**.

For example, to generate a Python client:

```bash
# Make sure you have OpenAPI Generator installed
openapi-generator-cli generate -i specification/openapi.yaml -g python -o ./generated-client/python
```

This command will create a fully-typed Python package that you can use to interact with any server that implements this API specification.

## API Capabilities at a Glance

The API actions are organized into logical groups to support complex agentic workflows:

-   **Discovery and Search:** Probabilistic entry points for finding entities based on natural language text, semantic content, or structured filters (e.g., `resolveItemReference`, `searchTextUnits`).
-   **Deterministic Fetch:** Guaranteed retrieval of full data objects using their canonical IDs (e.g., `getItem`, `getValidVersion`).
-   **Structural Navigation:** Actions for traversing the atemporal document hierarchy (e.g., `getAncestors`, `getItemsInScope`).
-   **Causal & Lineage Analysis:** Powerful actions for traversing the temporal and causal dimensions of the graph (e.g., `getItemHistory`, `traceCausality`, `summarizeImpact`).
-   **Introspection:** Actions that allow an agent to discover the graph's capabilities and boundaries at runtime (e.g., `getTemporalCoverage`).

## Use Cases

This API is designed to enable agents to answer complex questions that are intractable for standard RAG, such as:

-   **Point-in-Time Comparison:** "Show me the exact textual differences in Article X before and after the amendment that introduced concept Y."
-   **Causal Lineage Tracing:** "Which specific law introduced the version of Article Y that was valid in 2012, and is that text still the same today?"
-   **Hierarchical Impact Summarization:** "Summarize all revocations within the 'National Tax System' chapter between 2019 and 2022."

## Citing Our Work

If you use this specification or the concepts from our framework in your research, please cite our paper:

```bibtex
@article{demartim2025satgraphapi,
  title={Orchestrating Deterministic Legal Retrieval: A Canonical Action API for Querying the Structure-Aware Temporal Graph RAG},
  author={de Martim, Hudson},
  journal={Journal of Trustworthy AI (Forthcoming)},
  year={2025}
}
```

## Contributing

Contributions to improve and extend the API specification are welcome. Please read our `CONTRIBUTING.md` file for guidelines on how to submit pull requests, open issues, and suggest enhancements.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.