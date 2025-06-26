# TODO

- create file saving functions for each module. E.g. processHTML will export saveProcessedHTML function that will use fileManager and will do all data checking and looping. Potentially just merge file saving functionality with the core module? The main goal is to remove all this bloat from main.ts. 
- Update extraction schema to be an array of object + other todo. The goal is to be more generic.
- Update extraction module so that it can take processHTML response and automatically convert images and construction messages.

Priority:

- Try having a hardcoded config of a website - container selectors with required information. It will be used by HTML/markdown and screenshot functionality.
  - implement puppeteer screnshots per selector
  - fix logic to save multiple chunks of extracted text and images
  - use fileManager in scrape and other tasks to manage file name!!! 
    - potentify add more methods to fileManager
    - Replace `saveExtractedData` and `getPathFromUrl`
      + update processHTML to make use of scrape return data
    !!!-do not pass fileManager as a prop in other functions. Initialize it and import in files
    !!!- convert selectors array to an object with human redable name and description
    !!!-html cleanup for chunks needs to include removal of social media buttons/shares
- Come up with a list of all fields and their descriptions.
  - collect list of websites
- come up with various prompts
- Come up with golden data
- How to benchmark scraped json objects?
- add debug statements in the AI prompt. E.g. print JSON after every chunk and return array with JSON objects? Potentially disable structured output

0. add real DB to the stack
1. use brightdata remote browser
2. try a few different options
  - submit generically clean html in chunks to the text model
  - submit preparsed html to the text model (maybe need to chunk it)
  - submit screenshots to the image model
  - do not use model at all, just use regex and cheerio
3. consider batching API https://platform.openai.com/docs/api-reference/batch
4. Read
  - https://platform.openai.com/docs/guides/fine-tuning
5. Block ad URLs in brightdata
```
  // connect to a remote browser...
  const urls = ['*doubleclick.net*'];
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.setBlockedURLs', {urls});
  await page.goto('https://washingtonpost.com');
```
6. Return proxy info as a part of the scrape. GET 'https://geo.brdtest.com/mygeo.json'
7. add check that you recieved back valid html
8. markup remove everything that looks like base64 encoded values
  - wEPDwUJNjgxNTQ2ODIwD2QWAmYPZBYCAgMPFgIeB2VuY3R5cGUFE211bHRpcGFydC9mb3JtLWRhdGEWFgIBDxYCHglpbm5lcmh0bWwFATBkAgIPFgIfAQUMIGl0ZW07ICQwLjAwZAIEDxYCHwEFTTxkaXYgY2xhc3M9J2VtcHR5Q2FydCcgc3R5bGU9J21hcmdpbjowcHg7Jz5Zb3VyIHNob3BwaW5nIGNhcnQgaXMgZW1wdHkuPC9kaXY+ZAIIDxYCHgRUZXh0BWhXZWxjb21lISA8YSBocmVmPScvbG9naW4/cmV0dXJuVXJsPS9jaWdhcnMvYXJ0dXJvLWZ1ZW50ZS1vcHVzLXgtYW5nZWxzLXNoYXJlLWZ1ZW50ZS1mdWVudGUnPlNpZ24gSW4hPC9hPmQCCg8WAh8BBfXfCDx1bCBpZD0nY29sdW1uMSc+PGxpIGNsYXNzPSdjbGFzc0NhdCc+PGEgaHJlZj0nLzE1MDItY2lnYXInPjE1MDI8L2E+PC9saT48bGkgY2xhc3M9J2NsYXNzSXRlbSc
9. add this for loggin tokens https://github.com/niieani/gpt-tokenizer
10. reuse the same openai instance across all calls
11. Calculate tokens post request and convert it to $. rather than trying to precalculate it.
- Move to Python
- Add a log showing IP address of the proxy 
- Try having a hardcoded config of a website - container selectors with required information. It will be used by HTML/markdown and screenshot functionality.
- How to benchmark scraped json objects?
- Use DOM purify or other sanitation tool
- Calculate cost post request. Grab token count from response.
- Come up with some abstraction for a scrape request lifecycle. Classify errors. Update statuses and stages (html extract, sanitization, cleanup, markdown, save etc)
- add task to extract all images maybe based on some selector queries and make sure they are cigar images and save them them with description.
===
- start with parsing sitemap.xml and filtering URLs. You will need a full website scrape the first run and then some sort of effective refetch mechanism potentially relying on sitemap.xml lastmod property. 
- As a an improvement  to sitemap consider a recursive page-to-page parser to capture URLs that don’t exist in a browser.


## Done

- Try using Readability.js. Didn't work for product pages.
