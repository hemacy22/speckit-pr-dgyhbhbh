import axios, { AxiosError } from 'axios';
import { RatingSummaryResponse } from '../types/rating.types';
import { HttpError, NotFoundError, ServiceUnavailableError } from '../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = 5000; // 5 second timeout

/**
 * Fetch rating summary for a product
 * 
 * @param productId Product UUID
 * @returns Rating summary data
 * @throws HttpError with appropriate status code
 */
export async function fetchRatingSummary(
  productId: string
): Promise<RatingSummaryResponse> {
  try {
    const response = await axios.get<RatingSummaryResponse>(
      `${API_BASE_URL}/products/${productId}/rating-summary`,
      {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error: { message: string } }>;

      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status;
        const message = axiosError.response.data?.error?.message || axiosError.message;

        if (status === 404) {
          throw new NotFoundError(message);
        } else if (status === 503) {
          throw new ServiceUnavailableError(message);
        } else {
          throw new HttpError(status, message);
        }
      } else if (axiosError.request) {
        // Request made but no response (network error)
        throw new ServiceUnavailableError('Network error: Unable to reach server');
      }
    }

    // Unknown error
    throw new HttpError(500, 'An unexpected error occurred');
  }
}
