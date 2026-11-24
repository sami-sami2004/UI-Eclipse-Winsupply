
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BooksService, Book } from '../../services/book';
import { ReviewService, CreateReviewRequest } from '../../services/review';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-create-review',
  styleUrl: './create-review.scss',
  templateUrl: './create-review.html',
})
export class CreateReview {

  private bookService = inject(BooksService);
  private reviewService = inject(ReviewService);

  books = signal<Book[]>([]);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  reviewForm = new FormGroup({
    bookId: new FormControl('', Validators.required),
    reviewText: new FormControl('', [
      Validators.required,
      Validators.minLength(10)
    ]),
    rating: new FormControl('', [
      Validators.required,
      Validators.min(1),
      Validators.max(5)
    ]),
    isRecommended: new FormControl('true', Validators.required)
  });

  constructor() {
    this.bookService.getBooks().subscribe({
      next: books => this.books.set(books),
      error: error => {
        console.error('Error loading books:', error);
        this.errorMessage.set('Could not load books. Please try again.');
      }
    });
  }

  onSubmit(): void {
    this.reviewForm.markAllAsTouched();

    if (this.reviewForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.reviewForm.getRawValue();

    const review: CreateReviewRequest = {
      bookId: Number(formValue.bookId),
      reviewText: formValue.reviewText!,
      rating: Number(formValue.rating),
      isRecommended: formValue.isRecommended === 'true',
      datePosted: new Date().toISOString().slice(0, 19)
    };

    this.reviewService.createReview(review).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Review submitted successfully!');
        this.reviewForm.reset({
          bookId: '',
          reviewText: '',
          rating: '',
          isRecommended: 'true'
        });
      },
      error: error => {
        console.error('Error submitting review:', error);
        this.isSubmitting.set(false);
        this.errorMessage.set('Could not submit review. Please try again.');
      }
    });
  }
}
