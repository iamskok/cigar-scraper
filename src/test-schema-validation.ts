/**
 * Test the new unified schema without making actual API calls
 */

import { CigarExtractionSchema } from './types/cigar-schema.js';

// Test data for the new flexible schema
const testSingleProduct = {
  page_type: "single_product",
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
      size_options: [
        {
          size: {
            length: 4.5,
            length_unit: "inches",
            ring_gauge: 42,
            display: "4 1/2 x 42"
          },
          price: {
            current_price: 8.95,
            msrp: 10.50,
            savings: 1.55,
            currency: "USD",
            quantity: 1,
            quantity_type: "single"
          },
          availability: "In Stock"
        }
      ]
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
      size_options: [
        {
          size: {
            length: 6,
            length_unit: "inches",
            ring_gauge: 50,
            display: "6 x 50"
          },
          price: {
            current_price: 6.50,
            msrp: null,
            savings: null,
            currency: "USD",
            quantity: 1,
            quantity_type: "single"
          },
          availability: "In Stock"
        }
      ]
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
      size_options: [
        {
          size: {
            length: 5.5,
            length_unit: "inches",
            ring_gauge: 52,
            display: "5 1/2 x 52"
          },
          price: {
            current_price: 9.75,
            msrp: null,
            savings: null,
            currency: "USD",
            quantity: 1,
            quantity_type: "single"
          },
          availability: "In Stock"
        }
      ]
    }
  ]
};

const testMultipleSizesWithQuantities = {
  page_type: "single_product",
  products: [
    {
      product_name: "Padron 1964 Anniversary Series",
      brand: "Padron",
      description: "Premium Nicaraguan cigar with rich, complex flavors",
      specifications: {
        strength: "Full",
        wrapper: "Nicaraguan Natural",
        binder: "Nicaraguan",
        filler: "Nicaraguan",
        origin: "Nicaragua",
        manufacturer: "Padron",
        blender: "Jose O. Padron"
      },
      size_options: [
        {
          size: {
            length: 6,
            length_unit: "inches",
            ring_gauge: 50,
            display: "6 x 50 Toro"
          },
          price: {
            current_price: 15.99,
            msrp: 17.50,
            savings: 1.51,
            currency: "USD",
            quantity: 1,
            quantity_type: "single"
          },
          availability: "In Stock"
        },
        {
          size: {
            length: 6,
            length_unit: "inches",
            ring_gauge: 50,
            display: "6 x 50 Toro"
          },
          price: {
            current_price: 74.95,
            msrp: 87.50,
            savings: 12.55,
            currency: "USD",
            quantity: 5,
            quantity_type: "pack"
          },
          availability: "In Stock"
        },
        {
          size: {
            length: 6,
            length_unit: "inches",
            ring_gauge: 50,
            display: "6 x 50 Toro"
          },
          price: {
            current_price: 349.99,
            msrp: 437.50,
            savings: 87.51,
            currency: "USD",
            quantity: 25,
            quantity_type: "box"
          },
          availability: "In Stock"
        }
      ]
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
    console.log(`   Price: $${validatedSingle.products[0]?.size_options[0]?.price.current_price} ${validatedSingle.products[0]?.size_options[0]?.price.currency}`);
    console.log(`   Quantity: ${validatedSingle.products[0]?.size_options[0]?.price.quantity} ${validatedSingle.products[0]?.size_options[0]?.price.quantity_type}`);
    console.log('   ✓ Single product validation passed\n');

    // Test multiple products schema
    console.log('✅ Testing multiple products validation...');
    const validatedMultiple = CigarExtractionSchema.parse(testMultipleProducts);
    console.log(`   Page Type: ${validatedMultiple.page_type}`);
    console.log(`   Products: ${validatedMultiple.products.length}`);
    validatedMultiple.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.product_name} - $${product.size_options[0]?.price.current_price} (${product.size_options[0]?.price.quantity} ${product.size_options[0]?.price.quantity_type})`);
    });
    console.log('   ✓ Multiple products validation passed\n');

    // Test multiple sizes with different quantity types schema
    console.log('✅ Testing multiple sizes with different quantity types validation...');
    const validatedMultipleSizes = CigarExtractionSchema.parse(testMultipleSizesWithQuantities);
    console.log(`   Page Type: ${validatedMultipleSizes.page_type}`);
    console.log(`   Products: ${validatedMultipleSizes.products.length}`);
    console.log(`   Product: ${validatedMultipleSizes.products[0]?.product_name}`);
    validatedMultipleSizes.products[0]?.size_options.forEach((sizeOption, index) => {
      console.log(`   Size ${index + 1}: ${sizeOption.size.display} - $${sizeOption.price.current_price} (${sizeOption.price.quantity} ${sizeOption.price.quantity_type})`);
    });
    console.log('   ✓ Multiple sizes with different quantity types validation passed\n');

    // Test multiple sizes with quantities
    console.log('✅ Testing multiple sizes with quantity variations...');
    const validatedQuantities = CigarExtractionSchema.parse(testMultipleSizesWithQuantities);
    console.log(`   Page Type: ${validatedQuantities.page_type}`);
    console.log(`   Product: ${validatedQuantities.products[0]?.product_name}`);
    console.log('   Size Options:');
    validatedQuantities.products[0]?.size_options.forEach((option, index) => {
      const price = option.price;
      console.log(`     ${index + 1}. ${price.quantity} ${price.quantity_type} - $${price.current_price} (Save $${price.savings || 0})`);
    });
    console.log('   ✓ Multiple sizes with quantities validation passed\n');

    console.log('🎉 All schema validations passed! The unified schema is working correctly.');

  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    process.exit(1);
  }
}

testSchemaValidation();
