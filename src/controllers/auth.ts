import User from "../models/user";
import { Request, Response } from "express";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie";
import { validationResult } from "express-validator";

const registerUser = async (req: Request, res: Response) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    try {
        const { email, password, firstName, lastName, phoneNumber } = req.body ?? {};

        // Guard against missing body payload to avoid runtime undefined access.
        if (!email || !password || !firstName || !lastName || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Required registration fields are missing',
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            });
        }

        // Generate verification token
        // const verificationToken = (
        //     (parseInt(crypto.randomBytes(3).toString("hex"), 16) % 900000) +
        //     100000
        // ).toString();

        // const verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        let user = new User({ email, password, firstName, lastName, phoneNumber });
        const savedUser = await user.save();
        generateTokenAndSetCookie(res, savedUser._id);
        //update loginDate
        // savedUser.lastLoginDate = new Date();
        // await savedUser.save();
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: savedUser,
        });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong During Registration',
        });
    }
}

export { registerUser };