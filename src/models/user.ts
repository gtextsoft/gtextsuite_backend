import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserType = {
  email: string;
  lastName: string;
  firstName: string;
  phoneNumber: string;
  password: string;
  isVerified: boolean;
  lastLoginDate?: Date; 
  roles: string[];
  resetPasswordToken?: string;
  resetPasswordExpireAt?: Date;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
};

// Extend the base user properties with model instance helpers
export interface UserDocument extends UserType, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// Define the schema
const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    lastName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    lastLoginDate: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    roles: { type: [String], enum: ["user", "admin", "moderator"], default: ["user"] }, // default added
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpireAt: { type: Date, default: null },
    verificationToken: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

// Create TTL index for resetPasswordExpiresAt field
userSchema.index({ resetPasswordExpireAt: 1 }, { expireAfterSeconds: 0 });

// userSchema.methods.comparePassword = async function (enteredPassword: string) {
//   return bcrypt.compare(enteredPassword, this.password);
// };

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
