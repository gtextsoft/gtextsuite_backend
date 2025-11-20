import Property from "../models/property";
import { Request, Response } from "express";

// Create a new property (Admin only)
export const createProperty = async (req: Request, res: Response) => {
  try {
    // Debug: Log what we're receiving
    // console.log("Request body received:", JSON.stringify(req.body, null, 2));
    // console.log("Request body type:", typeof req.body);
    // console.log("Request body keys:", Object.keys(req.body || {}));

    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: "Request body is empty. Please send JSON data.",
      });
      return;
    }

    const {
      name,
      location,
      description,
      longDescription,
      price,
      priceNumeric,
      currency,
      size,
      amenities,
      images,
      propertyPurpose,
      saleDetails,
      rentalDetails,
      investmentDetails,
      features,
      coordinates,
      nearbyAttractions,
      isActive,
      isListed,
    } = req.body;

    // Validate required fields before creating property
    const requiredFields: Record<string, any> = {
      name,
      location,
      description,
      longDescription,
      price,
      size,
      amenities,
      images,
      features,
    };

    // Only require investmentDetails if propertyPurpose is "investment"
    if (propertyPurpose === "investment") {
      requiredFields.investmentDetails = investmentDetails;
    }

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

    // Get user ID from request (set by authenticate middleware)
    // This ensures we know who created the property for tracking
    const createdBy = req.userId;

    if (!createdBy) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Convert amenities object to Map if it's a plain object
    const amenitiesMap = amenities && typeof amenities === 'object' && !Array.isArray(amenities)
      ? new Map(Object.entries(amenities))
      : new Map();

    const newProperty = new Property({
      name,
      location,
      description,
      longDescription,
      price,
      priceNumeric,
      currency: currency || "USD", // Default to USD if not provided
      size,
      amenities: amenitiesMap,
      images,
      propertyPurpose: propertyPurpose || "rental", // Default to rental
      saleDetails,
      rentalDetails,
      investmentDetails,
      features,
      coordinates,
      nearbyAttractions,
      isActive: isActive !== undefined ? isActive : true,
      isListed: isListed !== undefined ? isListed : true,
      createdBy,
    });

    const savedProperty = await newProperty.save();

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: { property: savedProperty },
    });
  } catch (error: any) {
    console.log("Error creating property:", error);
    
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors: Record<string, string> = {};
      
      // Extract validation errors from Mongoose
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
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Something went wrong during property creation",
      error: error.message,
    });
  }
};

