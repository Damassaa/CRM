import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimit';
import { asyncHandler } from '../../middlewares/errorHandler';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', authLimiter, asyncHandler(authController.login.bind(authController)));
router.post('/refresh', asyncHandler(authController.refreshToken.bind(authController)));
router.post('/password/request-reset', authLimiter, asyncHandler(authController.requestPasswordReset.bind(authController)));
router.post('/password/reset', asyncHandler(authController.resetPassword.bind(authController)));
router.post('/invite/accept', asyncHandler(authController.setPassword.bind(authController)));

// Super admin login
router.post('/super-admin/login', authLimiter, asyncHandler(authController.superAdminLogin.bind(authController)));

// Protected routes
router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));
router.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));

export default router;
