import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RatingSummary } from './RatingSummary';
import * as ratingApiService from '../../services/rating-api.service';
import { HttpError, NotFoundError } from '../../types/api.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the API service
jest.mock(' ../../services/rating-api.service');

describe('RatingSummary Component', () => {
  const mockFetchRatingSummary = ratingApiService.fetchRatingSummary as jest.MockedFunction<
    typeof ratingApiService.fetchRatingSummary
  >;
  const testProductId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      mockFetchRatingSummary.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<RatingSummary productId={testProductId} />);

      expect(screen.getByText('Loading ratings...')).toBeInTheDocument();
    });

    it('should have aria-busy=true during loading', () => {
      mockFetchRatingSummary.mockImplementation(
        () => new Promise(() => {})
      );

      const { container } = render(<RatingSummary productId={testProductId} />);
      const loadingElement = container.querySelector('[aria-busy="true"]');

      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Success State - With Ratings', () => {
    it('should display average and count when data loads successfully', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.3,
        count: 127,
      });

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('4.3')).toBeInTheDocument();
        expect(screen.getByText('127 reviews')).toBeInTheDocument();
      });
    });

    it('should display average with exactly one decimal place', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.0,
        count: 50,
      });

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('4.0')).toBeInTheDocument();
      });
    });

    it('should display "review" singular for count of 1', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 5.0,
        count: 1,
      });

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('1 review')).toBeInTheDocument();
      });
    });

    it('should format large numbers correctly', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.5,
        count: 1234567,
      });

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText(/1\.2M reviews/)).toBeInTheDocument();
      });
    });

    it('should format thousands correctly', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.2,
        count: 5432,
      });

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText(/5\.4K reviews/)).toBeInTheDocument();
      });
    });
  });

  describe('Success State - No Ratings', () => {
    it('should display "No ratings yet" when count is 0', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 0.0,
        count: 0,
      });

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('No ratings yet')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      mockFetchRatingSummary.mockRejectedValue(
        new HttpError(500, 'Internal server error')
      );

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load ratings')).toBeInTheDocument();
      });
    });

    it('should display error for 404 not found', async () => {
      mockFetchRatingSummary.mockRejectedValue(
        new NotFoundError('Product not found')
      );

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load ratings')).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error element', async () => {
      mockFetchRatingSummary.mockRejectedValue(
        new HttpError(500, 'Error')
      );

      const { container } = render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        const alert = container.querySelector('[role="alert"]');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility - WCAG 2.2 AA', () => {
    it('should have aria-label with full descriptive text', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.3,
        count: 127,
      });

      const { container } = render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        const element = container.querySelector('[aria-label]');
        expect(element).toHaveAttribute(
          'aria-label',
          'Average rating 4.3 out of 5 stars based on 127 customer ratings'
        );
      });
    });

    it('should include screen-reader only text', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.3,
        count: 127,
      });

      render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        const srText = screen.getByText(
          'Average rating 4.3 out of 5 stars based on 127 customer ratings'
        );
        expect(srText).toHaveClass('srOnly');
      });
    });

    it('should have no axe accessibility violations', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.3,
        count: 127,
      });

      const { container } = render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('4.3')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in loading state', async () => {
      mockFetchRatingSummary.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ average: 4.3, count: 127 }), 100))
      );

      const { container } = render(<RatingSummary productId={testProductId} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in error state', async () => {
      mockFetchRatingSummary.mockRejectedValue(new HttpError(500, 'Error'));

      const { container } = render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load ratings')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with no ratings', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 0.0,
        count: 0,
      });

      const { container } = render(<RatingSummary productId={testProductId} />);

      await waitFor(() => {
        expect(screen.getByText('No ratings yet')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Component Updates', () => {
    it('should refetch data when productId changes', async () => {
      const productId1 = '550e8400-e29b-41d4-a716-446655440000';
      const productId2 = '550e8400-e29b-41d4-a716-446655440001';

      mockFetchRatingSummary
        .mockResolvedValueOnce({ average: 4.3, count: 127 })
        .mockResolvedValueOnce({ average: 3.5, count: 50 });

      const { rerender } = render(<RatingSummary productId={productId1} />);

      await waitFor(() => {
        expect(screen.getByText('4.3')).toBeInTheDocument();
      });

      rerender(<RatingSummary productId={productId2} />);

      await waitFor(() => {
        expect(screen.getByText('3.5')).toBeInTheDocument();
        expect(screen.getByText('50 reviews')).toBeInTheDocument();
      });

      expect(mockFetchRatingSummary).toHaveBeenCalledTimes(2);
    });

    it('should cleanup on unmount', async () => {
      mockFetchRatingSummary.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ average: 4.3, count: 127 }), 100))
      );

      const { unmount } = render(<RatingSummary productId={testProductId} />);

      unmount();

      // Component should not update state after unmount
      await waitFor(() => {}, { timeout: 200 });
      // If no errors thrown, cleanup worked correctly
    });
  });

  describe('Custom className', () => {
    it('should apply custom className prop', async () => {
      mockFetchRatingSummary.mockResolvedValue({
        average: 4.3,
        count: 127,
      });

      const { container } = render(
        <RatingSummary productId={testProductId} className="custom-class" />
      );

      await waitFor(() => {
        const element = container.querySelector('.custom-class');
        expect(element).toBeInTheDocument();
      });
    });
  });
});
