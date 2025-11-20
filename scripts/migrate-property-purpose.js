/**
 * Migration Script: Add propertyPurpose field to existing properties
 * 
 * This script:
 * 1. Adds propertyPurpose field to all existing properties (defaults to "rental")
 * 2. Makes investmentDetails optional (was required before)
 * 
 * Usage:
 *   node scripts/migrate-property-purpose.js
 * 
 * Make sure to set your MONGOD_CONNECTION_STRING environment variable before running
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Property Schema (simplified for migration)
const propertySchema = new mongoose.Schema({
  name: String,
  propertyPurpose: {
    type: String,
    enum: ["sale", "rental", "investment", "tour"],
    default: "rental",
  },
  investmentDetails: {
    type: {
      roi: String,
      expectedReturn: String,
      location: String,
      propertyType: String,
    },
    required: false, // Now optional
  },
  saleDetails: {
    type: {
      paymentPlans: [String],
      financingAvailable: Boolean,
      downPayment: String,
      completionDate: Date,
    },
    required: false,
  },
  rentalDetails: {
    type: {
      minStay: Number,
      maxStay: Number,
      cancellationPolicy: String,
      checkInTime: String,
      checkOutTime: String,
    },
    required: false,
  },
}, { collection: 'properties', strict: false }); // strict: false to allow old schema

const Property = mongoose.model('Property', propertySchema);

async function migrateProperties() {
  try {
    // Connect to MongoDB
    const MONGOD_CONNECTION_STRING = process.env.MONGOD_CONNECTION_STRING || process.env.MONGO_URI;
    
    if (!MONGOD_CONNECTION_STRING) {
      console.error('❌ Error: MONGOD_CONNECTION_STRING environment variable is not set');
      console.error('Please set MONGOD_CONNECTION_STRING in your .env file');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGOD_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB');

    // Find all properties without propertyPurpose
    const propertiesToUpdate = await Property.find({
      $or: [
        { propertyPurpose: { $exists: false } },
        { propertyPurpose: null },
      ],
    });

    console.log(`\n📊 Found ${propertiesToUpdate.length} properties to update`);

    if (propertiesToUpdate.length === 0) {
      console.log('✅ No properties need updating. Migration complete!');
      await mongoose.disconnect();
      return;
    }

    // Update properties
    let updatedCount = 0;
    let skippedCount = 0;

    for (const property of propertiesToUpdate) {
      try {
        // Determine propertyPurpose based on existing investmentDetails
        // If investmentDetails exists and has meaningful data, likely an investment property
        let propertyPurpose = "rental"; // Default
        
        if (property.investmentDetails) {
          const hasInvestmentData = 
            property.investmentDetails.roi || 
            property.investmentDetails.expectedReturn ||
            property.investmentDetails.propertyType;
          
          if (hasInvestmentData) {
            // Check propertyType to determine if it's actually an investment or rental
            const propertyType = (property.investmentDetails.propertyType || "").toLowerCase();
            
            // If propertyType suggests investment (off-plan, pre-construction, etc.)
            if (
              propertyType.includes("off-plan") ||
              propertyType.includes("off plan") ||
              propertyType.includes("pre-construction") ||
              propertyType.includes("pre construction") ||
              propertyType.includes("investment")
            ) {
              propertyPurpose = "investment";
            } else {
              // Otherwise, it's likely a rental property with investment details
              propertyPurpose = "rental";
            }
          }
        }

        // Update property with propertyPurpose
        await Property.updateOne(
          { _id: property._id },
          {
            $set: {
              propertyPurpose: propertyPurpose,
            },
          }
        );

        updatedCount++;
        console.log(`✅ Updated: ${property.name || property._id} → ${propertyPurpose}`);
      } catch (error) {
        console.error(`❌ Error updating property ${property._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} properties`);
    if (skippedCount > 0) {
      console.log(`   ⚠️  Skipped: ${skippedCount} properties (errors)`);
    }

    // Verify all properties have propertyPurpose now
    const remainingWithoutPurpose = await Property.countDocuments({
      $or: [
        { propertyPurpose: { $exists: false } },
        { propertyPurpose: null },
      ],
    });

    if (remainingWithoutPurpose === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   All properties now have propertyPurpose field');
    } else {
      console.log(`\n⚠️  Warning: ${remainingWithoutPurpose} properties still missing propertyPurpose`);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
console.log('🚀 Starting Property Purpose Migration...\n');
migrateProperties();

