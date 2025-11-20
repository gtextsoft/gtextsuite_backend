import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
} from "../controllers/booking";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import {
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateCancelBooking,
} from "../validators/booking.validators";

const router = express.Router();

// All booking routes require authentication
// Users can create bookings and view their own bookings
// Admins can view all bookings and update status

// Create booking - authenticated users only
router.post("/", authenticate, validateCreateBooking, createBooking);

// Get list of bookings - users see their own, admins see all
router.get("/", authenticate, getBookings);

// Get single booking by ID - users see their own, admins see all
router.get("/:id", authenticate, getBookingById);

// Update booking status - Admin only
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validateUpdateBookingStatus,
  updateBookingStatus
);

// Cancel booking - users can cancel their own, admins can cancel any
router.delete("/:id", authenticate, validateCancelBooking, cancelBooking);

export default router;

