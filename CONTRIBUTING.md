# Contributing to SAT-Graph API

Thank you for your interest in contributing to the SAT-Graph API specification! This document provides guidelines for contributing to this OpenAPI specification project.

## 🎯 Types of Contributions

We welcome the following types of contributions:

### 1. **Specification Improvements**
- Fixing inconsistencies or errors in the OpenAPI spec
- Improving endpoint descriptions and documentation
- Adding examples to request/response schemas
- Clarifying parameter descriptions

### 2. **Documentation Enhancements**
- Improving README files
- Adding use case examples
- Enhancing API reference documentation
- Fixing typos and grammatical errors

### 3. **Schema Refinements**
- Proposing new schemas for common patterns
- Suggesting improvements to existing data models
- Adding validation rules and constraints

### 4. **Bug Reports**
- Reporting errors in the specification
- Identifying broken references or invalid schemas
- Highlighting inconsistencies between documentation and spec

## 📝 Contribution Process

### Step 1: Check Existing Issues
Before creating a new issue or pull request, please check if a similar one already exists.

### Step 2: Fork and Create a Branch
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sat-graph-api.git
cd sat-graph-api

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Step 3: Make Your Changes
- Follow the existing code/documentation style
- Ensure all YAML files are properly formatted
- Update relevant documentation

### Step 4: Validate Your Changes
Before submitting, validate the OpenAPI specification:

```bash
# Using Redocly CLI
npx @redocly/cli lint specification/openapi.yaml

# Using Spectral
npx @stoplight/spectral-cli lint specification/openapi.yaml
```

### Step 5: Commit Your Changes
Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add example for searchTextUnits endpoint"
```

**Commit Message Format:**
- `feat:` - New feature or enhancement
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code restructuring without behavior change
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Step 6: Submit a Pull Request
1. Push your branch to your fork
2. Create a Pull Request against the `main` branch
3. Provide a clear description of your changes
4. Link any related issues

## 🏗️ Specification Structure

Understanding the project structure will help you contribute effectively:

```
sat-graph-api/
├── specification/
│   ├── openapi.yaml           # Main spec file
│   ├── schemas/               # Data model definitions
│   │   ├── common/           # Shared schemas
│   │   ├── core/             # Primitive types
│   │   ├── entities/         # Domain models
│   │   ├── relationships/    # Graph relationships
│   │   ├── requests/         # Request schemas
│   │   └── responses/        # Response schemas
│   └── paths/                # Endpoint definitions
│       ├── discovery/
│       ├── deterministic-fetch/
│       ├── navigation/
│       ├── graph-traversal/
│       ├── causal-analysis/
│       ├── aggregate-analysis/
│       └── introspection/
├── docs/                     # Additional documentation
└── README.md                 # Project overview
```

## 🎨 Style Guidelines

### OpenAPI YAML Files
- Use 2-space indentation
- Keep lines under 100 characters when possible
- Use descriptive `operationId` values (camelCase)
- Always include `description` fields
- Provide examples for complex schemas

### Schema Naming Conventions
- **Files:** `kebab-case` (e.g., `get-item-by-id.yaml`)
- **Schemas:** `PascalCase` (e.g., `SearchItemsRequest`)
- **Properties:** `snake_case` (e.g., `item_id`, `version_ids`)
- **Operation IDs:** `camelCase` (e.g., `searchItems`, `getValidVersion`)

### Documentation
- Use clear, concise language
- Provide code examples where helpful
- Include links to related documentation
- Use proper Markdown formatting

## 🔍 What We Look For in PRs

### ✅ Good Pull Requests Include:
- Clear description of the problem being solved
- Reference to related issues (if applicable)
- Updated documentation if behavior changes
- Validation that the spec is still valid
- Examples demonstrating new functionality

### ❌ Please Avoid:
- Large, unfocused PRs that change many things
- Breaking changes without discussion
- Undocumented changes
- Changes that violate the canonical model (see spec README)

## 📘 Understanding the API Architecture

This specification implements a **two-layer architecture**:

1. **Canonical Core API** - Based on the research paper
   - Minimal, composable primitives
   - Fully deterministic retrieval
   - Changes require careful consideration

2. **Extended API** - Production enhancements
   - Relation system for cross-document analysis
   - Convenience operations
   - More flexible for additions

When contributing, please identify which layer your changes affect and justify accordingly.

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Location** in the spec (file and line number)
3. **Expected behavior** vs. actual behavior
4. **Suggested fix** (if you have one)

Use the bug report template when creating an issue.

## 💡 Proposing New Features

For new features or significant changes:

1. **Open an issue first** to discuss the proposal
2. Explain the **use case** and **value**
3. Consider **impact** on existing functionality
4. Be prepared to **implement** the change yourself

## 📜 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## 🙋 Questions?

If you have questions about contributing:

- Check the [specification README](./specification/README.md) for technical details
- Review existing issues and pull requests
- Open a discussion issue for general questions

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping improve the SAT-Graph API specification! 🎉
