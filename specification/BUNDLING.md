# OpenAPI Specification Bundling

This directory contains a multi-file OpenAPI specification that uses external `$ref` files for maintainability, plus a generated single-file bundle for consumers that require one document.

## Source of truth

The multi-file specification rooted at **`openapi.yaml`** is the authoritative source. **`openapi-bundled.yaml`** is generated from that source and must not be edited manually.

## Local workflow

1. Install dependencies:

```bash
cd specification
npm install
```

2. Validate the source specification:

```bash
npm run validate
```

3. Generate the bundle:

```bash
npm run bundle
```

4. Validate the generated bundle:

```bash
npm run validate-bundled
```

## Files

- **`openapi.yaml`** — authoritative multi-file OpenAPI specification.
- **`schemas/`** and **`paths/`** — referenced source files.
- **`bundle-spec.js`** — bundling script.
- **`package.json`** — validation and bundling commands.
- **`openapi-bundled.yaml`** — generated single-file specification committed for convenient consumption.

## Synchronization

Whenever the source specification changes, regenerate `openapi-bundled.yaml` before merging. CI validates the source, regenerates the bundle, validates it, and fails if the committed bundle differs from the generated result.

The release workflow also generates the bundle from the authoritative source and uploads it as a release asset.

## Consumers

Use `openapi.yaml` when your tooling supports external references. Use `openapi-bundled.yaml` when a single-file specification is required, for example by some Swagger/OpenAPI editors or client generators.
