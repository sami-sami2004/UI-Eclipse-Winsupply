
import { Component, input } from '@angular/core';
import { Review } from '../../../../services/review';

@Component({
  selector: 'app-review-detail-card',
  imports: [],
  templateUrl: './review-detail-card.html',
  styleUrl: './review-detail-card.scss',
})
export class ReviewDetailCard {
  review = input.required<Review>();
}
