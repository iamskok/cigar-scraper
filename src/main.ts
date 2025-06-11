/**
 * Main orchestration for the cigar scraper
 *
 * This is the entry point that coordinates all scraping operations:
 * 1. Environment validation
 * 2. Web scraping with screenshots
 * 3. Content processing and cleaning
 * 4. AI-powered data extraction
 * 5. Organized file storage
 */

import { scrape } from './core/scraper.js';
import { processContent } from './core/processor.js';
import { extractData, createExtractionSummary } from './core/extractor.js';
import { FileManager } from './utils/fileManager.js';
import { getEnvironmentConfig, isValidUrl, getErrorDetails } from './utils/validation.js';
import { createExtractionConfig, EXTRACTION_STRATEGIES } from './config/extraction.js';
import type { ScraperConfig, MultipleUrlResults } from './types/index.js';

/**
 * Main scraping orchestrator
 *
 * This function coordinates the entire scraping pipeline from web scraping
 * to final data extraction and storage. It provides comprehensive error
 * handling and detailed logging throughout the process.
 *
 * @param config - Comprehensive scraper configuration
 * @returns Promise resolving to extraction results with metadata
 */
export async function runScraper(config: ScraperConfig): Promise<{
  extractedData: unknown;
  metadata: Record<string, unknown>;
  outputPath: string;
}> {
  console.log('🚀 Starting Cigar Scraper v2.0');
  console.log('================================');

  // Ensure we're working with a single URL for this function
  const targetUrl = Array.isArray(config.url) ? config.url[0] : config.url;

  try {
    // Step 1: Validate environment and configuration
    // Ensures all required environment variables are present and config is valid
    console.log('\n📋 Validating configuration...');
    const env = getEnvironmentConfig();
    validateScraperConfig(config);

    console.log(`✅ Target URL: ${targetUrl}`);
    console.log(`✅ Browser endpoint configured`);

    // Step 2: Initialize file manager
    // Creates organized folder structure for storing all output files
    console.log('\n📁 Initializing file management...');
    const fileManager = new FileManager({
      targetUrl: targetUrl,
      baseDir: config.outputDir,
    });

    await fileManager.initializeFolderStructure();
    console.log(`✅ Output directory: ${fileManager.getOutputPath()}`);

    // Step 3: Web scraping
    // Uses Puppeteer with Bright Data to scrape the target URL and capture screenshot
    console.log('\n🌐 Starting web scraping...');
    const scrapeResult = await scrape({
      browserEndpoint: env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT,
      url: targetUrl,
    });

    console.log(`✅ Scraped ${scrapeResult.rawHtml.length} characters of HTML`);
    console.log(`✅ Screenshot captured: ${scrapeResult.screenshotPath}`);

    // Step 4: Process content
    // Cleans HTML and converts to markdown for optimal AI processing
    console.log('\n🧹 Processing HTML content...');
    const processedContent = processContent(
      scrapeResult.rawHtml,
      config.processOptions
    );

    console.log(`✅ Content processing completed`);
    console.log(`   • Raw HTML: ${processedContent.sizes.rawHtml.readable}`);
    console.log(`   • Cleaned HTML: ${processedContent.sizes.cleanedHtml.readable}`);
    console.log(`   • Markdown: ${processedContent.sizes.markdown.readable}`);

    // Step 5: Save intermediate files
    // Stores all processed formats for debugging and analysis
    console.log('\n💾 Saving processed files...');

    // Save original HTML for reference
    await fileManager.writeFile({
      content: processedContent.rawHtml,
      contentType: 'rawHtml',
    });

    // Save cleaned HTML (ads, scripts, etc. removed)
    await fileManager.writeFile({
      content: processedContent.cleanedHtml,
      contentType: 'cleanHtml',
    });

    // Save markdown conversion if available
    if (processedContent.markdown) {
      await fileManager.writeFile({
        content: processedContent.markdown,
        contentType: 'cleanMarkdown',
      });
    }

    // Save organized screenshot to permanent location
    const savedScreenshotPath = await fileManager.saveScreenshot(scrapeResult.screenshotPath);

    console.log(`✅ Intermediate files saved`);

    // Step 6: Extract data using AI
    // Uses configurable strategies to extract structured data via OpenAI
    console.log('\n🤖 Extracting data with AI...');
    const extractionConfig = createExtractionConfig(config.extractionConfig);

    console.log(`   • Strategy: ${extractionConfig.strategy}`);
    console.log(`   • Model: ${extractionConfig.model}`);
    console.log(`   • Description: ${EXTRACTION_STRATEGIES[extractionConfig.strategy]}`);

    // Perform AI extraction with selected strategy
    const extractedData = await extractData(
      processedContent,
      savedScreenshotPath,
      extractionConfig
    );

    console.log(`✅ Data extraction completed`);

    // Step 7: Save extracted data
    // Store the final structured data as JSON
    console.log('\n💾 Saving extracted data...');

    const extractedDataString = JSON.stringify(extractedData, null, 2);
    await fileManager.writeFile({
      content: extractedDataString,
      contentType: 'extractedData',
    });

    console.log(`✅ Extracted data saved`);

    // Step 8: Generate summary
    // Create human-readable summary of extraction results
    console.log('\n📊 Extraction Summary:');
    console.log('========================');
    const summary = createExtractionSummary(extractedData, extractionConfig);
    console.log(summary);

    // Step 9: Cleanup
    // Clean up temporary files and finalize session
    await fileManager.cleanup();

    console.log('\n🎉 Scraping completed successfully!');
    console.log(`📁 Results saved to: ${fileManager.getOutputPath()}`);

    return {
      extractedData,
      metadata: fileManager.getMetadata(),
      outputPath: fileManager.getOutputPath(),
    };

  } catch (error) {
    // Comprehensive error handling with detailed context
    const errorDetails = getErrorDetails(error);
    console.error('\n❌ Scraping failed:', errorDetails.message);
    console.error('Stack trace:', errorDetails.stack);
    throw error;
  }
}

