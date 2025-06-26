/**
 * Environment and connection diagnostic script
 */

import { getEnvironmentConfig } from '../src/utils/validation.js';
import puppeteer from 'puppeteer-core';

async function diagnoseEnvironment(): Promise<void> {
  console.log('🔍 Diagnosing Environment and Connection...\n');

  // Step 1: Check environment variables
  console.log('1️⃣ Checking environment variables...');
  try {
    const env = getEnvironmentConfig();
    console.log('✅ OPENAI_API_KEY:', env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
    console.log('✅ BRIGHT_DATA_BROWSER_WSE_ENDPOINT:', env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT ? 'SET' : 'NOT SET');

    if (env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT) {
      console.log('   Endpoint starts with:', env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT.substring(0, 20) + '...');
    }
  } catch (error) {
    console.error('❌ Environment variable error:', error instanceof Error ? error.message : 'Unknown error');
    return;
  }

  // Step 2: Test browser connection
  console.log('\n2️⃣ Testing browser connection...');
  try {
    const env = getEnvironmentConfig();

    console.log('Attempting to connect to browser...');
    const browser = await puppeteer.connect({
      browserWSEndpoint: env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT,
    });

    console.log('✅ Browser connection successful');

    const page = await browser.newPage();
    console.log('✅ New page created');

    // Set timeouts
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    console.log('✅ Timeouts configured (60 seconds)');

    // Test simple navigation
    console.log('Testing navigation to example.com...');
    await page.goto('https://example.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('✅ Navigation test successful');

    const title = await page.title();
    console.log(`✅ Page title: "${title}"`);

    await page.close();
    await browser.disconnect();

    console.log('✅ Browser connection closed cleanly');

  } catch (error) {
    console.error('❌ Browser connection error:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('\n💡 Timeout Troubleshooting Tips:');
      console.log('   - Check if your Bright Data endpoint is active');
      console.log('   - Verify your Bright Data subscription is valid');
      console.log('   - Try increasing timeout values');
      console.log('   - Check your network connection');
    }
    return;
  }

  console.log('\n✅ All diagnostics passed! Environment is ready.');
}

// Run diagnostics
diagnoseEnvironment().catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
