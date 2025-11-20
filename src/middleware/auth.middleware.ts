import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import User from "../models/user";

// Extend Express Request to include userId and user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

// Authentication middleware - verifies JWT token and attaches user info
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookie
    const token = req.cookies?.auth_token;
    
    // Debug logging to help troubleshoot cookie issues
    console.log("🔐 Auth Middleware Debug:", {
      hasCookies: !!req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      hasAuthToken: !!token,
      origin: req.headers.origin,
      userAgent: req.headers["user-agent"]?.substring(0, 50),
    });

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET_KEY as string;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    const decoded = verifyToken<{ userId: string }>(token, jwtSecret);

    // Attach userId to request object
    req.userId = decoded.userId;

    // Optionally fetch and attach full user object
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = user;

    return next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid or expired token",
    });
    return;
  }
};

// Optional authentication middleware - doesn't fail if no token
// Used for routes that work for both authenticated and non-authenticated users
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookie
    const token = req.cookies?.auth_token;

    // If no token, just continue (user is not authenticated)
    if (!token) {
      return next();
    }

    // Verify token if it exists
    const jwtSecret = process.env.JWT_SECRET_KEY as string;
    if (!jwtSecret) {
      return next(); // Continue without auth if secret not configured
    }

    try {
      const decoded = verifyToken<{ userId: string }>(token, jwtSecret);

      // Attach userId to request object
      req.userId = decoded.userId;

      // Fetch and attach full user object
      const user = await User.findById(decoded.userId).select("-password");
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid or expired, but continue without auth
      // Don't throw error, just proceed without user info
    }

    return next();
  } catch (error: any) {
    // On any error, continue without authentication
    return next();
  }
};

// Admin-only middleware - must be used after authenticate
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  // Check if user has admin role
  if (!req.user.roles || !req.user.roles.includes("admin")) {
    res.status(403).json({
      success: false,
      message: "Forbidden - Admin access required",
    });
    return;
  }

  next();
};

