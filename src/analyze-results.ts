/**
 * Summary script to analyze all extracted cigar data
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { CigarExtractionType } from './types/cigar-schema.js';

// Legacy format types for backward compatibility
interface LegacyCigar {
  product_name?: string;
  brand?: string;
  size?: {
    display?: string;
  };
  price?: {
    current_price?: number;
    msrp?: number;
    savings?: number;
    currency?: string;
  };
  sizes?: Array<{
    size?: { display?: string };
    price?: {
      current_price?: number;
      currency?: string;
    };
  }>;
  specifications?: {
    strength?: string;
    wrapper?: string;
    origin?: string;
    manufacturer?: string;
  };
  availability?: string;
}

interface LegacyMultipleCigars {
  cigars?: LegacyCigar[];
}

type AnalysisData = CigarExtractionType | LegacyCigar | LegacyMultipleCigars;

async function analyzeExtractedData(): Promise<void> {
  const dataDir = '/Users/skok/dev/cigar-scraper/data';
  console.log('🔍 Analyzing extracted cigar data...\n');

  try {
    const extractedFiles = await findExtractedFiles(dataDir);
    console.log(`📊 Found ${extractedFiles.length} extracted data files:\n`);

    for (const filePath of extractedFiles) {
      console.log(`📄 ${filePath}`);
      console.log('='.repeat(80));
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as AnalysisData;
      analyzeDataStructure(data);
      console.log('\n');
    }
  } catch (error) {
    console.error('❌ Error analyzing data:', error);
  }
}

async function findExtractedFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  async function traverse(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.name === 'extracteddata.json') {
        files.push(fullPath);
      }
    }
  }
  await traverse(dir);
  return files;
}

function analyzeDataStructure(data: AnalysisData): void {
  // Handle new flexible schema format
  if ('page_type' in data && 'products' in data) {
    console.log(`📊 Page Type: ${data.page_type}`);
    console.log(`🚬 Products Found: ${data.products.length}`);
    data.products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.product_name || 'Unknown Product'}`);
      console.log(`     Brand: ${product.brand || 'Unknown'}`);
      if (product.multiple_sizes && product.multiple_sizes.length > 0) {
        console.log(`     Multiple Sizes: ${product.multiple_sizes.length} available`);
        product.multiple_sizes.forEach((sizeInfo, sizeIndex) => {
          const size = sizeInfo.size;
          const price = sizeInfo.price;
          console.log(`       ${sizeIndex + 1}. ${size?.display || 'Unknown size'} - $${price?.current_price || 'N/A'} ${price?.currency || ''}`);
        });
      } else if (product.single_size && product.single_price) {
        console.log(`     Single Size: ${product.single_size.display || 'Unknown'} - $${product.single_price.current_price || 'N/A'} ${product.single_price.currency || ''}`);
        if (product.single_price.msrp && product.single_price.savings) {
          console.log(`     MSRP: $${product.single_price.msrp} (Save $${product.single_price.savings})`);
        }
      }
      if (product.specifications) {
        console.log(`     Strength: ${product.specifications.strength || 'Unknown'}`);
        console.log(`     Wrapper: ${product.specifications.wrapper || 'Unknown'}`);
        console.log(`     Origin: ${product.specifications.origin || 'Unknown'}`);
      }
      console.log('');
    });
    return;
  }

  // Handle legacy format with proper type checking
  const legacyData = data as LegacyCigar | LegacyMultipleCigars;
  if ('cigars' in legacyData && Array.isArray(legacyData.cigars)) {
    console.log(`🚬 Multiple Cigars: ${legacyData.cigars.length} products`);
    legacyData.cigars.forEach((cigar, index: number) => {
      console.log(`  ${index + 1}. ${cigar.product_name || 'Unknown Product'}`);
      console.log(`     Brand: ${cigar.brand || 'Unknown'}`);
      if (cigar.sizes && Array.isArray(cigar.sizes)) {
        console.log(`     Sizes: ${cigar.sizes.length} available`);
        cigar.sizes.forEach((sizeInfo, sizeIndex: number) => {
          const size = sizeInfo.size;
          const price = sizeInfo.price;
          console.log(`       ${sizeIndex + 1}. ${size?.display || 'Unknown size'} - $${price?.current_price || 'N/A'} ${price?.currency || ''}`);
        });
      } else if (cigar.size && cigar.price) {
        console.log(`     Size: ${cigar.size.display || 'Unknown'} - $${cigar.price.current_price || 'N/A'} ${cigar.price.currency || ''}`);
      }
      if (cigar.specifications) {
        console.log(`     Strength: ${cigar.specifications.strength || 'Unknown'}`);
        console.log(`     Wrapper: ${cigar.specifications.wrapper || 'Unknown'}`);
        console.log(`     Origin: ${cigar.specifications.origin || 'Unknown'}`);
      }
      console.log('');
    });
  } else if ('product_name' in legacyData) {
    console.log(`🚬 Single Cigar: ${legacyData.product_name}`);
    console.log(`   Brand: ${legacyData.brand || 'Unknown'}`);
    if (legacyData.sizes && Array.isArray(legacyData.sizes)) {
      console.log(`   Multiple Sizes: ${legacyData.sizes.length} available`);
      legacyData.sizes.forEach((sizeInfo, index: number) => {
        const size = sizeInfo.size;
        const price = sizeInfo.price;
        console.log(`     ${index + 1}. ${size?.display || 'Unknown size'} - $${price?.current_price || 'N/A'} ${price?.currency || ''}`);
      });
    } else if (legacyData.size && legacyData.price) {
      console.log(`   Single Size: ${legacyData.size.display || 'Unknown'} - $${legacyData.price.current_price || 'N/A'} ${legacyData.price.currency || ''}`);
      if (legacyData.price.msrp && legacyData.price.savings) {
        console.log(`   MSRP: $${legacyData.price.msrp} (Save $${legacyData.price.savings})`);
      }
    }
    if (legacyData.specifications) {
      console.log(`   Strength: ${legacyData.specifications.strength || 'Unknown'}`);
      console.log(`   Wrapper: ${legacyData.specifications.wrapper || 'Unknown'}`);
      console.log(`   Origin: ${legacyData.specifications.origin || 'Unknown'}`);
      console.log(`   Manufacturer: ${legacyData.specifications.manufacturer || 'Unknown'}`);
    }
    console.log(`   Availability: ${legacyData.availability || 'Unknown'}`);
  }
}

analyzeExtractedData();
