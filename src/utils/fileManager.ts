/**
 * File management utility for organized data storage
 *
 * This module handles all file operations for the scraper,
 * providing organized storage with proper folder structure.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { FileManagerConfig, WriteFileParams, ContentType } from '../types/index.js';
import {
  getPathFromUrl,
  ensurePathExists,
  generateUUID,
  sanitizeFilename,
  getErrorDetails
} from './validation.js';

/**
 * File manager for organizing scraped data
 */
export class FileManager {
  private readonly targetUrl: string;
  private readonly baseDir: string;
  private readonly uuid: string;
  private readonly folderPath: string;
  private readonly metadata: {
    targetUrl: string;
    uuid: string;
    createdFiles: Array<{
      filePath: string;
      contentType: ContentType;
      timestamp: string;
    }>;
  };

  constructor(config: FileManagerConfig) {
    this.targetUrl = config.targetUrl;
    this.baseDir = config.baseDir || 'data';
    this.uuid = generateUUID();

    // Create organized folder structure
    const urlPath = getPathFromUrl(this.targetUrl, this.baseDir);
    this.folderPath = path.join(urlPath, this.uuid);

    this.metadata = {
      targetUrl: this.targetUrl,
      uuid: this.uuid,
      createdFiles: [],
    };
  }

  /**
   * Initialize the folder structure for storing files
   */
  async initializeFolderStructure(): Promise<void> {
    try {
      // Create main folder and subfolders
      const subfolders = [
        'rawHtml',
        'cleanHtml',
        'rawMarkdown',
        'cleanMarkdown',
        'extractedData',
        'screenshots',
      ];

      ensurePathExists(this.folderPath);

      for (const subfolder of subfolders) {
        const subfolderPath = path.join(this.folderPath, subfolder);
        ensurePathExists(subfolderPath);
      }

      console.log(`Initialized folder structure at: ${this.folderPath}`);
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      throw new Error(`Failed to initialize folder structure: ${errorDetails.message}`);
    }
  }

  /**
   * Write content to a file with proper organization
   */
  async writeFile(params: WriteFileParams): Promise<string> {
    try {
      const { content, contentType, suffix = '' } = params;

      // Determine file path and extension
      const { fileName, subfolder } = this.getFileDetails(contentType, suffix);
      const fullPath = path.join(this.folderPath, subfolder, fileName);

      // Ensure parent directory exists
      ensurePathExists(path.dirname(fullPath));

      // Write file
      await fs.promises.writeFile(fullPath, content, 'utf-8');

      // Update metadata
      this.metadata.createdFiles.push({
        filePath: fullPath,
        contentType,
        timestamp: new Date().toISOString(),
      });

      // Save updated metadata
      await this.saveMetadata();

      console.log(`Saved ${contentType} to: ${fullPath}`);
      return fullPath;

    } catch (error) {
      const errorDetails = getErrorDetails(error);
      throw new Error(`Failed to write file: ${errorDetails.message}`);
    }
  }

  /**
   * Save screenshot file
   */
  async saveScreenshot(screenshotPath: string): Promise<string> {
    try {
      const screenshotDir = path.join(this.folderPath, 'screenshots');
      ensurePathExists(screenshotDir);

      const fileName = `screenshot_${Date.now()}.png`;
      const destPath = path.join(screenshotDir, fileName);

      // Copy screenshot to organized location
      await fs.promises.copyFile(screenshotPath, destPath);

      // Update metadata
      this.metadata.createdFiles.push({
        filePath: destPath,
        contentType: 'screenshot',
        timestamp: new Date().toISOString(),
      });

      await this.saveMetadata();

      console.log(`Saved screenshot to: ${destPath}`);
      return destPath;

    } catch (error) {
      const errorDetails = getErrorDetails(error);
      throw new Error(`Failed to save screenshot: ${errorDetails.message}`);
    }
  }

  /**
   * Get the main output folder path
   */
  getOutputPath(): string {
    return this.folderPath;
  }

  /**
   * Get metadata about processed files
   */
  getMetadata(): typeof this.metadata {
    return { ...this.metadata };
  }

  /**
   * Save metadata file
   */
  private async saveMetadata(): Promise<void> {
    const metadataPath = path.join(this.folderPath, 'metadata.json');
    const metadataContent = JSON.stringify(this.metadata, null, 2);
    await fs.promises.writeFile(metadataPath, metadataContent, 'utf-8');
  }

  /**
   * Get file details based on content type
   */
  private getFileDetails(contentType: ContentType, suffix: string): { fileName: string; subfolder: string } {
    const timestamp = Date.now();
    const suffixPart = suffix ? `_${sanitizeFilename(suffix)}` : '';

    switch (contentType) {
      case 'rawHtml':
        return {
          fileName: `rawhtml${suffixPart}.html`,
          subfolder: 'rawHtml',
        };

      case 'cleanHtml':
        return {
          fileName: `cleanhtml${suffixPart}.html`,
          subfolder: 'cleanHtml',
        };

      case 'rawMarkdown':
        return {
          fileName: `rawmarkdown${suffixPart}.md`,
          subfolder: 'rawMarkdown',
        };

      case 'cleanMarkdown':
        return {
          fileName: `cleanmarkdown${suffixPart}.md`,
          subfolder: 'cleanMarkdown',
        };

      case 'extractedData':
        return {
          fileName: `extracteddata${suffixPart}.json`,
          subfolder: 'extractedData',
        };

      case 'screenshot':
        return {
          fileName: `screenshot${suffixPart}_${timestamp}.png`,
          subfolder: 'screenshots',
        };

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      // This method can be used to clean up temporary files
      // For now, we keep all files for debugging and analysis
      console.log('Cleanup completed');
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      console.warn(`Cleanup warning: ${errorDetails.message}`);
    }
  }
}