/**
 * Process multiple URLs with comprehensive results tracking
 *
 * @param config - Configuration with array of URLs
 * @returns Promise resolving to results for all URLs
 */
export async function runMultipleScrapers(config: ScraperConfig): Promise<MultipleUrlResults> {
  const urls = Array.isArray(config.url) ? config.url : [config.url];
  const startTime = Date.now();

  console.log('🚀 Starting Cigar Scraper v2.0 - Multiple URLs');
  console.log('==============================================');
  console.log(`📊 Processing ${urls.length} URLs`);

  const results: MultipleUrlResults['results'] = [];
  let successful = 0;
  let failed = 0;

  for (const url of urls) {
    console.log(`\n🔄 Processing: ${url}`);
    console.log('-'.repeat(50));

    try {
      const singleConfig: ScraperConfig = {
        ...config,
        url: url, // Single URL for this iteration
      };

      const result = await runScraper(singleConfig);

      results.push({
        url,
        success: true,
        extractedData: result.extractedData,
        metadata: result.metadata,
        outputPath: result.outputPath,
      });

      successful++;
      console.log(`✅ Successfully processed: ${url}`);

    } catch (error) {
      const errorDetails = getErrorDetails(error);
      results.push({
        url,
        success: false,
        error: errorDetails.message,
      });

      failed++;
      console.error(`❌ Failed to process: ${url}`);
      console.error(`Error: ${errorDetails.message}`);
    }
  }

  const totalTime = Date.now() - startTime;

  console.log('\n📊 Processing Summary');
  console.log('====================');
  console.log(`Total URLs: ${urls.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Average Time: ${((totalTime / urls.length) / 1000).toFixed(2)}s per URL`);

  return {
    results,
    summary: {
      total: urls.length,
      successful,
      failed,
      totalTime,
    },
  };
}

/**
 * Validate scraper configuration
 *
 * Ensures all required configuration parameters are present and valid
 * before starting the scraping process.
 *
 * @param config - Configuration object to validate
 * @throws Error if configuration is invalid
 */
function validateScraperConfig(config: ScraperConfig): void {
  if (!config.url) {
    throw new Error('URL is required');
  }

  const urls = Array.isArray(config.url) ? config.url : [config.url];

  if (urls.length === 0) {
    throw new Error('At least one URL is required');
  }

  for (const url of urls) {
    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  if (!config.browserEndpoint) {
    throw new Error('Browser endpoint is required');
  }
}

/**
 * Main execution function
 *
 * Entry point when the file is run directly. Configures the scraper
 * with sensible defaults and executes the full pipeline.
 */
async function main(): Promise<void> {
  // Load environment variables first
  const env = getEnvironmentConfig();

  // Test URLs for different page types as requested
  const testUrls = [
    'https://www.neptunecigar.com/cigars/highclere-castle-petite-corona', // Single blend and size
    'https://www.neptunecigar.com/cigar/highclere-castle-edwardian',      // Same blend, different sizes
    'https://www.neptunecigar.com/search?text=foundation',                // Multiple different blends and sizes
    'https://www.neptunecigar.com/cigars',                               // Multiple different brands and their blends and sizes
  ];

  // Configuration for the scraping operation
  // These settings provide a good balance of accuracy and performance
  const config: ScraperConfig = {
    // Test multiple URLs
    url: testUrls,
    browserEndpoint: env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT, // Load from environment

    // Processing options for HTML cleaning and conversion
    processOptions: {
      useMarkdown: true, // Convert to markdown for better AI processing
      cleanHTMLOptions: {
        removeScripts: true,        // Remove JavaScript for cleaner content
        removeStyles: false,        // Keep styles for layout understanding
        removeAds: true,           // Remove advertisement content
        removeHiddenElements: true, // Remove invisible elements
        removeInlineHandlers: true, // Remove onclick handlers, etc.
        removeInlineStyles: false,  // Keep inline styles for layout
        removeSrcAttributes: true,  // Remove image sources to reduce noise
        removeHrefAttributes: true, // Remove links to focus on content
        removeIframes: true,       // Remove embedded content
        removeHeaderLayout: true,   // Remove navigation headers
        removeFooterLayout: true,   // Remove page footers
        removeBase64: true,        // Remove base64 encoded content
        base64Threshold: 50,       // Threshold for base64 detection
        removeSchemaMarkup: false,  // Keep structured data
        removeOGMarkup: true,      // Remove Open Graph tags
        removeTwitterMarkup: true, // Remove Twitter card tags
        removeJSONLDMarkup: false, // Keep JSON-LD structured data
      },
    },

    // AI extraction configuration
    extractionConfig: {
      strategy: 'markdown-with-image', // Best accuracy with visual context
      model: 'gpt-4o-2024-08-06',     // Latest GPT-4o with vision
      maxTokens: 4096,                // Sufficient for detailed extraction
      temperature: 0,                 // Deterministic responses
    },

    // Output directory for organized file storage
    outputDir: 'data',
  };

  try {
    // Execute the multi-URL scraping pipeline
    const results = await runMultipleScrapers(config);

    // Display final summary
    console.log('\n🎯 Final Results Summary');
    console.log('=======================');
    results.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.url}`);
      console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    process.exit(0);
  } catch (error) {
    // Handle fatal errors gracefully
    console.error('Fatal error:', getErrorDetails(error));
    process.exit(1);
  }
}

// Run if this file is executed directly
// This allows the file to be imported as a module or run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
