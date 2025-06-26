/**
 * Unified OpenAI structured output schema for flexible cigar extraction
 */

import type { CigarExtractionType } from '../types/cigar-schema.js';

/**
 * CIGAR DATA HIERARCHY
 *
 * Company   – Legal corporate owner (or regional importer / distributor)
 * Brand     – Consumer-facing label (e.g. “Drew Estate”)
 * Blend     – Stable recipe (wrapper + binder + filler) offered in many sizes
 * Vitola    – Size / shape variant of that blend (Robusto, Toro …)
 * Offer     – Concrete SKU / package (single, box 20, sampler 5 …)
 *
 * One “product” == one Blend with ≥1 vitola.
 *
 * page_type values:
 *   • blend_page         – Single blend showing multiple sizes
 *   • brand_page         – Catalogue of many blends within one brand
 *   • search_page        – Results across multiple brands / blends
 *   • single_vitola_page – PDP for one specific size of a blend
 *   • collection_page    – Curated multi-brand set (e.g. “Top 10 Maduros”)
 *   • unknown            – Fallback when type cannot be inferred
 */

export const CIGAR_EXTRACTION_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'cigar_extraction',
    description:
      'Extract cigar data from any page, grouping vitolas under a single blend and mapping brand ↔ company.',
    schema: {
      type: 'object',
      properties: {
        /* ────────────────────────── Page metadata ───────────────────────── */
        page_type: {
          type: 'string',
          enum: [
            'blend_page',
            'brand_page',
            'search_page',
            'single_vitola_page',
            'collection_page',
            'unknown',
          ],
          description:
            'Context of the scraped URL:\n' +
            '• blend_page – dedicated to ONE blend showing multiple sizes\n' +
            '• brand_page – catalogue of many blends within one brand\n' +
            '• search_page – results spanning multiple brands/blends\n' +
            '• single_vitola_page – product page for one specific size\n' +
            '• collection_page – curated multi-brand list (e.g. “Top 10 Maduros”)\n' +
            '• unknown – use only when type cannot be inferred',
        },

        /* ─────────────────────── List of cigar blends ───────────────────── */
        products: {
          type: 'array',
          description:
            'Each array element represents ONE blend/line; all its sizes live in “vitolas[]”.',
          items: {
            type: 'object',
            properties: {
              /* ---------- Identity ---------- */
              product_name: {
                type: ['string', 'null'],
                description:
                  'Blend / line WITHOUT size text. Examples: “Liga Privada No. 9”, “Padron 1964 Anniversary”, “Oliva Serie V Melanio”, “Davidoff Nicaragua”, “La Flor Dominicana Andalusian Bull”, “Macanudo Inspirado Orange”.',
              },
              brand: {
                type: ['string', 'null'],
                description:
                  'Label on band/box. Examples: “Drew Estate”, “Padron”, “Davidoff”, “Oliva”, “Macanudo”, “Plasencia”.',
              },
              company: {
                type: ['string', 'null'],
                description:
                  'Owning corporation or regional importer/distributor. Examples: “Scandinavian Tobacco Group”, “Altadis USA”, “Davidoff of Geneva USA”, “Plasencia Cigars S.A.”',
              },

              /* ---------- Marketing copy ---------- */
              description: {
                type: ['string', 'null'],
                description:
                  'Flavour notes or promotional blurb. Preserve “\\n\\n” between paragraphs.',
              },

              /* ---------- Blend specs ---------- */
              specifications: {
                type: 'object',
                properties: {
                  strength: {
                    type: ['string', 'null'],
                    enum: [
                      'Mild',
                      'Mild to Medium',
                      'Medium',
                      'Medium to Full',
                      'Full',
                      'Full+',
                      null,
                    ],
                    description: 'Manufacturer body profile.',
                  },

                  /* Arrays allow multi-origin leaves; null when no info at all. */
                  wrapper: {
                    type: ['array', 'null'],
                    items: { type: 'string' },
                    description:
                      'Wrapper leaf array. Capture country, varietal, priming (“Ecuador Habano Oscuro Viso”).\n' +
                      '• Use "undisclosed" when the site explicitly says details are not revealed.\n' +
                      '• Use null when the page provides zero wrapper info.',
                  },
                  binder: {
                    type: ['array', 'null'],
                    items: { type: 'string' },
                    description:
                      'Binder leaf array (same “undisclosed” vs null rule as wrapper).',
                  },
                  filler: {
                    type: ['array', 'null'],
                    items: { type: 'string' },
                    description:
                      'Filler leaf array (same “undisclosed” vs null rule as wrapper).',
                  },

                  origin: {
                    type: ['string', 'null'],
                    description:
                      'Country where the cigar is rolled. Examples: “Nicaragua”, “Dominican Republic”, “Honduras”, “USA”, “Costa Rica”, “Brazil”.',
                  },
                  factory: {
                    type: ['string', 'null'],
                    description:
                      'Rolling facility. Examples: “La Gran Fabrica Drew Estate”, “Tabacalera AJ Fernandez de Nicaragua”, “TABSA”, “Tabacalera A. Fuente y Cia”.',
                  },
                  blender: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      'Array of named blender(s). Always an array, even when only one name (“A.J. Fernandez”, “Don Pepin Garcia”).',
                  },
                },
                required: [
                  'strength',
                  'wrapper',
                  'binder',
                  'filler',
                  'origin',
                  'factory',
                  'blender',
                ],
                additionalProperties: true,
              },

              /* ---------- Sizes ---------- */
              vitolas: {
                type: 'array',
                description: 'Distinct sizes / shapes found on this page.',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: ['string', 'null'],
                      description:
                        'Factory size name as given by manufacturer (“Robusto”, “Belicoso Fino”, “Double Toro Gordo”).',
                    },
                    shape: {
                      type: ['string', 'null'],
                      enum: [
                        'parejo',
                        'figurado',
                        'perfecto',
                        'pyramid',
                        'torpedo',
                        'belicoso',
                        'culebra',
                        'diadema',
                        'presidente',
                        'other',
                        null,
                      ],
                      description:
                        'Geometry bucket. If shape is tapered/odd but term unknown, default to “figurado”; otherwise use the precise enum.',
                    },

                    size: {
                      type: 'object',
                      properties: {
                        length: { type: ['number', 'null'] },
                        length_unit: {
                          type: ['string', 'null'],
                          enum: ['inches', 'mm', null],
                        },
                        ring_gauge: { type: ['number', 'null'] },
                        display: { type: ['string', 'null'] },
                      },
                      required: [
                        'length',
                        'length_unit',
                        'ring_gauge',
                        'display',
                      ],
                      additionalProperties: true,
                    },

                    /* ---------- Offers ---------- */
                    offers: {
                      type: 'array',
                      description: 'Purchase SKUs for this vitola.',
                      items: {
                        type: 'object',
                        properties: {
                          current_price: { type: ['number', 'null'] },
                          msrp: { type: ['number', 'null'] },
                          savings: { type: ['number', 'null'] },
                          currency: { type: ['string', 'null'] },
                          package_quantity: { type: ['number', 'null'] },
                          package_type: {
                            type: ['string', 'null'],
                            enum: [
                              'single',
                              'pack',
                              'box',
                              'bundle',
                              'sampler',
                              'tin',
                              'tube',
                              'cabinet',
                              'case',
                              'sleeve',
                              'other',
                              'unspecified',
                              null,
                            ],
                          },
                          cigars_per_package: { type: ['number', 'null'] },
                          total_cigars: { type: ['number', 'null'] },
                          availability: { type: ['boolean', 'null'] },
                        },
                        required: [
                          'current_price',
                          'msrp',
                          'savings',
                          'currency',
                          'package_quantity',
                          'package_type',
                          'cigars_per_package',
                          'total_cigars',
                          'availability',
                        ],
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ['name', 'shape', 'size', 'offers'],
                  additionalProperties: true,
                },
              },
            },
            required: [
              'product_name',
              'brand',
              'company',
              'description',
              'specifications',
              'vitolas',
            ],
            additionalProperties: true,
          },
        },
      },
      required: ['page_type', 'products'],
      additionalProperties: true,
    },
  },
} as const;

