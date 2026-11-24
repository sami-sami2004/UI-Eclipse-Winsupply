import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ReviewDetailCard } from './components/review-detail-card/review-detail-card';
import { Review, ReviewService } from '../../services/review';
import { BooksService } from '../../services/book';
import { GenresService } from '../../services/genres';

@Component({
  imports: [ReviewDetailCard],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly reviewService = inject(ReviewService);
  private readonly bookService = inject(BooksService);
  private readonly genresService = inject(GenresService);

  readonly searchText = signal('');

  private readonly allReviews = toSignal(
    forkJoin({
      reviews: this.reviewService.getReviews(),
      books: this.bookService.getBooks(),
      genres: this.genresService.getGenres(),
    }).pipe(
      map(({ reviews, books, genres }): Review[] =>
        reviews.map(review => {
          const book = books.find(b => b.bookId === review.bookId);
          const genre = genres.find(g => g.genreId === book?.genreId);
          return {
            reviewId: review.reviewId,
            bookTitle: book?.title ?? 'Unknown book',
            genre: genre?.genreName ?? 'Unknown genre',
            reviewText: review.reviewText,
            rating: review.rating,
            isRecommended: review.isRecommended,
          };
        })
      ),
      catchError(error => {
        console.error('Error loading dashboard data:', error);
        return of<Review[]>([]);
      })
    ),
    { initialValue: [] }
  );

  readonly recentReviews = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const reviews = this.allReviews();
    if (!search) {
      return reviews;
    }
    return reviews.filter(review => review.genre.toLowerCase().includes(search));
  });

  onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }
}