// Get all properties with optional filters
// Public route - clients see only active properties, admins see all
export const getProperties = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      location,
      search,
      minPrice,
      maxPrice,
      isActive,
      propertyPurpose,
    } = req.query;

    // Check if user is admin (from authenticate middleware if logged in)
    const isAdmin = req.user?.roles?.includes("admin") || false;

    // Build filter object
    // Property listings page: show all listed properties (isListed: true) - regardless of isActive
    // Booking page: show all active properties (isActive: true) - regardless of isListed
    // This allows flexibility:
    // - Listed but NOT bookable (isActive: false, isListed: true) - appears in listings only
    // - Bookable but NOT listed (isActive: true, isListed: false) - appears in booking only
    // - Both listed AND bookable (isActive: true, isListed: true) - appears in both
    // Admins can see all properties when logged in
    const { isListed: isListedParam } = req.query;
    
    let filter: any = {};
    if (isAdmin) {
      // Admin can filter by isActive if provided, otherwise see all
      if (isActive !== undefined) {
        const isActiveStr = String(isActive);
        filter.isActive = isActiveStr === "true" || isActiveStr === "1";
      }
      // Admin can also filter by isListed
      if (isListedParam !== undefined) {
        const isListedStr = String(isListedParam);
        filter.isListed = isListedStr === "true" || isListedStr === "1";
      }
      // If filters not provided, filter is empty (shows all)
    } else {
      // Non-admin users: check what they're requesting
      if (isListedParam !== undefined) {
        // Property listings page: show all listed properties (regardless of isActive)
        const isListedStr = String(isListedParam);
        if (isListedStr === "true" || isListedStr === "1") {
          filter.isListed = true; // Show all listed (can include inactive for showcase)
        }
      } else {
        // Booking page: show all active properties (regardless of isListed)
        filter.isActive = true; // Show all active (can include unlisted for booking-only)
      }
    }

    if (location) filter.location = { $regex: location, $options: "i" };
    if (minPrice || maxPrice) {
      filter.priceNumeric = {};
      if (minPrice) filter.priceNumeric.$gte = parseFloat(minPrice as string);
      if (maxPrice) filter.priceNumeric.$lte = parseFloat(maxPrice as string);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (propertyPurpose) {
      filter.propertyPurpose = propertyPurpose;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.find(filter)
      .populate("createdBy", "firstName lastName email")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.log("Error fetching properties:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Get single property by ID
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { property },
    });
  } catch (error: any) {
    console.log("Error fetching property:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Update property (Admin only)
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert amenities object to Map if it's a plain object
    if (updateData.amenities && typeof updateData.amenities === 'object' && !Array.isArray(updateData.amenities)) {
      updateData.amenities = new Map(Object.entries(updateData.amenities));
    }

    const property = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: { property },
    });
  } catch (error: any) {
    console.log("Error updating property:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Delete property (Admin only)
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndDelete(id);

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error: any) {
    console.log("Error deleting property:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Get related properties for a specific property
// Public route - anyone can view related properties
export const getRelatedProperties = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 3 } = req.query;

    // Find the current property
    const currentProperty = await Property.findById(id);

    if (!currentProperty) {
      res.status(404).json({
        success: false,
        message: "Property not found",
      });
      return;
    }

    // Check if user is admin
    const isAdmin = req.user?.roles?.includes("admin") || false;

    // Build filter for related properties
    // Non-admin users: only see active, listed properties
    // Admins: see all properties when logged in
    let filter: any = {
      _id: { $ne: currentProperty._id }, // Exclude current property
    };

    if (!isAdmin) {
      filter.isActive = true;
      filter.isListed = true;
    }

    // Get all potential related properties
    const allProperties = await Property.find(filter).lean();

    // Score properties based on relevance
    const scoredProperties: Array<{ property: any; score: number }> = [];

    // Extract current property values for comparison
    const currentLocation = currentProperty.investmentDetails?.location || currentProperty.location;
    const currentPropertyType = currentProperty.investmentDetails?.propertyType;
    const currentPropertyPurpose = currentProperty.propertyPurpose;
    const currentPrice = currentProperty.priceNumeric || parseFloat(String(currentProperty.price).replace(/[^0-9.]/g, "")) || 0;
    const currentSize = parseFloat(String(currentProperty.size).replace(/[^0-9.]/g, "")) || 0;

    for (const property of allProperties) {
      let score = 0;

      // Priority 1: Same location (highest priority) - 100 points
      const propertyLocation = property.investmentDetails?.location || property.location;
      if (propertyLocation && currentLocation && propertyLocation === currentLocation) {
        score += 100;
      }

      // Priority 2: Same property type (investment) - 50 points
      if (
        currentPropertyType &&
        property.investmentDetails?.propertyType &&
        property.investmentDetails.propertyType === currentPropertyType
      ) {
        score += 50;
      }

      // Priority 3: Same property purpose - 30 points
      if (property.propertyPurpose === currentPropertyPurpose) {
        score += 30;
      }

      // Priority 4: Similar price range (within 30% difference) - 25 points
      const propertyPrice = property.priceNumeric || parseFloat(String(property.price).replace(/[^0-9.]/g, "")) || 0;
      if (currentPrice > 0 && propertyPrice > 0) {
        const priceDiff = Math.abs(currentPrice - propertyPrice) / currentPrice;
        if (priceDiff <= 0.3) {
          score += 25;
        }
      }

      // Priority 5: Similar size (within 20% difference) - 10 points
      const propertySize = parseFloat(String(property.size).replace(/[^0-9.]/g, "")) || 0;
      if (currentSize > 0 && propertySize > 0) {
        const sizeDiff = Math.abs(currentSize - propertySize) / currentSize;
        if (sizeDiff <= 0.2) {
          score += 10;
        }
      }

      // Only add properties with some relevance (score > 0)
      if (score > 0) {
        scoredProperties.push({ property, score });
      }
    }

    // Sort by score (highest first) and take top N
    const limitNum = parseInt(limit as string) || 3;
    const relatedProperties = scoredProperties
      .sort((a, b) => b.score - a.score)
      .slice(0, limitNum)
      .map((item) => item.property);

    res.status(200).json({
      success: true,
      data: { properties: relatedProperties },
    });
  } catch (error: any) {
    console.log("Error fetching related properties:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

