
/**
 * Behavior-focused tests for ReviewCreateComponent.
 * Tests form validation, review creation, and error handling.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { ReviewCreateComponent } from './review-create.component';
import { ReviewService } from '../services/review-list.service';

describe('ReviewCreateComponent', () => {
  let fixture: ComponentFixture<ReviewCreateComponent>;
  let createReview: jest.Mock;
  let router: Router;

  beforeEach(async () => {
    createReview = jest.fn();

    await TestBed.configureTestingModule({
      imports: [ReviewCreateComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ReviewService,
          useValue: { createReview }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewCreateComponent);
    router = TestBed.inject(Router);

    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  it('should display the Create Review heading', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent)
      .toContain('Create Review');
  });

  it('should show validation errors when required fields are empty', () => {
    const form = fixture.componentInstance.reviewForm;

    form.controls.bookId.setValue(0);
    form.controls.rating.setValue(0);
    form.controls.reviewText.setValue('');

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#bookId-error')).not.toBeNull();
    expect(el.querySelector('#rating-error')).not.toBeNull();
    expect(el.querySelector('#reviewText-error')).not.toBeNull();

    expect(createReview).not.toHaveBeenCalled();
  });

  it('should create a review with valid form data', () => {
    const createdReview = {
      reviewId: 42,
      bookId: 1,
      rating: 5,
      reviewText: 'Great book!',
      isRecommended: true,
      datePosted: '2026-11-17'
    };

    createReview.mockReturnValue(of(createdReview));

    const form = fixture.componentInstance.reviewForm;

    form.controls.bookId.setValue(1);
    form.controls.rating.setValue(5);
    form.controls.reviewText.setValue('Great book!');
    form.controls.isRecommended.setValue(true);

    fixture.detectChanges();

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(createReview).toHaveBeenCalledWith(
      expect.objectContaining({
        bookId: 1,
        rating: 5,
        reviewText: 'Great book!',
        isRecommended: true
      })
    );

    expect(router.navigate).toHaveBeenCalled();
  });

  it('should display an error when review creation fails', () => {
    createReview.mockReturnValue(
      throwError(() => new Error('Failed to create review'))
    );

    const form = fixture.componentInstance.reviewForm;

    form.controls.bookId.setValue(1);
    form.controls.rating.setValue(4);
    form.controls.reviewText.setValue('Interesting story');
    form.controls.isRecommended.setValue(false);

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent)
      .toContain('Failed to create review');

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
