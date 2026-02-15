/**
 * Rating Summary response from API
 */
export interface RatingSummaryResponse {
  average: number; // 0.0 - 5.0
  count: number;   // Total number of ratings
}

/**
 * Props for RatingSummary component
 */
export interface RatingSummaryProps {
  productId: string;
  className?: string;
}

/**
 * Internal component state for loading/error handling
 */
export interface RatingSummaryState {
  data: RatingSummaryResponse | null;
  loading: boolean;
  error: string | null;
}
