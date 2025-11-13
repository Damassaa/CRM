import { Router } from 'express';
import { ColumnController } from './columns.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { verifyTenantAccess, checkTenantLimit } from '../../middlewares/tenant';
import { asyncHandler } from '../../middlewares/errorHandler';

const router = Router();
const columnController = new ColumnController();

// All routes require authentication and tenant verification
router.use(authenticate);
router.use(verifyTenantAccess);

// List and get
router.get('/', asyncHandler(columnController.list.bind(columnController)));
router.get('/:id', asyncHandler(columnController.getById.bind(columnController)));

// Create, update, delete - require admin
router.post(
  '/',
  requireAdmin,
  checkTenantLimit('pipelines'),
  asyncHandler(columnController.create.bind(columnController))
);
router.patch('/:id', requireAdmin, asyncHandler(columnController.update.bind(columnController)));
router.delete('/:id', requireAdmin, asyncHandler(columnController.delete.bind(columnController)));

// Reorder
router.post('/reorder', requireAdmin, asyncHandler(columnController.reorder.bind(columnController)));

export default router;
