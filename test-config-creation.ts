#!/usr/bin/env node

import { createExtractionConfig } from './src/config/extraction.js';

console.log('Testing extraction config creation...');

try {
  // Test default config creation
  const defaultConfig = createExtractionConfig();
  console.log('Default config:', JSON.stringify(defaultConfig, null, 2));

  // Test specific presets
  const fastConfig = createExtractionConfig('fast');
  console.log('Fast config:', JSON.stringify(fastConfig, null, 2));

} catch (error) {
  console.error('❌ Config creation failed:', error);
  process.exit(1);
}
