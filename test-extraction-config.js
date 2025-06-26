/**
 * Test extraction configuration to verify system prompt is included
 */

import { createExtractionConfig } from './src/config/extraction.js';

// Test default configuration
console.log('Testing default extraction configuration...');
const defaultConfig = createExtractionConfig();
console.log(`Strategy: ${defaultConfig.strategy}`);
console.log(`Model: ${defaultConfig.model}`);
console.log(`System prompt exists: ${!!defaultConfig.systemPrompt}`);
console.log(`System prompt length: ${defaultConfig.systemPrompt?.length || 0} characters`);

// Test with partial override
console.log('\nTesting extraction configuration with partial override...');
const partialConfig = createExtractionConfig(undefined, {
  strategy: 'markdown-with-image',
  temperature: 0.1
});
console.log(`Strategy: ${partialConfig.strategy}`);
console.log(`Temperature: ${partialConfig.temperature}`);
console.log(`System prompt exists: ${!!partialConfig.systemPrompt}`);
console.log(`System prompt length: ${partialConfig.systemPrompt?.length || 0} characters`);

console.log('\n✅ Extraction configuration test completed successfully!');
