# Hybrid Architecture Backend Implementation Summary

## ✅ Completed Implementation

### 1. **Property Model Updated** (`src/models/property.ts`)

**Added:**
- `propertyPurpose`: Required enum field (`"sale" | "rental" | "investment" | "tour"`)
  - Default: `"rental"` (backward compatible)
- `saleDetails`: Optional object for sale-specific fields
  - `paymentPlans`, `financingAvailable`, `downPayment`, `completionDate`
- `rentalDetails`: Optional object for rental-specific fields
  - `minStay`, `maxStay`, `cancellationPolicy`, `checkInTime`, `checkOutTime`
- `investmentDetails`: Updated (now optional, was required)
  - `roi`, `expectedReturn`, `completionDate`, `paymentMilestones`, `location`, `propertyType`

**Database Indexes Added:**
- `propertyPurpose` (single index)
- `propertyPurpose + isActive` (compound)
- `propertyPurpose + isListed` (compound)
- `propertyPurpose + location` (compound)
- `propertyPurpose + priceNumeric` (compound)

**Migration Note:**
- Existing properties will default to `propertyPurpose: "rental"` when updated
- `investmentDetails` is now optional (was required before)

---

### 2. **Inquiry Model Created** (`src/models/inquiry.ts`)

**New Model for Non-Date-Based Inquiries:**
- Handles: `"sale"` and `"investment"` inquiries
- No dates required (unlike bookings)

**Fields:**
- `propertyId`: Optional (for properties in listings)
- `propertyDetails`: Optional (for inquiry-only properties)
- `inquiryType`: Required enum (`"sale" | "investment"`)
- `contactInfo`: Required (fullName, email, phone)
- `saleInquiryDetails`: Optional (budgetRange, preferredPaymentPlan, financingRequired, timeline, additionalRequirements)
- `investmentInquiryDetails`: Optional (investmentAmount, expectedROI, preferredPaymentSchedule, completionDatePreference, additionalQuestions)
- `status`: Enum (`"pending" | "contacted" | "qualified" | "closed" | "rejected"`)
- `priority`: Enum (`"low" | "medium" | "high"`) - default: "medium"
- `assignedTo`: Optional (reference to User - sales/investment manager)
- `notes`: Admin notes
- `respondedAt`, `closedAt`, `rejectionReason`: Tracking fields

**Indexes:**
- `userId`, `propertyId`, `status`, `inquiryType`, `priority`, `assignedTo`, `createdAt`

---

### 3. **Booking Model Updated** (`src/models/booking.ts`)

**Changes:**
- Removed `"investment"` from `BookingTypeEnum`
- Now only handles date-based types: `"shortlet" | "long-term" | "tour"`

**Rationale:**
- Investment inquiries moved to Inquiry model (no dates needed)
- Bookings require dates (check-in/check-out), which don't apply to sales/investments

---

### 4. **Inquiry Controller Created** (`src/controllers/inquiry.ts`)

**Endpoints:**

1. **`createInquiry`** (POST `/api/inquiries`)
   - Creates sale or investment inquiry
   - Validates property purpose matches inquiry type
   - Validates inquiry-specific details match inquiry type
   - Returns created inquiry with populated references

2. **`getInquiries`** (GET `/api/inquiries`)
   - Users see only their inquiries
   - Admins see all inquiries
   - Supports filtering: `status`, `inquiryType`, `priority`
   - Pagination support

3. **`getInquiryById`** (GET `/api/inquiries/:id`)
   - Users can view their own inquiries
   - Admins can view all inquiries
   - Returns inquiry with populated references

4. **`updateInquiryStatus`** (PATCH `/api/inquiries/:id/status`) - Admin only
   - Updates inquiry status
   - Can update: `status`, `priority`, `assignedTo`, `notes`, `rejectionReason`
   - Automatically sets timestamps based on status:
     - `rejected` → sets `rejectedAt`
     - `closed` → sets `closedAt`
     - `contacted`/`qualified` → sets `respondedAt`

5. **`deleteInquiry`** (DELETE `/api/inquiries/:id`)
   - Users can delete their own inquiries
   - Admins can delete any inquiry

---

### 5. **Property Controller Updated** (`src/controllers/property.ts`)

**Changes:**

1. **`createProperty`**:
   - Accepts `propertyPurpose`, `saleDetails`, `rentalDetails`, `investmentDetails`
   - Defaults `propertyPurpose` to `"rental"` if not provided

2. **`getProperties`**:
   - Added `propertyPurpose` query parameter filter
   - Can filter properties by purpose: `?propertyPurpose=sale`

---

### 6. **Booking Controller Updated** (`src/controllers/booking.ts`)

**Changes:**

1. **`createBooking`**:
   - Added validation to reject `"investment"` booking type
   - Returns clear error message directing users to inquiry endpoint
   - Only accepts date-based booking types: `"shortlet"`, `"long-term"`, `"tour"`

---

