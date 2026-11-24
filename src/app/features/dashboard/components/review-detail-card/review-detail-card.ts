import { Component,input,output } from '@angular/core';
import { Review } from '../../../../services/review';

@Component({
  imports: [],
  selector: 'app-review-detail-card',
  styleUrl: './review-detail-card.scss',
  templateUrl: './review-detail-card.html',
})
export class ReviewDetailCard {
    review = input.required<Review>();
    delete = output<number>();
}
