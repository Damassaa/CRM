import { Router } from 'express';
import { TenantController } from './tenants.controller';
import { authenticateSuperAdmin } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/errorHandler';

const router = Router();
const tenantController = new TenantController();

// All routes require super admin authentication
router.use(authenticateSuperAdmin);

// Stats
router.get('/stats', asyncHandler(tenantController.getStats.bind(tenantController)));

// CRUD
router.get('/', asyncHandler(tenantController.list.bind(tenantController)));
router.get('/:id', asyncHandler(tenantController.getById.bind(tenantController)));
router.post('/', asyncHandler(tenantController.create.bind(tenantController)));
router.patch('/:id', asyncHandler(tenantController.update.bind(tenantController)));
router.delete('/:id', asyncHandler(tenantController.delete.bind(tenantController)));

// Metrics
router.get('/:id/metrics', asyncHandler(tenantController.getTenantMetrics.bind(tenantController)));

export default router;
