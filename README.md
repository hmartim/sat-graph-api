# SAT-Graph API Specification

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenAPI Spec](https://img.shields.io/badge/OpenAPI-3.0.3-blue.svg)](./specification/openapi.yaml)

This repository contains the official OpenAPI 3.x specification for the **SAT-Graph API**, a formal interface for querying the Structure-Aware Temporal Graph (SAT-Graph).

## Academic publication

This specification is described in:

> Hudson de Martim, **Deterministic Legal Agents: A Canonical Primitive API for Auditable Reasoning over Temporal Knowledge Graphs**, arXiv:2510.06002.

Related work:

- **SAT-Graph RAG** — https://arxiv.org/abs/2505.00039
- **LRMoo temporal modeling** — https://arxiv.org/abs/2506.07853

## Scope

SAT-Graph is **domain-neutral**. The core API models:

- stable, atemporal `Item` anchors;
- temporal `Version` states;
- reified `Action` events;
- `TextUnit` textual representations;
- `Theme` and `ItemType` taxonomies;
- typed `Relation` links.

Legal information is the motivating and primary **reference domain** used in the research and examples. Legal values such as URN LEX identifiers, statutory/interpretive Version types, or canonical/ratio/holding TextUnit aspects are examples of deployment conventions, not universal core restrictions.

The API specifies query and retrieval semantics. Parsing, ingestion, persistence, indexing technology, agent orchestration, logging, and audit-trail preservation are implementation or consumer responsibilities. See [Scope and Boundaries](docs/SCOPE.md).

## Architectural model

The API separates two kinds of operations:

1. **Ranked discovery** — natural-language reference resolution and semantic/lexical search return ranked candidates.
2. **Deterministic graph operations** — after an identifier or explicit scope is known, temporal resolution, structural navigation, direct fetch, causal traversal, and batch retrieval operate on formal graph objects.

This separation supports probability isolation: probabilistic discovery helps locate candidate anchors, while formal graph primitives perform the temporal, structural, and causal work once the relevant identifiers are known.

## Core design principles

- **Domain-neutral contract, concrete examples.** Core semantics are generic; deployments define vocabularies and domain conventions.
- **Composability.** Small primitives can be chained into more complex retrieval plans.
- **Explicit temporal semantics.** Valid time and, where exposed, transaction-time perspective are distinct.
- **Stored structural state.** Version navigation traverses relationships recorded for a Version; the API does not prescribe ingestion or propagation rules.
- **Ranked search is not enumeration.** Exhaustive inspection requires explicit scope enumeration followed by deterministic retrieval.
- **Verifiability support.** Structured outputs allow consumers to construct reproducible and auditable workflows; the API itself does not prescribe logging policy.

## Deployment-defined vocabularies

Some fields are intentionally open rather than closed enums. Deployments expose their supported values through structured introspection:

- `GET /meta/action-types` — `getSupportedActionTypes`
- `GET /meta/version-types` — `getSupportedVersionTypes`
- `GET /meta/text-unit-aspects` — `getSupportedTextUnitAspects`
- `GET /meta/relation-predicates` — `getSupportedRelationPredicates`

Each vocabulary entry contains `value`, `label`, and `description`.

`GET /meta/implementation-guide` provides broader deployment conventions that are useful to clients and agents but are not part of the core semantics.

## Important retrieval semantics

### TextUnit aspects

`TextUnit.aspect` is deployment-defined. If an endpoint's optional `aspects` filter is omitted, all available aspects are considered or returned according to that operation's contract. A legal deployment may define aspects such as `canonical`, `summary`, `ratio`, `facts`, or `holding`.

### Temporal structure

`Item` navigation is canonical and atemporal. Historical structural states are represented through Version-level relationships.

- `GET /versions/{versionId}/children` traverses the stored children of a Version state.
- `GET /versions/{versionId}/parents?at=...` may use `at` because the same child Version can be reused under different parent Versions over time.

### Text retrieval

For `GET /versions/{versionId}/text-units`:

- nonexistent Version → `404`;
- existing Version with no TextUnits satisfying optional filters → `200 []`.

For batch retrieval, deployments may document how unresolved requested Version IDs are handled, particularly where partial batch results are possible.

## Authentication profile

Authentication is not part of the SAT-Graph graph model. This OpenAPI profile uses API-key authentication through the `Authorization` header. Other deployments may adopt different security mechanisms while preserving the same SAT-Graph retrieval semantics.

## Documentation

- [OpenAPI specification](specification/openapi.yaml)
- [Technical specification guide](specification/README.md)
- [Scope and Boundaries](docs/SCOPE.md)
- [Primitive Categories](docs/ACTION_CATEGORIES.md)
- [Getting Started](docs/getting-started.md)
- [Error Handling](docs/ERROR_HANDLING.md)
- [Metadata Best Practices](docs/METADATA_BEST_PRACTICES.md)
- [Examples](docs/examples/)

## Bundling and validation

The specification is split across multiple YAML files. To produce the generated single-file bundle:

```bash
cd specification
npm install
npm run bundle
```

Do not edit `openapi-bundled.yaml` manually; it is generated from the source files.

Validation:

```bash
cd specification
npm run validate
npm run validate-bundled
```

## Client generation

The OpenAPI specification can be used with standard client generators, for example:

```bash
openapi-generator-cli generate \
  -i specification/openapi.yaml \
  -g python \
  -o ./generated-client/python
```

## License

MIT. See [LICENSE](LICENSE).
