#!/usr/bin/env node

/**
 * Quick test of the new unified schema
 */

import { CigarExtractionSchema } from './src/types/cigar-schema.js';

// Test the new schema with sample data
const testData = {
  page_type: 'single_product_multiple_sizes',
  products: [
    {
      product_name: 'Highclere Castle Edwardian',
      brand: 'Foundation',
      description: 'Premium cigar with exceptional flavor',
      specifications: {
        strength: 'Medium-Full',
        wrapper: 'Ecuadorian Habano',
        binder: 'Nicaraguan',
        filler: 'Nicaraguan',
        origin: 'Nicaragua',
        manufacturer: 'A.J. Fernandez',
        blender: 'Nicholas Melillo'
      },
      single_size: null,
      single_price: null,
      single_availability: null,
      multiple_sizes: [
        {
          size: {
            length: 5.5,
            length_unit: 'inches',
            ring_gauge: 42,
            display: '5 1/2 x 42'
          },
          price: {
            current_price: 12.99,
            msrp: 15.99,
            savings: 3.00,
            currency: 'USD'
          },
          availability: 'In Stock'
        },
        {
          size: {
            length: 6.0,
            length_unit: 'inches',
            ring_gauge: 50,
            display: '6 x 50'
          },
          price: {
            current_price: 13.99,
            msrp: 16.99,
            savings: 3.00,
            currency: 'USD'
          },
          availability: 'In Stock'
        }
      ]
    }
  ]
};

console.log('🧪 Testing new unified schema...\n');

try {
  const validated = CigarExtractionSchema.parse(testData);
  console.log('✅ Schema validation successful!');
  console.log('📊 Validated data structure:');
  console.log(`   Page Type: ${validated.page_type}`);
  console.log(`   Products: ${validated.products.length}`);

  validated.products.forEach((product, index) => {
    console.log(`   Product ${index + 1}: ${product.product_name}`);
    console.log(`     Brand: ${product.brand}`);
    console.log(`     Multiple Sizes: ${product.multiple_sizes?.length || 0}`);

    if (product.multiple_sizes) {
      product.multiple_sizes.forEach((sizeInfo, sizeIndex) => {
        console.log(`       ${sizeIndex + 1}. ${sizeInfo.size.display} - $${sizeInfo.price.current_price} ${sizeInfo.price.currency}`);
      });
    }

    console.log(`     Specifications:`);
    console.log(`       Strength: ${product.specifications.strength}`);
    console.log(`       Wrapper: ${product.specifications.wrapper}`);
    console.log(`       Origin: ${product.specifications.origin}`);
  });

  console.log('\n🎉 New unified schema is working perfectly!');

} catch (error) {
  console.error('❌ Schema validation failed:', error);
  process.exit(1);
}
