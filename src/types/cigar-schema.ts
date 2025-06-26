/**
 * TypeScript types for cigar data extraction with OpenAI structured outputs
 *
 * This module defines the structured data types for reliable
 * cigar product information extraction using the hybrid vitola-offer model.
 */

export type PageType =
  | 'blend_page'
  | 'brand_page'
  | 'search_page'
  | 'single_vitola_page'
  | 'collection_page'
  | 'unknown';

export type Strength =
  | 'Mild'
  | 'Mild to Medium'
  | 'Medium'
  | 'Medium to Full'
  | 'Full'
  | 'Full+'
  | null;

export type Shape =
  | 'parejo'
  | 'figurado'
  | 'perfecto'
  | 'pyramid'
  | 'torpedo'
  | 'belicoso'
  | 'culebra'
  | 'diadema'
  | 'presidente'
  | 'other'
  | null;

export type LengthUnit = 'inches' | 'mm' | null;

export type PackageType =
  | 'single'
  | 'pack'
  | 'box'
  | 'bundle'
  | 'sampler'
  | 'tin'
  | 'tube'
  | 'cabinet'
  | 'case'
  | 'sleeve'
  | 'other'
  | 'unspecified'
  | null;

/**
 * Size type with measurement units
 */
export interface SizeType {
  length: number | null;
  length_unit: LengthUnit;
  ring_gauge: number | null;
  display: string | null;
}

/**
 * Offer type - represents a specific pricing/packaging option for a vitola
 * This allows multiple purchase options (singles, 5-packs, boxes) for the same vitola
 */
export interface OfferType {
  current_price: number | null;
  msrp: number | null;
  savings: number | null;
  currency: string | null;
  package_quantity: number | null;
  package_type: PackageType;
  cigars_per_package: number | null;
  total_cigars: number | null;
  availability: boolean | null;
}

/**
 * Vitola type - represents a specific cigar size/shape with multiple purchase options
 */
export interface VitolaType {
  name: string | null;
  shape: Shape;
  size: SizeType;
  offers: OfferType[];
}

/**
 * Specifications type with enhanced tobacco details (arrays for multiple tobaccos)
 */
export interface SpecificationsType {
  strength: Strength;
  wrapper: string[] | null;
  binder: string[] | null;
  filler: string[] | null;
  origin: string | null;
  factory: string | null;
  blender: string[];
}

/**
 * Individual cigar product type using the hybrid vitola-offer model
 */
export interface CigarProductType {
  product_name: string | null;
  brand: string | null;
  company: string | null;
  description: string | null;
  specifications: SpecificationsType;
  vitolas: VitolaType[];
}

/**
 * Unified flexible extraction type that handles all page types
 */
export interface CigarExtractionType {
  page_type: PageType;
  products: CigarProductType[];
}

