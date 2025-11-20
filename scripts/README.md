# Migration Scripts

## Overview

This directory contains migration scripts for updating your database to support the new hybrid architecture with property purposes and separate inquiry models.

## Scripts

### 1. `migrate-property-purpose.js`

**Purpose:** Adds `propertyPurpose` field to all existing properties

**What it does:**
- Finds all properties without `propertyPurpose` field
- Sets default `propertyPurpose: "rental"` for most properties
- Automatically detects investment properties based on `investmentDetails`
- Makes `investmentDetails` optional (was required before)

**Usage:**
```bash
cd gtextsuite_backend
node scripts/migrate-property-purpose.js
```

**Before running:**
- Ensure your `.env` file has `MONGOD_CONNECTION_STRING` or `MONGO_URI` set
- Backup your database (recommended)

**After running:**
- Verify all properties have `propertyPurpose` field
- Review and manually update any properties that need different purposes (sale, investment, tour)

---

### 2. `migrate-bookings-to-inquiries.js`

**Purpose:** Moves investment bookings to the new Inquiry model

**What it does:**
- Finds all bookings with `bookingType: "investment"`
- Creates corresponding inquiries in the Inquiry collection
- Maps booking status to inquiry status:
  - `pending` → `pending`
  - `confirmed` → `qualified`
  - `cancelled` → `rejected`
  - `completed` → `closed`
  - `rejected` → `rejected`
- Does NOT delete original bookings (safety feature - uncomment deletion code after verification)

**Usage:**
```bash
cd gtextsuite_backend
node scripts/migrate-bookings-to-inquiries.js
```

**Before running:**
- Ensure migration script #1 has been run first
- Backup your database (recommended)

**After running:**
- Verify inquiries were created correctly
- Review inquiry data to ensure accuracy
- Uncomment deletion code in script to remove original investment bookings (after verification)

**To delete original bookings (after verification):**
1. Uncomment the deletion section in the script (lines marked with `/* */`)
2. Run the script again
3. Verify bookings were deleted correctly

---

## Migration Order

Run migrations in this order:

1. ✅ First: `migrate-property-purpose.js`
2. ✅ Second: `migrate-bookings-to-inquiries.js`

---

## Environment Setup

Ensure your `.env` file contains:

```env
MONGOD_CONNECTION_STRING=mongodb://localhost:27017/your-database-name
# OR
MONGO_URI=mongodb://localhost:27017/your-database-name
```

---

## Troubleshooting

### Connection Errors
- Verify MongoDB is running
- Check your `MONGOD_CONNECTION_STRING` environment variable
- Ensure the database name is correct

### Migration Errors
- Check MongoDB logs for detailed error messages
- Verify your database schema matches the expected format
- Some properties might need manual review if automatic detection fails

### Rollback
- Restore from backup if migration fails
- Old data structure is not modified (only new fields added)
- Original bookings are preserved until you explicitly delete them

---

## Post-Migration Checklist

- [ ] All properties have `propertyPurpose` field
- [ ] Investment bookings converted to inquiries
- [ ] Verify property purposes are correct (review sale/investment properties manually)
- [ ] Test property creation form with new purpose selector
- [ ] Test inquiry creation for sale/investment properties
- [ ] Verify booking creation still works for rentals/tours

