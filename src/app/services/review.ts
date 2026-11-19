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
}
