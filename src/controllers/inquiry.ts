import Inquiry from "../models/inquiry";
import Property from "../models/property";
import { Request, Response } from "express";

/**
 * Create a new inquiry
 * Users can create inquiries for sale/investment properties
 */
export const createInquiry = async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      propertyDetails, // For inquiry-only properties (agent properties)
      propertyName,
      inquiryType,
      contactInfo,
      saleInquiryDetails,
      investmentInquiryDetails,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      propertyName,
      inquiryType,
      contactInfo,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
        missingFields,
      });
      return;
    }

    // Validate inquiry type
    if (!["sale", "investment"].includes(inquiryType)) {
      res.status(400).json({
        success: false,
        message: "Invalid inquiry type. Must be 'sale' or 'investment'",
      });
      return;
    }

    // Validate that either propertyId OR propertyDetails is provided
    if (!propertyId && !propertyDetails) {
      res.status(400).json({
        success: false,
        message: "Either propertyId or propertyDetails must be provided",
      });
      return;
    }

    if (propertyId && propertyDetails) {
      res.status(400).json({
        success: false,
        message: "Cannot provide both propertyId and propertyDetails",
      });
      return;
    }

    // Validate contactInfo structure
    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
      res.status(400).json({
        success: false,
        message: "Contact information is incomplete",
      });
      return;
    }

    // Get user ID from request (set by authenticate middleware)
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // If propertyId is provided, validate property exists and matches inquiry type
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        res.status(404).json({
          success: false,
          message: "Property not found",
        });
        return;
      }

      // Validate property purpose matches inquiry type
      if (
        (inquiryType === "sale" && property.propertyPurpose !== "sale") ||
        (inquiryType === "investment" && property.propertyPurpose !== "investment")
      ) {
        res.status(400).json({
          success: false,
          message: `Property purpose (${property.propertyPurpose}) does not match inquiry type (${inquiryType})`,
        });
        return;
      }
    }

    // Validate inquiry-specific details match inquiry type
    if (inquiryType === "sale" && investmentInquiryDetails) {
      res.status(400).json({
        success: false,
        message: "saleInquiryDetails should be provided for sale inquiries, not investmentInquiryDetails",
      });
      return;
    }

    if (inquiryType === "investment" && saleInquiryDetails) {
      res.status(400).json({
        success: false,
        message: "investmentInquiryDetails should be provided for investment inquiries, not saleInquiryDetails",
      });
      return;
    }

    // Create inquiry object
    const inquiryData: any = {
      userId,
      propertyName: propertyName || (propertyId ? (await Property.findById(propertyId))?.name : propertyDetails?.name),
      inquiryType,
      contactInfo,
      status: "pending",
      priority: "medium",
    };

    // Add propertyId if provided, otherwise add propertyDetails
    if (propertyId) {
      inquiryData.propertyId = propertyId;
    } else if (propertyDetails) {
      inquiryData.propertyDetails = propertyDetails;
    }

    // Add inquiry-specific details
    if (inquiryType === "sale" && saleInquiryDetails) {
      inquiryData.saleInquiryDetails = saleInquiryDetails;
    }

    if (inquiryType === "investment" && investmentInquiryDetails) {
      inquiryData.investmentInquiryDetails = investmentInquiryDetails;
    }

    const newInquiry = new Inquiry(inquiryData);
    const savedInquiry = await newInquiry.save();

    // Populate references for response
    if (savedInquiry.propertyId) {
      await savedInquiry.populate([
        { path: "propertyId", select: "name location images propertyPurpose" },
        { path: "userId", select: "firstName lastName email" },
      ]);
    } else {
      await savedInquiry.populate([
        { path: "userId", select: "firstName lastName email" },
      ]);
    }

    res.status(201).json({
      success: true,
      message: "Inquiry created successfully",
      data: { inquiry: savedInquiry },
    });
  } catch (error: any) {
    console.log("Error creating inquiry:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors: Record<string, string> = {};

      if (error.errors) {
        Object.keys(error.errors).forEach((key) => {
          const fieldError = error.errors[key];
          validationErrors[key] = fieldError.message;
        });
      }

      res.status(400).json({
        success: false,
        message: "Validation failed. Please check your input.",
        errors: validationErrors,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong during inquiry creation",
      error: error.message,
    });
  }
};

/**
 * Get list of inquiries with optional filters
 * Users see their own inquiries, admins see all inquiries
 */
export const getInquiries = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      inquiryType,
      priority,
    } = req.query;

    // Check if user is admin
    const isAdmin = req.user?.roles?.includes("admin") || false;

    // Build filter object
    // Users see only their inquiries, admins see all
    const filter: any = isAdmin ? {} : { userId: req.userId };

    if (status) {
      filter.status = status;
    }
    if (inquiryType) {
      filter.inquiryType = inquiryType;
    }
    if (priority) {
      filter.priority = priority;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const inquiries = await Inquiry.find(filter)
      .populate("propertyId", "name location images propertyPurpose")
      .populate("userId", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Inquiry.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        inquiries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.log("Error fetching inquiries:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

/**
 * Get single inquiry by ID
 * Users can only see their own inquiries, admins can see all
 */
export const getInquiryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.roles?.includes("admin") || false;

    const inquiry = await Inquiry.findById(id)
      .populate("propertyId", "name location images propertyPurpose")
      .populate("userId", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    if (!inquiry) {
      res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
      return;
    }

    // Check if user has permission to view this inquiry
    if (!isAdmin && inquiry.userId.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: "Forbidden - You can only view your own inquiries",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { inquiry },
    });
  } catch (error: any) {
    console.log("Error fetching inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

/**
 * Update inquiry status (Admin only)
 * Allows admins to update inquiry status, priority, assign to manager, and add notes
 */
export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, notes, rejectionReason } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Status is required",
      });
      return;
    }

    // Validate status value
    const validStatuses = ["pending", "contacted", "qualified", "closed", "rejected"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
      return;
    }

    const updateData: any = { status };

    if (priority) {
      const validPriorities = ["low", "medium", "high"];
      if (!validPriorities.includes(priority)) {
        res.status(400).json({
          success: false,
          message: "Invalid priority value",
        });
        return;
      }
      updateData.priority = priority;
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // If rejecting, set rejectionReason and rejectedAt
    if (status === "rejected") {
      updateData.rejectedAt = new Date();
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }

    // If closing, set closedAt
    if (status === "closed") {
      updateData.closedAt = new Date();
    }

    // If contacting, set respondedAt
    if (status === "contacted" || status === "qualified") {
      updateData.respondedAt = new Date();
    }

    const inquiry = await Inquiry.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("propertyId", "name location images propertyPurpose")
      .populate("userId", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    if (!inquiry) {
      res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Inquiry status updated successfully",
      data: { inquiry },
    });
  } catch (error: any) {
    console.log("Error updating inquiry status:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

/**
 * Delete inquiry
 * Users can delete their own inquiries, admins can delete any inquiry
 */
export const deleteInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.roles?.includes("admin") || false;

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
      return;
    }

    // Check if user has permission to delete this inquiry
    if (!isAdmin && inquiry.userId.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: "Forbidden - You can only delete your own inquiries",
      });
      return;
    }

    await Inquiry.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error: any) {
    console.log("Error deleting inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

