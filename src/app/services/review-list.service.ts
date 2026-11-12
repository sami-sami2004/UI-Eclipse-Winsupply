
/**
 * Review domain service. Syncs with Bookish.
 *
 * Backend: GET reviews, GET by ID, POST create.
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Review {
  reviewId: number;
  bookId: number;
  rating: number;
  reviewText: string;
  isRecommended: boolean;
  datePosted: string;
}

export interface ReviewCreateRequest {
  bookId: number;
  rating: number;
  reviewText: string;
  isRecommended: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly apiService = inject(ApiService);

  private readonly _reviews = signal<Review[]>([]);
  private readonly _loadError = signal<string | null>(null);

  readonly reviews = this._reviews.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  readonly summary = computed(() => {
    const reviews = this._reviews();

    const recommended = reviews.filter(
      review => review.isRecommended
    ).length;

    const averageRating = reviews.length > 0
      ? reviews.reduce(
          (sum, review) => sum + review.rating, 0
        ) / reviews.length
      : 0;

    return {
      totalReviews: reviews.length,
      recommendedReviews: recommended,
      notRecommendedReviews: reviews.length - recommended,
      averageRating: Number(averageRating.toFixed(1))
    };
  });

  /** GET /review */
  reloadReviews(): Observable<Review[]> {
    this._loadError.set(null);

    return this.apiService.get<Review[]>('review').pipe(
      map(response => {
        const rows = Array.isArray(response.data)
          ? response.data
          : [];

        this._reviews.set(rows);
        return rows;
      }),
      tap({
        error: err => {
          this._reviews.set([]);
          this._loadError.set(
            this.toErrorMessage(err, 'Failed to load reviews')
          );
        }
      })
    );
  }

  /** GET /review/{id} */
  getReviewById(reviewId: number): Observable<Review> {
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return throwError(
        () => new Error(`Invalid review ID: ${reviewId}`)
      );
    }

    return this.apiService.get<Review>(
      `review/${reviewId}`
    ).pipe(
      map(response => {
        if (!response.data) {
          throw new Error(`Review ${reviewId} not found`);
        }

        this.upsertLocal(response.data);
        return response.data;
      })
    );
  }

  /** POST /review */
  createReview(request: ReviewCreateRequest): Observable<Review> {
    const payload = {
      ...request,
      bookId: Number(request.bookId),
      rating: Number(request.rating),
      reviewText: request.reviewText.trim()
    };

    return this.apiService.post<Review>(
      'review', payload
    ).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Create review returned no data');
        }

        this.upsertLocal(response.data);
        return response.data;
      })
    );
  }

  private upsertLocal(review: Review): void {
    this._reviews.update(reviews => {
      const index = reviews.findIndex(
        item => item.reviewId === review.reviewId
      );

      if (index === -1) {
        return [...reviews, review];
      }

      return reviews.map(item =>
        item.reviewId === review.reviewId ? review : item
      );
    });
  }

  private toErrorMessage(
    err: unknown,
    fallback: string
  ): string {
    if (err instanceof Error && err.message) {
      return err.message;
    }

    return fallback;
  }
}
