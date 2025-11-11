import { body } from "express-validator";

export const signUpValidationRules = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("firstName").notEmpty().withMessage("First name is required."),
  body("lastName").notEmpty().withMessage("Last name is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
];
export const loginValidationRules = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
];

export const verifyEmailValidationRules = [
  // Validate userId: Must be a 24-character hexadecimal string
  body("userId")
    .notEmpty()
    .withMessage("userId is required.")
    .isLength({ min: 24, max: 24 })
    .withMessage("User ID must be exactly 24 characters long.")
    .isHexadecimal()
    .withMessage("User ID must be a valid hexadecimal string."),

  // Validate verificationToken: Must be a 6-digit number
  body("verificationToken")
    .notEmpty()
    .withMessage("verificationToken is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification token must be exactly 6 digits long.")
    .isNumeric()
    .withMessage("Verification token must be a numeric value."),
];
export const forgotPasswordValidationRules = [
  body("email").isEmail().withMessage("A valid email is required."),
];