### 7. **Inquiry Routes Created** (`src/routes/inquiries.ts`)

**Routes:**
- `POST /api/inquiries` - Create inquiry (authenticated)
- `GET /api/inquiries` - List inquiries (authenticated, filtered by user)
- `GET /api/inquiries/:id` - Get single inquiry (authenticated)
- `PATCH /api/inquiries/:id/status` - Update status (admin only)
- `DELETE /api/inquiries/:id` - Delete inquiry (authenticated, own or admin)

---

### 8. **Server Updated** (`src/index.ts`)

**Added:**
- Imported `inquiriesRoutes`
- Registered route: `app.use('/api/inquiries', inquiriesRoutes)`

---

## 📊 API Endpoints Summary

### Properties
```
GET    /api/properties              - Get all (filter by ?propertyPurpose=sale|rental|investment|tour)
GET    /api/properties/:id          - Get single property
POST   /api/properties              - Create property (admin)
PUT    /api/properties/:id          - Update property (admin)
DELETE /api/properties/:id          - Delete property (admin)
```

### Bookings (Date-Based Only)
```
POST   /api/bookings                - Create booking (shortlet/long-term/tour)
GET    /api/bookings                - Get user bookings
GET    /api/bookings/:id            - Get single booking
PATCH  /api/bookings/:id/status     - Update status (admin)
DELETE /api/bookings/:id            - Cancel booking
```

### Inquiries (Non-Date-Based)
```
POST   /api/inquiries               - Create inquiry (sale/investment)
GET    /api/inquiries               - Get user inquiries
GET    /api/inquiries/:id           - Get single inquiry
PATCH  /api/inquiries/:id/status    - Update status (admin)
DELETE /api/inquiries/:id           - Delete inquiry
```

---

## 🔄 Migration Guide

### For Existing Properties:

1. **Add `propertyPurpose` field:**
   ```javascript
   // MongoDB migration script
   db.properties.updateMany(
     { propertyPurpose: { $exists: false } },
     { $set: { propertyPurpose: "rental" } }
   );
   ```

2. **Update `investmentDetails` to be optional:**
   - Existing properties with `investmentDetails` will continue to work
   - New properties don't require `investmentDetails` unless `propertyPurpose: "investment"`

### For Existing Bookings:

1. **Move investment bookings to inquiries:**
   ```javascript
   // MongoDB migration script (if needed)
   db.bookings.find({ bookingType: "investment" }).forEach(function(booking) {
     db.inquiries.insertOne({
       propertyId: booking.propertyId,
       userId: booking.userId,
       propertyName: booking.propertyName,
       inquiryType: "investment",
       contactInfo: booking.guestInfo,
       investmentInquiryDetails: {
         // Extract from booking details
       },
       status: booking.status === "confirmed" ? "qualified" : booking.status,
       createdAt: booking.createdAt,
       updatedAt: booking.updatedAt
     });
   });
   ```

2. **Remove investment bookings:**
   ```javascript
   db.bookings.deleteMany({ bookingType: "investment" });
   ```

---

## 🧪 Testing Recommendations

### 1. Property Endpoints:
- ✅ Create property with each purpose: sale, rental, investment, tour
- ✅ Filter properties by purpose
- ✅ Update property purpose
- ✅ Verify purpose-specific fields are saved correctly

### 2. Booking Endpoints:
- ✅ Create booking with valid types: shortlet, long-term, tour
- ✅ Reject booking with "investment" type (should return error)
- ✅ Verify dates are required and validated

### 3. Inquiry Endpoints:
- ✅ Create sale inquiry with propertyPurpose: "sale"
- ✅ Create investment inquiry with propertyPurpose: "investment"
- ✅ Reject inquiry with mismatched property purpose
- ✅ Verify no dates required
- ✅ Test inquiry status updates
- ✅ Test assignment to sales manager

---

## 🎯 Next Steps (Frontend)

1. Update Property types/forms to include `propertyPurpose` field
2. Create Inquiry API client functions
3. Create Inquiry forms (sale and investment)
4. Update Booking forms to remove investment option
5. Update UI to show appropriate CTAs based on `propertyPurpose`:
   - Sale → "Inquire" button → Inquiry form
   - Rental → "Book Now" button → Booking form
   - Investment → "Express Interest" button → Inquiry form
   - Tour → "Book Tour" button → Booking form

---

## 📝 Key Decisions

1. **Unified Property Model**: All property types in one model (simpler, reusable)
2. **Separated Inquiries/Bookings**: Clear separation between date-based (bookings) and non-date-based (inquiries)
3. **Backward Compatible**: Existing properties default to `propertyPurpose: "rental"`
4. **Type Safety**: Validation ensures property purpose matches inquiry type
5. **Flexible**: Purpose-specific fields are optional, allowing gradual adoption

---

## ✅ Status: Backend Implementation Complete

All backend models, controllers, routes, and validations are in place. Ready for frontend integration!