/* ───────────────────────────── Example payload ─────────────────────────── */

export const EXAMPLE_EXTRACTION: CigarExtractionType = {
  page_type: 'blend_page',
  products: [
    {
      product_name: 'Oliva Serie V Melanio',
      brand: 'Oliva',
      company: 'J. Cortès Cigars NV',
      description:
        'Award-winning Ecuador Sumatra–wrapped powerhouse with rich chocolate, coffee and baking-spice notes.',
      specifications: {
        strength: 'Medium to Full',
        wrapper: ['Ecuador Sumatra'],
        binder: ['Nicaragua Jalapa'],
        filler: ['Nicaragua Estelí Ligero', 'Nicaragua Jalapa Viso'],
        origin: 'Nicaragua',
        factory: 'TABSA',
        blender: ['Gilberto Oliva Jr.'],
      },
      vitolas: [
        {
          name: 'Figurado',
          shape: 'figurado',
          size: {
            length: 6.5,
            length_unit: 'inches',
            ring_gauge: 52,
            display: '6 1/2 × 52',
          },
          offers: [
            {
              current_price: 175.0,
              msrp: 200.0,
              savings: 25.0,
              currency: 'USD',
              package_quantity: 1,
              package_type: 'box',
              cigars_per_package: 10,
              total_cigars: 10,
              availability: true,
            },
            {
              current_price: 17.5,
              msrp: 20.0,
              savings: 2.5,
              currency: 'USD',
              package_quantity: 1,
              package_type: 'single',
              cigars_per_package: 1,
              total_cigars: 1,
              availability: true,
            },
          ],
        },
      ],
    },
  ],
};
