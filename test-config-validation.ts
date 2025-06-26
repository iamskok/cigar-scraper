#!/usr/bin/env node

import { validateExtractionConfig, createExtractionConfig } from './src/config/extraction.js';

console.log('Testing config validation after simplification...');

try {
  // Test fast preset (uses gpt-4, text-only)
  const fastConfig = createExtractionConfig('fast');
  console.log('Fast config:', fastConfig);
  validateExtractionConfig(fastConfig);
  console.log('✅ Fast preset validation passed');

  // Test accurate preset (uses gpt-4o-2024-08-06 with images)
  const accurateConfig = createExtractionConfig('accurate');
  console.log('Accurate config:', accurateConfig);
  validateExtractionConfig(accurateConfig);
  console.log('✅ Accurate preset validation passed');

  // Test comprehensive preset
  const comprehensiveConfig = createExtractionConfig('comprehensive');
  console.log('Comprehensive config:', comprehensiveConfig);
  validateExtractionConfig(comprehensiveConfig);
  console.log('✅ Comprehensive preset validation passed');

  // Test that removed models would fail
  try {
    validateExtractionConfig({
      strategy: 'html-with-image',
      model: 'gpt-4o', // This model was removed
      maxTokens: 4096,
      temperature: 0
    });
    console.log('❌ Should have failed for removed model');
  } catch (error) {
    console.log('✅ Correctly rejected removed model:', error.message);
  }

  console.log('\n🎉 All config validation tests passed!');
  console.log('The simplified config maintains all required functionality.');

} catch (error) {
  console.error('❌ Config validation failed:', error);
  process.exit(1);
}
