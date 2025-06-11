/**
 * Validation and utility functions
 *
 * This module provides environment validation, path utilities,
 * and other helper functions used throughout the application.
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import type { EnvironmentConfig, ErrorDetails } from '../types/index.js';

// Load environment variables
dotenv.config();

/**
 * Check if required environment variables are present
 * @param requiredVars - List of required environment variable names
 * @throws Error if any required variables are missing
 */
export function checkEnvVars(requiredVars: string[]): void {
  const missing = requiredVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Get validated environment configuration
 * @returns Validated environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  checkEnvVars(['BRIGHT_DATA_BROWSER_WSE_ENDPOINT', 'OPENAI_API_KEY']);

  return {
    BRIGHT_DATA_BROWSER_WSE_ENDPOINT: process.env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  };
}

/**
 * Generate a clean folder path from a URL
 * @param url - The URL to convert to a path
 * @param folderPrefix - Optional prefix for the folder structure
 * @returns Clean folder path
 */
export function getPathFromUrl(url: string, folderPrefix = 'data'): string {
  const parsedUrl = new URL(url);

  // Create hostname-based folder
  const hostname = parsedUrl.hostname.replace(/\W+/g, '_');

  // Create pathname-based folder
  let pathname = parsedUrl.pathname
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/^\//, '') // Remove leading slash
    .replace(/\//g, '_') // Replace slashes with underscores
    .replace(/\W+/g, '_') // Replace non-alphanumeric with underscores
    .toLowerCase();

  // Ensure pathname doesn't start or end with underscores
  pathname = pathname.replace(/^_+|_+$/g, '');

  // Use current working directory as root
  const rootPath = process.cwd();

  return path.join(rootPath, folderPrefix, hostname, pathname);
}

/**
 * Ensure a directory path exists, creating it if necessary
 * @param dirPath - Directory path to ensure exists
 */
export function ensurePathExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Format byte size into human-readable format
 * @param bytes - Number of bytes
 * @returns Human-readable size string
 */
export function formatByteSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2);

  return `${formattedSize} ${sizes[i]}`;
}

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Extract detailed error information
 * @param error - Error object or unknown type
 * @returns Formatted error details
 */
export function getErrorDetails(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      context: {},
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      context: {},
    };
  }

  return {
    message: 'Unknown error occurred',
    context: { originalError: error },
  };
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename by removing invalid characters
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Create a timestamped filename
 * @param baseName - Base filename
 * @param extension - File extension
 * @returns Timestamped filename
 */
export function createTimestampedFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${baseName}_${timestamp}.${extension}`;
}
