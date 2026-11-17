
/**
 * Review detail page. Route `/review/:id`.
 *
 * Loads a review by its ID and displays its book title.
 */
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ReviewService } from '../services/review-list.service';

interface Review {
  reviewId: number;
  bookId: number;
  rating: number;
  reviewText: string;
  isRecommended: boolean;
  datePosted: string;
}

interface Book {
  title: string;
}

const NUMERIC_ID = /^\d+$/;

@Component({
  selector: 'app-review-detail',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './review-detail.component.html',
  styleUrl: './review-detail.component.scss'
})
export class ReviewDetailComponent {
  id = input.required<string>();

  private readonly reviewService = inject(ReviewService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  review = signal<Review | null>(null);
  bookTitle = signal<string>('Loading book...');
  isLoading = signal(false);
  error = signal<string | null>(null);

  private requestSeq = 0;

  readonly formattedDate = computed(() => {
    const currentReview = this.review();

    if (!currentReview) {
      return 'Not set';
    }

    return this.formatDateValue(currentReview.datePosted);
  });

  constructor() {
    effect(() => {
      const reviewId = this.id();

      if (reviewId) {
        void this.loadReview(reviewId);
      } else {
        this.router.navigate(['/review/list']);
      }
    });
  }

  /** Loads one review by its ID. */
  private async loadReview(id: string): Promise<void> {
    if (!NUMERIC_ID.test(id)) {
      this.error.set('Invalid review ID');
      this.review.set(null);
      return;
    }

    const seq = ++this.requestSeq;
    const numericId = Number(id);

    this.isLoading.set(true);
    this.error.set(null);
    this.review.set(null);
    this.bookTitle.set('Loading book...');

    try {
      const review = await firstValueFrom(
        this.reviewService.getReviewById(numericId)
      );

      if (seq !== this.requestSeq || this.id() !== id) {
        return;
      }

      this.review.set(review);

      await this.loadBookTitle(review.bookId, seq);

    } catch {
      if (seq !== this.requestSeq || this.id() !== id) {
        return;
      }

      this.error.set('Failed to load review');
      this.review.set(null);

    } finally {
      if (seq === this.requestSeq) {
        this.isLoading.set(false);
      }
    }
  }

  /** Loads the title of the book associated with the review. */
  private async loadBookTitle(
    bookId: number,
    seq: number
  ): Promise<void> {
    try {
      const book = await firstValueFrom(
        this.http.get<Book>(
          `http://localhost:8080/bookish/book/${bookId}`
        )
      );

      if (seq === this.requestSeq) {
        this.bookTitle.set(book.title);
      }

    } catch {
      if (seq === this.requestSeq) {
        this.bookTitle.set(`Book #${bookId}`);
      }
    }
  }

  /** Returns to the Review List. */
  onBack(): void {
    this.router.navigate(['/review/list']);
  }

  /** Formats the date the review was posted. */
  private formatDateValue(
    date: Date | string | null | undefined
  ): string {
    if (!date) return 'Not set';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return 'Not set';

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
