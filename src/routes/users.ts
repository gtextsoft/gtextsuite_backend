import express from 'express';
import { registerUser, registerAdmin, loginUser } from '../controllers/auth';
import { loginValidationRules, signUpValidationRules } from '../validators/auth.validators';


const router = express.Router();

router.post("/register", signUpValidationRules, registerUser);
router.post("/register-admin", signUpValidationRules, registerAdmin); // Admin registration with secret key
router.post("/login", loginValidationRules, loginUser);

export default router;