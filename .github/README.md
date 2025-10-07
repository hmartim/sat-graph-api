# GitHub Workflows

This directory contains GitHub Actions workflows for the SAT-Graph API project.

## Workflows

### Bundle OpenAPI Specification (`bundle-openapi.yml`)

Automatically generates a single-file bundled version of the OpenAPI specification.

**Triggers:**
- **On Release:** When a new release is published, the workflow automatically:
  1. Bundles the multi-file OpenAPI spec into `openapi-bundled.yaml`
  2. Uploads it as a release asset

- **Manual Trigger:** Can be run manually from the Actions tab
  - The bundled file is uploaded as an artifact (available for 30 days)

**Purpose:**
The multi-file OpenAPI specification uses external `$ref` references for better organization. However, tools like Swagger Editor (online) cannot resolve these external references. This workflow provides users with a ready-to-use single-file version.

**Usage for End Users:**
1. Go to the [Releases page](https://github.com/hmartim/sat-graph-api/releases)
2. Download `openapi-bundled.yaml` from the latest release
3. Upload to [Swagger Editor](https://editor.swagger.io/)

**Manual Trigger:**
1. Go to the [Actions tab](https://github.com/hmartim/sat-graph-api/actions)
2. Select "Bundle OpenAPI Specification"
3. Click "Run workflow"
4. Download the artifact from the workflow run

## Permissions

The workflows require the following permissions:
- `contents: write` - To upload release assets

These are granted automatically via the `GITHUB_TOKEN`.
