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
