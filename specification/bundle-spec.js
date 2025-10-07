#!/usr/bin/env node

/**
 * Bundle OpenAPI Specification
 *
 * This script bundles the multi-file OpenAPI specification into a single file
 * that can be used with Swagger Editor online and other tools that don't support
 * external file references.
 *
 * Usage:
 *   node bundle-spec.js
 *
 * Output:
 *   openapi-bundled.yaml - Single-file OpenAPI specification
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Read and parse YAML file
function readYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

// Write YAML file
function writeYaml(filePath, data) {
  const content = yaml.dump(data, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });
  fs.writeFileSync(filePath, content, 'utf8');
}

// Resolve all $ref references recursively
function resolveRefs(obj, basePath, visited = new Set()) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => resolveRefs(item, basePath, visited));
  }

  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string' && value.startsWith('./')) {
      // External file reference
      const refPath = path.resolve(basePath, value.split('#')[0]);
      const fragment = value.includes('#') ? value.split('#')[1] : null;

      // Prevent circular references
      if (visited.has(refPath)) {
        console.warn(`Warning: Circular reference detected for ${refPath}`);
        result[key] = value;
        continue;
      }

      try {
        visited.add(refPath);
        const refContent = readYaml(refPath);
        const refBasePath = path.dirname(refPath);

        // Resolve nested refs in the referenced content
        const resolved = resolveRefs(refContent, refBasePath, new Set(visited));

        // If there's a fragment, navigate to it
        if (fragment) {
          // For now, we'll just inline the whole file
          // JSON Pointer resolution could be added here if needed
          return resolved;
        }

        return resolved;
      } catch (error) {
        console.error(`Error resolving reference ${value}:`, error.message);
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = resolveRefs(value, basePath, visited);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Main function
function bundleSpec() {
  const specPath = path.join(__dirname, 'openapi.yaml');
  const outputPath = path.join(__dirname, 'openapi-bundled.yaml');

  console.log('Reading OpenAPI specification...');
  const spec = readYaml(specPath);

  console.log('Resolving $ref references...');
  const bundled = resolveRefs(spec, __dirname);

  console.log('Writing bundled specification...');
  writeYaml(outputPath, bundled);

  console.log(`✓ Bundled specification written to: ${outputPath}`);
  console.log('\nYou can now upload openapi-bundled.yaml to Swagger Editor.');
}

// Check if js-yaml is available
try {
  require.resolve('js-yaml');
  bundleSpec();
} catch (error) {
  console.error('Error: js-yaml package is required.');
  console.error('Please install it with: npm install js-yaml');
  console.error('\nOr use the provided package.json:');
  console.error('  npm install');
  process.exit(1);
}
