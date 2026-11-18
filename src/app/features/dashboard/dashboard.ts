import { Component,inject,signal } from '@angular/core';
// import { GenreFilter } from './components/genre-filter/genre-filter';
import {ReviewDetailCard} from './components/review-detail-card/review-detail-card';
import { ReviewService } from '../../services/review';

@Component({
  imports: [ ReviewDetailCard],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  reviewService = inject(ReviewService);

  searchText = signal('');
  selectedGenre = signal('All');


  get recentReviews() {
    return this.reviewService.reviews();
  }
}


