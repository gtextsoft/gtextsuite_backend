import User from "../models/user";
import { Request, Response } from "express";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie";
import { validationResult } from "express-validator";
import { randomBytes } from "crypto";
// import { sendVerificationEmail } from "../services/emailService";

const registerUser = async (req: Request, res: Response) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    try {
        const { email, password, firstName, lastName, phoneNumber } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User Credentials already exist',
            });
            return;
        }

        // Generate verification token using Node crypto for secure randomness
        const verificationToken = (
            (parseInt(randomBytes(3).toString("hex"), 16) % 900000) +
            100000
        ).toString();

        const verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const newUser = new User({ email, password, firstName, lastName, phoneNumber,  isVerified: false, roles: ["user"], verificationToken, verificationTokenExpiresAt });

        await newUser.save();

        // await sendVerificationEmail(email, verificationToken);

        // generateTokenAndSetCookie(res, savedUser._id);
        //update loginDate
        // savedUser.lastLoginDate = new Date();
        // await savedUser.save();
        // res.status(201).json({
        //     success: true,
        //     message: 'User registered successfully',
        //     user: savedUser,
        // });
        res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your email.",
            user: {
              _id: newUser._id,
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              phoneNumber: newUser.phoneNumber,
              roles: newUser.roles,
              isVerified: newUser.isVerified,
            },
        });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong During Registration',
        });
    }
}


const loginUser = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        res.status(400).json({ success: false, message: "Invalid credentials" });
        return;
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(400).json({ success: false, message: "Invalid credentials" });
        return;
      }
  
      // generate token and setCookie
      generateTokenAndSetCookie(res, user._id as string);
  
      //update loginDate
      user.lastLoginDate = new Date();
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Login Successfully.",
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          roles: user.roles,
          isVerified: user.isVerified,
        },
      });
      return;
    } catch (error) {
      console.log("Error during Login", error);
      res.status(500).json({ success: false, message: "Something went wrong.", error: error });
      return;
    }
  };
  
//   const logOut = async (req: Request, res: Response) => {
//     try {
//       res.clearCookie("auth_token");
  
//       // Send a success response
//       res.status(200).json({ success: true, message: "Logged out successfully" });
//       return;
//     } catch (error) {
//       console.error("Error during Logout:", error);
//       res
//         .status(500)
//         .json({ success: false, message: "Something went wrong during logout." });
//       return;
//     }
//   };
  
//   export const verifyEmail = async (req: Request, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       res.status(400).json({ errors: errors.array() });
//       return;
//     }
//     try {
//       const { userId, verificationToken } = req.body;
  
//       if (!userId || !verificationToken) {
//         res.status(400).json({
//           message: "Please provide the required credentials for verification.",
//         });
//         return;
//       }
  
//       if (!mongoose.Types.ObjectId.isValid(userId)) {
//         res.status(400).json({ message: "Invalid user ID format." });
//         return;
//       }
  
//       // Find user by email
//       const user = await User.findOne({
//         _id: userId,
//       });
  
//       if (!user) {
//         res.status(404).json({ message: "User not found" });
//         return;
//       }
  
//       // Verify the token
//       if (
//         user.verificationToken !== verificationToken ||
//         (user.verificationTokenExpiresAt &&
//           new Date(user.verificationTokenExpiresAt) < new Date())
//       ) {
//         res
//           .status(400)
//           .json({ message: "Invalid or expired verification token." });
//         return;
//       }
  
//       // Update the user to mark as verified
//       user.isVerified = true;
//       user.verificationToken = undefined;
//       user.verificationTokenExpiresAt = undefined;
  
//       await user.save();
  
//       await sendWelcomeEmail(user.email, user.firstName, user.lastName);
  
//       res.status(200).json({
//         success: true,
//         message: "Email successfully verified.",
//       });
//       return;
//     } catch (error) {
//       console.error("Error during email verification:", error);
//       res.status(500).json({
//         success: false,
//         message: "Something went wrong.",
//       });
//       return;
//     }
//   };
  
//   export const forgotPassword = async (req: Request, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       res.status(400).json({ errors: errors.array() });
//       return;
//     }
//     const { email } = req.body;
//     try {
//       const user = await User.findOne({ email });
//       if (!user) {
//         res.status(400).json({ success: false, message: "Invalid credentials" });
//         return;
//       }
//       // Generate a secure random reset token
//       const resetToken = crypto.randomBytes(20).toString("hex");
//       const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  
//       user.resetPasswordToken = resetToken;
//       user.resetPasswordExpireAt = resetTokenExpiresAt;
  
//       // verificationLink
//       const verificationLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
//       await user.save();
  
//       await sendPasswordResetEmail(user.email, verificationLink);
//       res.status(200).json({
//         success: true,
//         message: "Password reset link sent to your email",
//       });
//       return;
//     } catch (error) {
//       console.error("Error during forgotPassword:", error);
//       res.status(400).json({
//         success: false,
//         message: "Something went wrong.",
//       });
//       return;
//     }
//   };
  
//   export const resetPassword = async (req: Request, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       res.status(400).json({ errors: errors.array() });
//       return;
//     }
//     const { token } = req.params;
//     const { password } = req.body;
//     try {
//       const user = await User.findOne({
//         resetPasswordToken: token,
//         resetPasswordExpiresAt: { $gt: Date.now() },
//       });
  
//       if (!user) {
//         res
//           .status(400)
//           .json({ success: false, message: "Invalid or expired reset token" });
//         return;
//       }
  
//       // Update the user's password
//       user.password = password;
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpireAt = undefined;
//       await user.save();
  
//       await sendResetSuccessEmail(user.email);
  
//       res
//         .status(200)
//         .json({ success: true, message: "Password reset successful" });
//       return;
//     } catch (error) {
//       console.error("Error during resetPassword:", error);
//       res.status(400).json({
//         success: false,
//         message: "Something went wrong.",
//       });
//       return;
//     }
//   };

// Register admin user (requires secret key)
const registerAdmin = async (req: Request, res: Response) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { email, password, firstName, lastName, phoneNumber, adminSecret } = req.body;

    // Check admin secret key (should be in .env file)
    const requiredSecret = process.env.ADMIN_SECRET_KEY;
    if (!requiredSecret) {
      res.status(500).json({
        success: false,
        message: "Admin registration not configured",
      });
      return;
    }

    if (adminSecret !== requiredSecret) {
      res.status(403).json({
        success: false,
        message: "Invalid admin secret key",
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Generate verification token
    const verificationToken = (
      (parseInt(randomBytes(3).toString("hex"), 16) % 900000) + 100000
    ).toString();

    const verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create admin user with admin role
    const newAdmin = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      isVerified: true, // Admin can be auto-verified
      roles: ["admin"],
      verificationToken,
      verificationTokenExpiresAt,
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      user: {
        _id: newAdmin._id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        phoneNumber: newAdmin.phoneNumber,
        roles: newAdmin.roles,
        isVerified: newAdmin.isVerified,
      },
    });
  } catch (error: any) {
    console.log("Error during admin registration:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong during admin registration",
    });
  }
};

export { registerUser, loginUser, registerAdmin };