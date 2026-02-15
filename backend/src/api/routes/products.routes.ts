import { Router } from 'express';
import { getRatingSummary } from '../controllers/rating-summary.controller';

const router = Router();

/**
 * GET /products/:id/rating-summary
 * Get aggregated rating summary for a product
 */
router.get('/:id/rating-summary', getRatingSummary);

export default router;
