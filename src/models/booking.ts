import mongoose, { Document } from "mongoose";

// Booking status enum
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "rejected";

// Booking type enum (only date-based types - investment moved to Inquiry model)
export type BookingTypeEnum = "shortlet" | "long-term" | "tour";

// Payment status enum
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";

// Guest information type
export type GuestInfoType = {
  fullName: string;
  email: string;
  phone: string;
};

// Property details for booking-only properties (not in listing)
export type BookingPropertyDetails = {
  name: string;
  location: string;
  description?: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  landlordName?: string; // Name of the actual property owner
  landlordContact?: string; // Contact info for the landlord
};

// Booking type definition
export type BookingType = {
  propertyId?: mongoose.Types.ObjectId; // Optional: only if property exists in listing
  userId: mongoose.Types.ObjectId;
  propertyName: string;
  propertyDetails?: BookingPropertyDetails; // For booking-only properties (agent properties)
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalAmount: number;
  guestInfo: GuestInfoType;
  specialRequests?: string;
  status: BookingStatus;
  bookingType: BookingTypeEnum;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string; // Admin notes
  cancelledAt?: Date;
  cancellationReason?: string;
};

// Extend with Document for Mongoose
export interface BookingDocument extends BookingType, Document {}

// Booking schema
const bookingSchema = new mongoose.Schema<BookingDocument>(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: false, // Optional: booking-only properties don't have propertyId
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: BookingDocument, value: Date) {
          return value > this.checkIn;
        },
        message: "Check-out date must be after check-in date",
      },
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    guestInfo: {
      type: {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
      },
      required: true,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "rejected"],
      default: "pending",
    },
    bookingType: {
      type: String,
      enum: ["shortlet", "long-term", "tour"] as BookingTypeEnum[],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Property details for booking-only properties (agent properties not in listing)
    propertyDetails: {
      type: {
        name: { type: String, trim: true },
        location: { type: String, trim: true },
        description: { type: String, trim: true },
        price: { type: String, trim: true },
        bedrooms: { type: Number, min: 0 },
        bathrooms: { type: Number, min: 0 },
        images: [String],
        landlordName: { type: String, trim: true },
        landlordContact: { type: String, trim: true },
      },
      required: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Validation: Either propertyId OR propertyDetails must be provided
bookingSchema.pre("validate", function (next) {
  if (!this.propertyId && !this.propertyDetails) {
    return next(new Error("Either propertyId or propertyDetails must be provided"));
  }
  if (this.propertyId && this.propertyDetails) {
    return next(new Error("Cannot provide both propertyId and propertyDetails"));
  }
  next();
});

// Indexes for better query performance
bookingSchema.index({ userId: 1 });
bookingSchema.index({ propertyId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingType: 1 });
bookingSchema.index({ checkIn: 1 });
bookingSchema.index({ checkOut: 1 });
bookingSchema.index({ createdAt: -1 });

// Pre-save hook to calculate nights if not provided
bookingSchema.pre("save", function (next) {
  if (this.checkIn && this.checkOut && !this.nights) {
    const diffTime = this.checkOut.getTime() - this.checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.nights = diffDays > 0 ? diffDays : 1;
  }
  next();
});

const Booking = mongoose.model<BookingDocument>("Booking", bookingSchema);

export default Booking;

