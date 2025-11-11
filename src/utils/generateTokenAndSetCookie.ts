import { Response } from "express";
import jwt from "jsonwebtoken";
import { generateToken } from "./jwt.util";

export const generateTokenAndSetCookie = (res: Response, userId: string) => {
  const jwtSecret = process.env.JWT_SECRET_KEY as string;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  const token = generateToken({ userId }, jwtSecret, "1d");

  // Set the token in the response as an HttpOnly cookie
  res.cookie("auth_token", token, {
    httpOnly: true, // Prevents client-side access to the cookie
    secure: process.env.NODE_ENV === "production", // Only set the cookie over HTTPS in production
    maxAge: 3600000, // Set the cookie's expiration time in milliseconds (1 hour)
    sameSite: "strict", // Set SameSite attribute to prevent CSRF attacks
  });

  return;
};
