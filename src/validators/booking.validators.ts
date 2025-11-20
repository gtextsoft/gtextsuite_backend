import { Request, Response, NextFunction } from "express";

/**
 * Booking validation middleware
 * Validates booking creation and update requests
 */

// Validate guest info structure
const validateGuestInfo = (guestInfo: any): string | null => {
  if (!guestInfo || typeof guestInfo !== "object") {
    return "Guest information is required";
  }

  if (!guestInfo.fullName || typeof guestInfo.fullName !== "string" || guestInfo.fullName.trim().length === 0) {
    return "Full name is required";
  }

  if (!guestInfo.email || typeof guestInfo.email !== "string") {
    return "Email is required";
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(guestInfo.email)) {
    return "Invalid email format";
  }

  if (!guestInfo.phone || typeof guestInfo.phone !== "string" || guestInfo.phone.trim().length === 0) {
    return "Phone number is required";
  }

  return null;
};

/**
 * Validate create booking request
 */
export const validateCreateBooking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { propertyId, propertyDetails, checkIn, checkOut, guests, guestInfo, bookingType } = req.body;

  // Validate that either propertyId OR propertyDetails is provided
  if (!propertyId && !propertyDetails) {
    return res.status(400).json({
      success: false,
      message: "Either propertyId or propertyDetails must be provided",
    });
  }

  if (propertyId && propertyDetails) {
    return res.status(400).json({
      success: false,
      message: "Cannot provide both propertyId and propertyDetails",
    });
  }

  // Validate propertyDetails if provided
  if (propertyDetails) {
    if (!propertyDetails.name || !propertyDetails.location || !propertyDetails.price) {
      return res.status(400).json({
        success: false,
        message: "Property details must include name, location, and price",
      });
    }
  }

  if (!checkIn) {
    return res.status(400).json({
      success: false,
      message: "Check-in date is required",
    });
  }

  if (!checkOut) {
    return res.status(400).json({
      success: false,
      message: "Check-out date is required",
    });
  }

  if (!guests || typeof guests !== "number" || guests < 1) {
    return res.status(400).json({
      success: false,
      message: "Number of guests must be at least 1",
    });
  }

  if (!bookingType) {
    return res.status(400).json({
      success: false,
      message: "Booking type is required",
    });
  }

  // Validate booking type (only date-based types - investment moved to Inquiry model)
  const validBookingTypes = ["shortlet", "long-term", "tour"];
  if (!validBookingTypes.includes(bookingType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid booking type. Must be one of: ${validBookingTypes.join(", ")}. For investments or sales, use the inquiry endpoint.`,
    });
  }

  // Validate guest info
  const guestInfoError = validateGuestInfo(guestInfo);
  if (guestInfoError) {
    return res.status(400).json({
      success: false,
      message: guestInfoError,
    });
  }

  // Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid check-in date format",
    });
  }

  if (isNaN(checkOutDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid check-out date format",
    });
  }

  if (checkOutDate <= checkInDate) {
    return res.status(400).json({
      success: false,
      message: "Check-out date must be after check-in date",
    });
  }

  // Check if check-in is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkInDate < today) {
    return res.status(400).json({
      success: false,
      message: "Check-in date cannot be in the past",
    });
  }

  // Validate special requests length if provided
  if (req.body.specialRequests && req.body.specialRequests.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Special requests cannot exceed 1000 characters",
    });
  }

  return next();
};

/**
 * Validate update booking status request (Admin only)
 */
export const validateUpdateBookingStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  const validStatuses = ["pending", "confirmed", "cancelled", "completed", "rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  // Validate notes length if provided
  if (req.body.notes && req.body.notes.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Notes cannot exceed 1000 characters",
    });
  }

  return next();
};

/**
 * Validate cancel booking request
 */
export const validateCancelBooking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validate cancellation reason length if provided
  if (req.body.cancellationReason && req.body.cancellationReason.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason cannot exceed 500 characters",
    });
  }

  return next();
};

