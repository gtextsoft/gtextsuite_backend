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
  // For cross-origin requests (frontend on different port), use "lax" or "none"
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("auth_token", token, {
    httpOnly: true, // Prevents client-side access to the cookie
    secure: isProduction, // Only set the cookie over HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (1 day)
    sameSite: isProduction ? "strict" : "lax", // "lax" allows cross-origin requests in development
    path: "/", // Cookie available for all paths
  });

  return;
};
