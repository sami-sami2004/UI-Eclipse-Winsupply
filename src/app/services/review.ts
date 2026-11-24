import { Injectable, signal,inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { map } from 'rxjs/operators';

export interface Review {
  reviewId: number;
  bookTitle: string;
  genre: string;
  reviewText: string;
  rating: number;
  isRecommended: boolean;
}

export interface BackendReview {
  reviewId: number;
  bookId: number;
  reviewText: string;
  rating: number;
  isRecommended: boolean;
  datePosted: number[];
}

export interface CreateReviewRequest {
  bookId: number;
  reviewText: string;
  rating: number;
  isRecommended: boolean;
  datePosted: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

    private apiService = inject(ApiService);

    reviews = signal<Review[]>([]);

    addReview(review: Review) {
    this.reviews.update(reviews => [
        ...reviews,
        {
        ...review,
        reviewId: Date.now()
        }
    ]);
    }

    getReviews(): Observable<BackendReview[]> {
  return this.apiService.get<BackendReview[]>('review').pipe(
    map(response => response.data)
  );
}
createReview(review: CreateReviewRequest): Observable<BackendReview> {
    return this.apiService.post<BackendReview>('review', review).pipe(
      map(response => response.data)
    );
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.apiService.delete(`review/${reviewId}`);
  }
}
