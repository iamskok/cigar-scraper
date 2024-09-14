import path from 'node:path';
import fs from 'node:fs';
import { ProcessHTMLResult } from './htmlProcessor.js';
import { ensurePathExists, getPathFromUrl } from './utils.js';

// /**
//  * Function to convert a URL into a clean folder name.
//  *
//  * @param url - The URL of the page being processed.
//  * @param folderPrefix - (Optional) A folder prefix or different folder to store the data.
//  * @returns The full folder path where data will be saved.
//  */
// const getFolderPathFromUrl = (url: string, folderPrefix = 'data'): string => {
//   const parsedUrl = new URL(url);
//   const hostname = parsedUrl.hostname.replace(/\W+/g, '_'); // Replace non-alphanumeric characters with underscores

//   // Create a clean, human-readable pathname by replacing slashes with a symbol and ensuring no leading/trailing underscores
//   let pathname = parsedUrl.pathname
//     .replace(/\/$/, '') // Remove trailing slash
//     .replace(/^\//, '') // Remove leading slash
//     .replace(/\/+/g, '-') // Replace slashes with a dash
//     .replace(/\W+/g, '_') // Replace non-alphanumeric characters with underscores
//     .toLowerCase(); // Ensure lowercase for consistency

//   // Ensure pathname doesn't start or end with underscores
//   pathname = pathname.replace(/^_+|_+$/g, '');

//   // Use process.cwd() to get the current working directory
//   const rootPath = process.cwd();

//   // Construct the full path: `${root}/[prefix]/${hostname}/${formatted_pathname}`
//   return path.join(rootPath, folderPrefix, hostname, pathname);
// };

/**
 * Function to save raw HTML, cleaned HTML, and Markdown to files inside a folder based on the URL.
 *
 * @param content - The content from the processHTML function containing rawInput, cleanedHTML, and markdown.
 * @param url - The URL of the page being processed.
 * @param folderPrefix - (Optional) The base folder to store the data.
 */
export const saveProcessedHTMLToFiles = (content: ProcessHTMLResult, url: string, folderPrefix?: string): void => {
  console.log('Saving processed HTML to files...');
  const folderPath = getPathFromUrl({ url, folderPrefix });
  ensurePathExists(folderPath);

  // Ensure the folder path exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Save raw HTML to a file
  const rawHtmlPath = path.join(folderPath, 'raw.html');
  fs.writeFileSync(rawHtmlPath, content.rawHtml, 'utf-8');
  console.log(`Saved raw HTML to file: ${rawHtmlPath}`);

  // Save cleaned HTML to a file
  const cleanedHtmlPath = path.join(folderPath, 'cleaned.html');
  fs.writeFileSync(cleanedHtmlPath, content.cleanedHTML, 'utf-8');
  console.log(`Saved cleaned HTML to file: ${cleanedHtmlPath}`);

  // Save markdown to a file if available
  if (content.markdown) {
    const markdownPath = path.join(folderPath, 'content.md');
    fs.writeFileSync(markdownPath, content.markdown, 'utf-8');
    console.log(`Saved markdown to file: ${markdownPath}`);
  }

  // Save sizes as JSON
  const sizesPath = path.join(folderPath, 'sizes.json');
  fs.writeFileSync(sizesPath, JSON.stringify(content.sizes), 'utf-8');
  console.log(`Saved sizes to file: ${sizesPath}`);
};

export type SaveExtractedDataParams = {
  content: string;
  type: 'text' | 'image' | 'multi';
  model: string;
  url: string;
  folderPrefix?: string;
};

/**
 * Function to save extracted data from text or image as a JSON file.
 * The file is saved with the name `extracted-<text|image>-<model>.json`.
 *
 * @param params - Object containing parameters like content, type, model, url, and folderPrefix.
 */
export const saveExtractedData = ({
  content,
  type,
  model,
  url,
  folderPrefix = 'data',
}: SaveExtractedDataParams): void => {
  console.log(`Saving extracted data to file for model ${model}...`);

  // Check if content is valid JSON
  try {
    JSON.parse(content);
  } catch (error) {
    console.error(`Invalid JSON content for model ${model}:`, error);
    throw new Error(`Invalid JSON content: ${error.message}`);
  }

  // Use the getPathFromUrl function to construct the file path
  const filePath = getPathFromUrl({
    url,
    folderPrefix,
    filename: `extracted-${type}-${model}.json`,
  });

  // Ensure that the folder path exists
  const folderPath = path.dirname(filePath);
  ensurePathExists(folderPath);

  // Save the content as a JSON file
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Saved extracted data to file: ${filePath}`);
};
