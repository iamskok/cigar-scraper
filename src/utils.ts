import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Checks if required environment variables are present
 * @param requiredVars - List of required environment variables
 */
export const checkEnvVars = (requiredVars: string[]): void => {
  requiredVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is not defined.`);
    }
  });
};

// Types for the parameters used in functions
export type GetPathParams = {
  url: string;
  folderPrefix?: string;
  filename?: string;
};

/**
 * Function to generate a clean folder or file path from a URL.
 *
 * @param params - An object containing the parameters for path generation.
 * @returns The full folder path or file path if filename is provided.
 */
export const getPathFromUrl = ({
  url,
  folderPrefix = 'data',
  filename,
}: GetPathParams): string => {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.replace(/\W+/g, '_'); // Replace non-alphanumeric characters with underscores

  const pathname = parsedUrl.pathname
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/+/g, '-') // Replace slashes with a dash
    .replace(/\W+/g, '_') // Replace non-alphanumeric characters with underscores
    .replace(/^_+|_+$/g, '') // Ensure pathname doesn't start or end with underscores
    .toLowerCase(); // Ensure lowercase for consistency

  // Use process.cwd() to get the current working directory
  const rootPath = process.cwd();

  // Construct the full path: `${root}/[prefix]/${hostname}/${formatted_pathname}`
  let fullPath = path.join(rootPath, folderPrefix, hostname, pathname);

  // If a filename is provided, concatenate it to the path
  if (filename) {
    fullPath = path.join(fullPath, filename);
  }

  return fullPath;
};

/**
 * Function to ensure a directory or file path exists.
 *
 * @param filePath - The full path to the file or directory.
 */
export const ensurePathExists = (filePath: string): void => {
  try {
    const dirPath = path.extname(filePath) ? path.dirname(filePath) : filePath;

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    throw new Error(`Error creating path - "${filePath}": ${error.message}`);
  }
};

// /**
//  * Function to generate a file path, create the file if it doesn't exist, and return the file path as a string.
//  *
//  * @param params - An object containing the URL, folderPrefix, and filename.
//  * @returns The full file path.
//  */
// export const createFileIfNotExists = (params: GetPathParams): string => {
//   const filePath = getPathFromUrl(params);

//   // Ensure the path to the file exists
//   ensurePathExists(filePath);

//   // Create the file if it doesn't exist
//   if (!fs.existsSync(filePath)) {
//     fs.writeFileSync(filePath, '', 'utf-8'); // Create an empty file
//   }

//   return filePath;
// };
