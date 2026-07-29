#!/usr/bin/env node

/**
 * Bundle the multi-file SAT-Graph OpenAPI document into one valid document.
 *
 * SwaggerParser preserves shared and circular references while replacing
 * external file references with local references. A hand-written recursive
 * inliner cannot safely do that because the same schema is legitimately
 * referenced from many paths.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const SwaggerParser = require('@apidevtools/swagger-parser');

function writeYaml(filePath, data) {
  const content = yaml.dump(data, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
  fs.writeFileSync(filePath, content, 'utf8');
}

async function bundleSpec() {
  const specPath = path.join(__dirname, 'openapi.yaml');
  const outputPath = path.join(__dirname, 'openapi-bundled.yaml');

  console.log('Bundling OpenAPI specification...');
  const bundled = await SwaggerParser.bundle(specPath);
  writeYaml(outputPath, bundled);
  console.log(`Bundled specification written to: ${outputPath}`);
}

bundleSpec().catch((error) => {
  console.error('Failed to bundle the OpenAPI specification:', error.message);
  process.exit(1);
});
