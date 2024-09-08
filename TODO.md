# TODO

1. use brightdata remote browser
2. try a few different options
  - submit generically clean html in chunks to the text model
  - submit preparsed html to the text model (maybe need to chunk it)
  - submit screenshots to the image model
  - do not use model at all, just use regex and cheerio
3. consider batching API https://platform.openai.com/docs/api-reference/batch
4. Read
  - https://platform.openai.com/docs/guides/fine-tuning
5. Block ad URLs in brightdata https://brightdata.com/cp/zones/cigar_scraping_browser/playground?id=hl_c380abef
6. Return proxy info as a part of the scrape. GET 'https://geo.brdtest.com/mygeo.json'
7. add check that you reieved back valid html

I'm using Scraping browser and I ended up trying blocking endpoints feature. `const SBR_WS_ENDPOINT = `wss://${USER-country-us:PASS}@brd.superproxy.io:9222`;` this seems to work reliably.


Live browser debugging not working - https://docs.brightdata.com/scraping-automation/scraping-browser/configuration#view-live-browser-session
