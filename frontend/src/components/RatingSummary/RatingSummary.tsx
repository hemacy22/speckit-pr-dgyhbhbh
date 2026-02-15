import React, { useState, useEffect } from 'react';
import { fetchRatingSummary } from '../../services/rating-api.service';
import { RatingSummaryProps } from '../../types/rating.types';
import { HttpError } from '../../types/api.types';
import styles from './RatingSummary.module.css';

/**
 * RatingSummary Component
 * 
 * Displays product rating summary (average and count) with WCAG 2.2 AA accessibility
 * - Shows loading state during fetch
 * - Shows "No ratings yet" when count is 0
 * - Includes visible labels and screen-reader text
 * - Handles errors gracefully
 */
export const RatingSummary: React.FC<RatingSummaryProps> = ({ productId, className }) => {
  const [data, setData] = useState<{ average: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRatingSummary() {
      try {
        setLoading(true);
        setError(null);

        const summary = await fetchRatingSummary(productId);

        if (isMounted) {
          setData(summary);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof HttpError ? err.message : 'Failed to load ratings';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRatingSummary();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Format count for display (e.g., 1234567 -> "1.2M")
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Generate screen reader text
  const getScreenReaderText = (): string => {
    if (!data || data.count === 0) {
      return 'No customer ratings yet';
    }
    const plural = data.count === 1 ? 'rating' : 'ratings';
    return `Average rating ${data.average.toFixed(1)} out of 5 stars based on ${data.count} customer ${plural}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.container} ${className || ''}`} aria-live="polite" aria-busy="true">
        <span className={styles.loading}>Loading ratings...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.container} ${styles.error} ${className || ''}`} role="alert">
        <span>Unable to load ratings</span>
      </div>
    );
  }

  // No ratings
  if (!data || data.count === 0) {
    return (
      <div className={`${styles.container} ${className || ''}`} aria-label="No customer ratings yet">
        <span className={styles.noRatings}>No ratings yet</span>
        <span className={styles.srOnly}>{getScreenReaderText()}</span>
      </div>
    );
  }

  // Display ratings
  return (
    <div className={`${styles.container} ${className || ''}`} aria-label={getScreenReaderText()}>
      <div className={styles.ratingDisplay}>
        <span className={styles.label}>Rating:</span>
        <span className={styles.average}>{data.average.toFixed(1)}</span>
        <span className={styles.separator}>·</span>
        <span className={styles.count}>
          {formatCount(data.count)} {data.count === 1 ? 'review' : 'reviews'}
        </span>
      </div>
      {/* Screen reader only - full descriptive text */}
      <span className={styles.srOnly}>{getScreenReaderText()}</span>
    </div>
  );
};

export default RatingSummary;
