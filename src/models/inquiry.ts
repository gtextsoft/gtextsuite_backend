import mongoose, { Document } from "mongoose";

// Inquiry status enum
export type InquiryStatus = "pending" | "contacted" | "qualified" | "closed" | "rejected";

// Inquiry type enum
export type InquiryTypeEnum = "sale" | "investment";

// Priority enum
export type Priority = "low" | "medium" | "high";

// Contact information type
export type ContactInfoType = {
  fullName: string;
  email: string;
  phone: string;
};

// Property details for inquiry-only properties (not in listing)
export type InquiryPropertyDetails = {
  name: string;
  location: string;
  description?: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  landlordName?: string;
  landlordContact?: string;
};

// Inquiry type definition
export type InquiryType = {
  propertyId?: mongoose.Types.ObjectId; // Optional: only if property exists in listing
  userId: mongoose.Types.ObjectId;
  propertyName: string;
  propertyDetails?: InquiryPropertyDetails; // For inquiry-only properties (agent properties)
  
  // No dates required
  inquiryType: InquiryTypeEnum;
  
  // Contact information
  contactInfo: ContactInfoType;
  
  // Inquiry-specific fields
  saleInquiryDetails?: {
    budgetRange?: string;
    preferredPaymentPlan?: string;
    financingRequired?: boolean;
    timeline?: string; // e.g., "3-6 months"
    additionalRequirements?: string;
  };
  
  investmentInquiryDetails?: {
    investmentAmount?: number;
    expectedROI?: string;
    preferredPaymentSchedule?: string;
    completionDatePreference?: Date; // Optional for when they want possession
    additionalQuestions?: string;
  };
  
  // Status
  status: InquiryStatus;
  priority?: Priority;
  assignedTo?: mongoose.Types.ObjectId; // Sales/Investment manager
  notes?: string;
  
  respondedAt?: Date;
  closedAt?: Date;
  rejectionReason?: string;
};

// Extend with Document for Mongoose
export interface InquiryDocument extends InquiryType, Document {}

// Inquiry schema
const inquirySchema = new mongoose.Schema<InquiryDocument>(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: false, // Optional: inquiry-only properties don't have propertyId
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
    inquiryType: {
      type: String,
      enum: ["sale", "investment"] as InquiryTypeEnum[],
      required: true,
    },
    contactInfo: {
      type: {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
      },
      required: true,
    },
    saleInquiryDetails: {
      type: {
        budgetRange: { type: String, trim: true },
        preferredPaymentPlan: { type: String, trim: true },
        financingRequired: { type: Boolean },
        timeline: { type: String, trim: true },
        additionalRequirements: { type: String, trim: true, maxlength: 1000 },
      },
      required: false,
    },
    investmentInquiryDetails: {
      type: {
        investmentAmount: { type: Number, min: 0 },
        expectedROI: { type: String, trim: true },
        preferredPaymentSchedule: { type: String, trim: true },
        completionDatePreference: { type: Date },
        additionalQuestions: { type: String, trim: true, maxlength: 1000 },
      },
      required: false,
    },
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    respondedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Property details for inquiry-only properties (agent properties not in listing)
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
inquirySchema.pre("validate", function (next) {
  if (!this.propertyId && !this.propertyDetails) {
    return next(new Error("Either propertyId or propertyDetails must be provided"));
  }
  if (this.propertyId && this.propertyDetails) {
    return next(new Error("Cannot provide both propertyId and propertyDetails"));
  }
  
  // Validate inquiry-specific details match inquiry type
  if (this.inquiryType === "sale" && !this.saleInquiryDetails) {
    // Sale inquiry should have saleInquiryDetails (optional but recommended)
  }
  if (this.inquiryType === "investment" && !this.investmentInquiryDetails) {
    // Investment inquiry should have investmentInquiryDetails (optional but recommended)
  }
  
  next();
});

// Indexes for better query performance
inquirySchema.index({ userId: 1 });
inquirySchema.index({ propertyId: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ inquiryType: 1 });
inquirySchema.index({ priority: 1 });
inquirySchema.index({ assignedTo: 1 });
inquirySchema.index({ createdAt: -1 });

const Inquiry = mongoose.model<InquiryDocument>("Inquiry", inquirySchema);

export default Inquiry;

