# SAT-Graph API Examples

This directory contains practical examples demonstrating the power and flexibility of the SAT-Graph API for legal document retrieval and analysis.

## Example Structure

All examples are based on the research paper and demonstrate real-world legal analysis scenarios.

### Fundamental Patterns (§5.3.1)
- **[00-fundamental-patterns.md](./00-fundamental-patterns.md)** - Core patterns for agentic reasoning
  - Example 1: Point-in-Time Retrieval Plan
  - Example 2: Thematic Analysis with Server-Side Aggregation
  - Example 3: Robustness and Multilingual Fallback

### Complete Use Cases (§5.4)
- **[01-point-in-time-comparison.md](./01-point-in-time-comparison.md)** - Use Case 1: Causal pinpointing of constitutional amendments
- **[02-causal-lineage-tracing.md](./02-causal-lineage-tracing.md)** - Use Case 2: Legal audit with parallel task execution
- **[03-hierarchical-impact-summarization.md](./03-hierarchical-impact-summarization.md)** - Use Case 3: Hierarchical legislative change analysis
- **[04-structural-normative-predecessors.md](./04-structural-normative-predecessors.md)** - Use Case 4: Dual-path disambiguation for legal succession
- **[05-thematic-legal-scope-discovery.md](./05-thematic-legal-scope-discovery.md)** - Use Case 5: Multi-document legal scope discovery via structural navigation
- **[06-cascading-impact-analysis-social-rights.md](./06-cascading-impact-analysis-social-rights.md)** - Use Case 6: Cascading impact analysis - temporal evolution of social rights

## Getting Started

1. Set up your environment:
```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

2. Start with [Fundamental Patterns](./00-fundamental-patterns.md) to understand core concepts

3. Explore complete use cases to see real-world applications

## Key Principles

All examples demonstrate:
- ✅ **Composability** - Atomic actions combine into complex workflows
- ✅ **Determinism** - Guaranteed results after initial grounding  
- ✅ **Auditability** - Complete trail of IDs and structured data
- ✅ **Efficiency** - Server-side aggregation and batch operations

## Additional Resources

- [Getting Started Guide](../getting-started.md)
- [API Reference](../api-reference.md)
- [OpenAPI Specification](../../specification/openapi.yaml)

---

*These examples showcase capabilities impossible for standard RAG systems.*
