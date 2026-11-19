import { Component,inject,signal,afterNextRender } from '@angular/core';
// import { GenreFilter } from './components/genre-filter/genre-filter';
import {ReviewDetailCard} from './components/review-detail-card/review-detail-card';
import { ReviewService } from '../../services/review';
import { forkJoin } from 'rxjs';
import { BooksService } from '../../services/book';
import { GenresService } from '../../services/genres';

@Component({
  imports: [ ReviewDetailCard],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  reviewService = inject(ReviewService);
  bookService = inject(BooksService);
  genresService = inject(GenresService);

  searchText = signal('');

  get recentReviews() {
    const reviews = this.reviewService.reviews();
    const search = this.searchText().toLowerCase().trim();


    if (search === '') {
    return reviews;
  }

  return reviews.filter(review =>
    review.genre.toLowerCase().includes(search)
  );
    
}

  constructor() {
  afterNextRender(() => {
    forkJoin({
        reviews: this.reviewService.getReviews(),
        books: this.bookService.getBooks(),
        genres: this.genresService.getGenres()
      }).subscribe({
        next: ({ reviews, books, genres }) => {
          const dashboardReviews = reviews.map(review => {
          const book = books.find(book => book.bookId === review.bookId);
          const genre = genres.find(genre => genre.genreId === book?.genreId);

          return {
            reviewId: review.reviewId,
            bookTitle: book?.title ?? 'Unknown book',
            genre: genre?.genreName ?? 'Unknown genre',
            reviewText: review.reviewText,
            rating: review.rating,
            isRecommended: review.isRecommended
          };
        });

        this.reviewService.reviews.set(dashboardReviews);
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
        }
      });
  });
}

}


