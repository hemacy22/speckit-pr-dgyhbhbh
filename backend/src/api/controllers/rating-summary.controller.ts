import { Request, Response, NextFunction } from 'express';
import { ratingSummaryService } from '../../services/rating-summary.service';
import { createApiError } from '../middleware/error-handler.middleware';

/**
 * Get rating summary for a product
 * GET /products/:id/rating-summary
 */
export async function getRatingSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw createApiError('Invalid product ID format', 400);
    }

    // Get rating summary
    const summary = await ratingSummaryService.getRatingSummary(id);

    // Return response
    res.status(200).json(summary);
  } catch (error) {
    // Handle known errors
    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return next(createApiError('Product not found', 404));
      }
    }

    // Pass to error handler
    next(error);
  }
}
