/**
 * Test the new unified schema without making actual API calls
 */

import { CigarExtractionSchema } from './types/cigar-schema.js';

// Test data for the new flexible schema
const testSingleProduct = {
  page_type: "single_product_single_size",
  products: [
    {
      product_name: "Highclere Castle Petite Corona",
      brand: "Foundation",
      description: "A premium cigar with complex flavors",
      specifications: {
        strength: "Medium",
        wrapper: "Ecuadorian Habano",
        binder: "Nicaraguan",
        filler: "Nicaraguan",
        origin: "Nicaragua",
        manufacturer: "AJ Fernandez",
        blender: "Nicholas Melillo"
      },
      single_size: {
        length: 4.5,
        length_unit: "inches",
        ring_gauge: 42,
        display: "4 1/2 x 42"
      },
      single_price: {
        current_price: 8.95,
        msrp: 10.50,
        savings: 1.55,
        currency: "USD"
      },
      single_availability: "In Stock",
      multiple_sizes: null
    }
  ]
};

const testMultipleProducts = {
  page_type: "search_results",
  products: [
    {
      product_name: "Foundation Charter Oak",
      brand: "Foundation",
      description: "Connecticut wrapped cigar",
      specifications: {
        strength: "Mild",
        wrapper: "Connecticut Shade",
        binder: "Dominican",
        filler: "Dominican and Nicaraguan",
        origin: "Dominican Republic",
        manufacturer: "Tabacalera AJ Fernandez",
        blender: "Nicholas Melillo"
      },
      single_size: {
        length: 6,
        length_unit: "inches",
        ring_gauge: 50,
        display: "6 x 50"
      },
      single_price: {
        current_price: 6.50,
        msrp: null,
        savings: null,
        currency: "USD"
      },
      single_availability: "In Stock",
      multiple_sizes: null
    },
    {
      product_name: "Foundation The Tabernacle",
      brand: "Foundation",
      description: "Full-bodied Havana wrapper",
      specifications: {
        strength: "Full",
        wrapper: "Sancti Spiritus Habano",
        binder: "Nicaraguan",
        filler: "Nicaraguan",
        origin: "Nicaragua",
        manufacturer: "AJ Fernandez",
        blender: "Nicholas Melillo"
      },
      single_size: {
        length: 5.5,
        length_unit: "inches",
        ring_gauge: 52,
        display: "5 1/2 x 52"
      },
      single_price: {
        current_price: 9.75,
        msrp: null,
        savings: null,
        currency: "USD"
      },
      single_availability: "In Stock",
      multiple_sizes: null
    }
  ]
};

function testSchemaValidation(): void {
  console.log('🧪 Testing new unified cigar extraction schema...\n');

  try {
    // Test single product schema
    console.log('✅ Testing single product validation...');
    const validatedSingle = CigarExtractionSchema.parse(testSingleProduct);
    console.log(`   Page Type: ${validatedSingle.page_type}`);
    console.log(`   Products: ${validatedSingle.products.length}`);
    console.log(`   Product: ${validatedSingle.products[0]?.product_name}`);
    console.log(`   Price: $${validatedSingle.products[0]?.single_price?.current_price} ${validatedSingle.products[0]?.single_price?.currency}`);
    console.log('   ✓ Single product validation passed\n');

    // Test multiple products schema
    console.log('✅ Testing multiple products validation...');
    const validatedMultiple = CigarExtractionSchema.parse(testMultipleProducts);
    console.log(`   Page Type: ${validatedMultiple.page_type}`);
    console.log(`   Products: ${validatedMultiple.products.length}`);
    validatedMultiple.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.product_name} - $${product.single_price?.current_price}`);
    });
    console.log('   ✓ Multiple products validation passed\n');

    console.log('🎉 All schema validations passed! The unified schema is working correctly.');

  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    process.exit(1);
  }
}

testSchemaValidation();
