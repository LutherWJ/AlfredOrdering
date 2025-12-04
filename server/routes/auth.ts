import express from 'express';
import { authenticateToken } from "../middleware/auth.ts";
import { login, logout, me } from "../controllers/authController.ts";

const router = express.Router();

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', authenticateToken, me);

export default router;
