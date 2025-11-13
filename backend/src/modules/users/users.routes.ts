import { Router } from 'express';
import { UserController } from './users.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { verifyTenantAccess, checkTenantLimit } from '../../middlewares/tenant';
import { asyncHandler } from '../../middlewares/errorHandler';

const router = Router();
const userController = new UserController();

// All routes require authentication, tenant verification, and admin role
router.use(authenticate);
router.use(verifyTenantAccess);
router.use(requireAdmin);

// CRUD
router.get('/', asyncHandler(userController.list.bind(userController)));
router.get('/:id', asyncHandler(userController.getById.bind(userController)));
router.post(
  '/',
  checkTenantLimit('users'),
  asyncHandler(userController.invite.bind(userController))
);
router.patch('/:id', asyncHandler(userController.update.bind(userController)));
router.delete('/:id', asyncHandler(userController.delete.bind(userController)));

// Resend invite
router.post('/:id/resend-invite', asyncHandler(userController.resendInvite.bind(userController)));

export default router;
