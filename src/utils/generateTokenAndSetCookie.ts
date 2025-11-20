import { Response } from "express";
// import jwt from "jsonwebtoken";
import { generateToken } from "./jwt.util";

export const generateTokenAndSetCookie = (res: Response, userId: string) => {
  const jwtSecret = process.env.JWT_SECRET_KEY as string;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  const token = generateToken({ userId }, jwtSecret, "1d");

  // Set the token in the response as an HttpOnly cookie
  // For cross-origin requests (frontend on different domain), use "none" with secure: true
  const isProduction = process.env.NODE_ENV === "production";
  
  // CRITICAL: For cross-origin cookies (different domains like Render + Vercel):
  // - sameSite MUST be "none" for cross-origin
  // - secure MUST be true when sameSite is "none" (requires HTTPS)
  res.cookie("auth_token", token, {
    httpOnly: true, // Prevents client-side access to the cookie
    secure: isProduction, // MUST be true for sameSite: "none" (HTTPS required in production)
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (1 day)
    sameSite: isProduction ? "none" : "lax", // "none" REQUIRED for cross-origin in production
    path: "/", // Cookie available for all paths
    // Don't set domain - let browser handle it automatically for cross-origin
  });

  return;
};
