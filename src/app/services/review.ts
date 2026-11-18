
import { Injectable, signal } from '@angular/core';

export interface Review {
  reviewId: number;
  bookTitle: string;
  genre: string;
  reviewText: string;
  rating: number;
  isRecommended: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

    reviews = signal<Review[]>([
    {
        reviewId: 1,
        bookTitle: 'The Hobbit',
        genre: 'Fantasy',
        reviewText: 'An amazing adventure with a wonderful story.',
        rating: 5,
        isRecommended: true
    },
    {
        reviewId: 2,
        bookTitle: 'Atomic Habits',
        genre: 'Self-Help',
        reviewText: 'Very useful ideas for building better habits.',
        rating: 4,
        isRecommended: true
    },
    {
        reviewId: 3,
        bookTitle: 'The Alchemist',
        genre: 'Fiction',
        reviewText: 'An interesting story about following your dreams.',
        rating: 4,
        isRecommended: true
    }
    ]);

    addReview(review: Review) {
    this.reviews.update(reviews => [
        ...reviews,
        {
        ...review,
        reviewId: Date.now()
        }
    ]);
    }
}
