/**
 * Quick test to verify the updated types work correctly
 */

import type { CigarExtractionType } from './src/types/cigar-schema.js';

// Test that the new schema matches what's defined in the OpenAI schema
const testData: CigarExtractionType = {
  page_type: 'blend_page',
  products: [
    {
      product_name: 'Test Cigar',
      brand: 'Test Brand',
      company: 'Test Company',
      description: 'Test description',
      specifications: {
        strength: 'Medium',
        wrapper: ['Test Wrapper'],
        binder: ['Test Binder'],
        filler: ['Test Filler'],
        origin: 'Test Origin',
        factory: 'Test Factory',
        blender: ['Test Blender'],
      },
      vitolas: [
        {
          name: 'Robusto',
          shape: 'parejo',
          size: {
            manufacturer_size_name: 'Robusto',
            length: 5.0,
            length_unit: 'inches',
            ring_gauge: 50,
            display: '5" x 50',
          },
          offers: [
            {
              current_price: 10.00,
              msrp: 12.00,
              savings: 2.00,
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

console.log('✅ Type test passed! New types are working correctly');
console.log(`Test data has ${testData.products.length} product(s)`);
console.log(`First product has ${testData.products[0].vitolas.length} vitola(s)`);
console.log(`First vitola has ${testData.products[0].vitolas[0].offers.length} offer(s)`);
