/**
 * Test script for single URL extraction
 */

import { runScraper } from '../src/main.js';
import { getEnvironmentConfig } from '../src/utils/validation.js';
import type { ScraperConfig } from '../src/types/index.js';

async function testSingleUrl(): Promise<void> {
  const env = getEnvironmentConfig();

  const config: ScraperConfig = {
    url: 'https://www.neptunecigar.com/cigars/highclere-castle-petite-corona',
    browserEndpoint: env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT,
    processOptions: {
      useMarkdown: true,
      cleanHTMLOptions: {
        removeScripts: true,
        removeStyles: false,
        removeAds: true,
        removeHiddenElements: true,
        removeInlineHandlers: true,
        removeInlineStyles: false,
        removeSrcAttributes: true,
        removeHrefAttributes: true,
        removeIframes: true,
        removeHeaderLayout: true,
        removeFooterLayout: true,
        removeBase64: true,
        base64Threshold: 50,
        removeSchemaMarkup: false,
        removeOGMarkup: true,
        removeTwitterMarkup: true,
        removeJSONLDMarkup: false,
      },
    },
    extractionConfig: {
      strategy: 'markdown-with-image',
      model: 'gpt-4o-2024-08-06',
      maxTokens: 4096,
      temperature: 0,
    },
    outputDir: 'data',
  };

  try {
    console.log('Testing single URL extraction...');
    const result = await runScraper(config);
    console.log('✅ Single URL test completed successfully!');
    console.log(`📁 Results: ${result.outputPath}`);
    console.log(`📊 Extracted data:`, JSON.stringify(result.extractedData, null, 2));
  } catch (error) {
    console.error('❌ Single URL test failed:', error);
    process.exit(1);
  }
}

testSingleUrl();
