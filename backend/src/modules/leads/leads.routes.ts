import { Router } from 'express';
import { LeadController } from './leads.controller';
import { authenticate } from '../../middlewares/auth';
import { verifyTenantAccess, checkTenantLimit } from '../../middlewares/tenant';
import { asyncHandler } from '../../middlewares/errorHandler';

const router = Router();
const leadController = new LeadController();

// All routes require authentication and tenant verification
router.use(authenticate);
router.use(verifyTenantAccess);

// Kanban board view
router.get('/kanban', asyncHandler(leadController.getKanbanBoard.bind(leadController)));

// List and get
router.get('/', asyncHandler(leadController.list.bind(leadController)));
router.get('/:id', asyncHandler(leadController.getById.bind(leadController)));

// Create, update, delete
router.post(
  '/',
  checkTenantLimit('leads'),
  asyncHandler(leadController.create.bind(leadController))
);
router.patch('/:id', asyncHandler(leadController.update.bind(leadController)));
router.delete('/:id', asyncHandler(leadController.delete.bind(leadController)));

// Move lead
router.post('/:id/move', asyncHandler(leadController.move.bind(leadController)));

// Activities
router.get('/:id/activities', asyncHandler(leadController.getActivities.bind(leadController)));
router.post('/:id/activities', asyncHandler(leadController.addActivity.bind(leadController)));

// History
router.get('/:id/history', asyncHandler(leadController.getHistory.bind(leadController)));

export default router;
