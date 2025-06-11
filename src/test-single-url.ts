/**
 * Simple test script for single URL extraction
 */

import { runScraper } from './main.js';
import { getEnvironmentConfig } from './utils/validation.js';

async function testSingleUrl(): Promise<void> {
  const env = getEnvironmentConfig();

  const config = {
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
      strategy: 'markdown-with-image' as const,
      model: 'gpt-4o-2024-08-06',
      maxTokens: 4096,
      temperature: 0,
    },
    outputDir: 'data-test',
  };

  try {
    console.log('🧪 Testing single URL extraction...');
    const result = await runScraper(config);

    console.log('\n✅ Extraction completed!');
    console.log('📊 Extracted Data:');
    console.log(JSON.stringify(result.extractedData, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSingleUrl();
