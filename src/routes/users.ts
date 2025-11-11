import express from 'express';
import { registerUser, loginUser } from '../controllers/auth';
import { loginValidationRules, signUpValidationRules } from '../validators/auth.validators';


const router = express.Router();

router.post("/register", signUpValidationRules, registerUser);
router.post("/login", loginValidationRules, loginUser);

export default router;