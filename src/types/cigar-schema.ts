/**
 * TypeScript types for cigar data extraction with OpenAI structured outputs
 *
 * This module defines the structured data types for reliable
 * cigar product information extraction.
 */

/**
 * Size type with measurement units
 */
export interface SizeType {
  length: number | null;
  length_unit: 'inches' | 'mm' | null;
  ring_gauge: number | null;
  display: string | null;
}

/**
 * Price type with quantity and separate currency field
 */
export interface PriceType {
  current_price: number | null;
  msrp: number | null;
  savings: number | null;
  currency: string | null;
  quantity: number | null;
  quantity_type: 'single' | 'pack' | 'box' | 'bundle' | 'sampler' | 'tin' | 'tube' | 'cabinet' | 'case' | 'sleeve' | 'other' | 'unspecified' | null;
}

/**
 * Specifications type with all tobacco details
 */
export interface SpecificationsType {
  strength: string | null;
  wrapper: string | null;
  binder: string | null;
  filler: string | null;
  origin: string | null;
  manufacturer: string | null;
  blender: string | null;
}

/**
 * Size and pricing option type
 */
export interface SizePricingOptionType {
  size: SizeType;
  price: PriceType;
  availability: boolean | null;
}

/**
 * Individual cigar product type
 */
export interface CigarProductType {
  product_name: string | null;
  brand: string | null;
  description: string | null;
  specifications: SpecificationsType;
  size_options: SizePricingOptionType[];
}

/**
 * Unified flexible extraction type that handles all page types
 */
export interface CigarExtractionType {
  page_type: 'single_product' | 'multiple_products' | 'search_results' | 'category_listing';
  products: CigarProductType[];
}

