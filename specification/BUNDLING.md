# OpenAPI Specification Bundling

This directory contains a multi-file OpenAPI specification that uses `$ref` to reference external files for better organization and maintainability.

## Problem

The **Swagger Editor** (online version at https://editor.swagger.io/) and some other OpenAPI tools cannot resolve external file references. When you paste the `openapi.yaml` file directly, you'll see errors like:

```
$ref paths must begin with `#/`
Could not resolve reference: undefined undefined
```

## Solution

We provide a bundling script that consolidates all external references into a single `openapi-bundled.yaml` file that can be used with Swagger Editor and other tools.

## Usage

### Option 1: Using the Bundling Script (Recommended)

1. **Install dependencies:**
   ```bash
   cd specification
   npm install
   ```

2. **Generate the bundled specification:**
   ```bash
   npm run bundle
   ```

   This creates `openapi-bundled.yaml` in the `specification/` directory.

3. **Use the bundled file:**
   - Upload `openapi-bundled.yaml` to [Swagger Editor](https://editor.swagger.io/)
   - Or use it with any OpenAPI tool that doesn't support external references

### Option 2: Using OpenAPI Generator CLI

If you have `openapi-generator-cli` installed globally, you can use it to validate and bundle:

```bash
openapi-generator-cli validate -i openapi.yaml
```

### Option 3: Using Swagger CLI

The package.json includes swagger-cli for validation:

```bash
npm run validate        # Validates the multi-file spec
npm run validate-bundled  # Validates the bundled spec
```

## Files

- **`openapi.yaml`** - Main specification file with external references (multi-file format)
- **`bundle-spec.js`** - Node.js script that bundles all files into one
- **`package.json`** - npm configuration with bundling scripts
- **`openapi-bundled.yaml`** - Generated single-file specification (gitignored)

## For Development

When working on the specification:

1. **Edit the multi-file structure** (openapi.yaml and files in paths/, schemas/)
2. **Run the bundler** to regenerate the single-file version
3. **Test both versions** to ensure consistency

## Note on Git

The bundled file (`openapi-bundled.yaml`) is **not committed to the repository** since it's a generated artifact. This keeps the repository clean and avoids synchronization issues.

**To obtain the bundled file:**
- Run the bundling script locally (see instructions above)
- Download from GitHub Releases (automatically generated for each release)
- Use the GitHub Action workflow (see `.github/workflows/bundle-openapi.yml`)

## Alternative Tools

If you prefer GUI tools that support multi-file specs:

- **[Stoplight Studio](https://stoplight.io/studio/)** - Desktop app with full multi-file support
- **[VS Code OpenAPI Extension](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi)** - Supports $ref resolution
- **[Redocly CLI](https://redocly.com/docs/cli/)** - Command-line tool with bundling: `redocly bundle openapi.yaml`
