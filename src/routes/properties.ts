import express from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
  getRelatedProperties,
  updateProperty,
  deleteProperty,
} from "../controllers/property";
import { authenticate, requireAdmin, optionalAuthenticate } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes - anyone can view properties
// Authentication is optional - if admin is logged in, they see all properties (including inactive)
// If not logged in or regular user, they only see active properties
router.get("/", optionalAuthenticate, getProperties);
router.get("/:id/related", optionalAuthenticate, getRelatedProperties); // Must be before /:id route
router.get("/:id", optionalAuthenticate, getPropertyById);

// Admin-only routes - require authentication + admin role
router.post("/", authenticate, requireAdmin, createProperty);
router.put("/:id", authenticate, requireAdmin, updateProperty);
router.delete("/:id", authenticate, requireAdmin, deleteProperty);

export default router;

