/**
 * Migration Script: Move investment bookings to inquiries
 * 
 * This script:
 * 1. Finds all bookings with bookingType: "investment"
 * 2. Converts them to inquiries in the new Inquiry model
 * 3. Deletes the original investment bookings
 * 
 * Usage:
 *   node scripts/migrate-bookings-to-inquiries.js
 * 
 * Make sure to set your MONGOD_CONNECTION_STRING environment variable before running
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Booking Schema (for reading)
const bookingSchema = new mongoose.Schema({}, { collection: 'bookings', strict: false });

// Inquiry Schema (for writing)
const inquirySchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  propertyName: String,
  propertyDetails: mongoose.Schema.Types.Mixed,
  inquiryType: {
    type: String,
    enum: ["sale", "investment"],
    required: true,
  },
  contactInfo: {
    fullName: String,
    email: String,
    phone: String,
  },
  investmentInquiryDetails: mongoose.Schema.Types.Mixed,
  saleInquiryDetails: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ["pending", "contacted", "qualified", "closed", "rejected"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  notes: String,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'inquiries', strict: false });

const Booking = mongoose.model('Booking', bookingSchema);
const Inquiry = mongoose.model('Inquiry', inquirySchema);

async function migrateBookingsToInquiries() {
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

    // Find all investment bookings
    const investmentBookings = await Booking.find({ bookingType: "investment" });

    console.log(`\n📊 Found ${investmentBookings.length} investment bookings to migrate`);

    if (investmentBookings.length === 0) {
      console.log('✅ No investment bookings found. Migration complete!');
      await mongoose.disconnect();
      return;
    }

    // Convert bookings to inquiries
    let migratedCount = 0;
    let skippedCount = 0;

    for (const booking of investmentBookings) {
      try {
        // Map booking status to inquiry status
        const statusMap = {
          "pending": "pending",
          "confirmed": "qualified",
          "cancelled": "rejected",
          "completed": "closed",
          "rejected": "rejected",
        };

        const inquiryStatus = statusMap[booking.status] || "pending";

        // Create inquiry from booking
        const inquiryData = {
          propertyId: booking.propertyId || null,
          userId: booking.userId,
          propertyName: booking.propertyName,
          propertyDetails: booking.propertyDetails || null,
          inquiryType: "investment",
          contactInfo: {
            fullName: booking.guestInfo?.fullName || "",
            email: booking.guestInfo?.email || "",
            phone: booking.guestInfo?.phone || "",
          },
          investmentInquiryDetails: {
            // You can extract additional details from booking if needed
            additionalQuestions: booking.specialRequests || "",
          },
          status: inquiryStatus,
          priority: "medium",
          notes: booking.notes || "",
          createdAt: booking.createdAt || new Date(),
          updatedAt: booking.updatedAt || new Date(),
        };

        // Only set fields that are defined
        if (!inquiryData.propertyId) {
          delete inquiryData.propertyId;
        }
        if (!inquiryData.propertyDetails) {
          delete inquiryData.propertyDetails;
        }

        // Create inquiry
        await Inquiry.create(inquiryData);

        migratedCount++;
        console.log(`✅ Migrated: ${booking.propertyName || booking._id} → Inquiry`);
      } catch (error) {
        console.error(`❌ Error migrating booking ${booking._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migratedCount} bookings to inquiries`);

    if (skippedCount > 0) {
      console.log(`   ⚠️  Skipped: ${skippedCount} bookings (errors)`);
    }

    // Ask before deleting (safety check)
    if (migratedCount > 0) {
      console.log(`\n⚠️  Migration complete. Original investment bookings are still in the database.`);
      console.log(`   To delete them, uncomment the deletion code in the script and run again.`);
      
      // Uncomment this section to delete original bookings after verification
      /*
      console.log('\n🗑️  Deleting original investment bookings...');
      const deleteResult = await Booking.deleteMany({ bookingType: "investment" });
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} investment bookings`);
      */
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
console.log('🚀 Starting Booking to Inquiry Migration...\n');
migrateBookingsToInquiries();

