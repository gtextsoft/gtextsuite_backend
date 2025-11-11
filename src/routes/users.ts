import express from 'express';
import { registerUser } from '../controllers/auth';
import { signUpValidationRules } from '../validators/auth.validators';


const router = express.Router();

router.post("/register", signUpValidationRules, registerUser);

export default router;