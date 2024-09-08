import { processHTML } from './htmlProcessor.js';
import { getErrorDetails, scrape } from './scrape.js';
import { checkEnvVars } from './utils.js';

// Check required environment variables
checkEnvVars(['BRIGHT_DATA_BROWSER_WSE_ENDPOINT']);

const browserWSEndpoint = process.env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT;
// const targetUrl = 'https://geo.brdtest.com/mygeo.json';
const targetUrl = 'https://www.neptunecigar.com/cigars/arturo-fuente-opus-x-angels-share-fuente-fuente';

const runScrapingProcess = async (): Promise<void> => {
  try {
    const rawHtml = await scrape({
      browserWSEndpoint,
      targetUrl,
      screenshot: true,
    });
    console.log('Scraped Data:', rawHtml);

    const { cleanedHTML, markdown } = processHTML(rawHtml, {
      cleanHTMLOptions: {
        scripts: true,
        styles: true,
        ads: true,
        hiddenElements: true,
        inlineHandlers: true,
        inlineStyles: true,
        srcAttributes: true,
        hrefAttributes: true,
        header: true,
        footer: true,
        iframes: true,
      },
      useMarkdown: true,
    });

    console.log('Processed HTML:', {
      cleanedHTML,
      markdown,
    });
  } catch (error) {
    console.error(
      getErrorDetails(error) || error.stack || error.message || error,
    );
    process.exit(1);
  }
};

runScrapingProcess();
