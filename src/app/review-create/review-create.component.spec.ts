
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  provideHttpClient,
  HttpClient
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ReviewCreateComponent } from './review-create.component';
import { ReviewService } from '../services/review-list.service';

describe('ReviewCreateComponent', () => {
  let fixture: ComponentFixture<ReviewCreateComponent>;
  let httpMock: HttpTestingController;
  let createReview: jest.Mock;
  let router: Router;

  beforeEach(async () => {
    createReview = jest.fn();

    await TestBed.configureTestingModule({
      imports: [ReviewCreateComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ReviewService,
          useValue: { createReview }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewCreateComponent);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should display the Create Review heading', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent)
      .toContain('Create Review');
  });

  it('should validate required book and review fields', () => {
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Book Title is required');
    expect(el.textContent).toContain('Page Count is required');
    expect(el.textContent).toContain('Rating is required');

    expect(createReview).not.toHaveBeenCalled();
  });

  it('should create a book and then create its review', () => {
    createReview.mockReturnValue(of({
      reviewId: 42,
      bookId: 12,
      rating: 5,
      reviewText: 'Great book!',
      isRecommended: true,
      datePosted: '2026-11-17'
    }));

    const form = fixture.componentInstance.reviewForm;

    form.controls.title.setValue('The Hunger Games');
    form.controls.author.setValue('Suzanne Collins');
    form.controls.genreId.setValue(1);
    form.controls.pageCount.setValue(374);
    form.controls.rating.setValue(5);
    form.controls.reviewText.setValue('Great book!');
    form.controls.isRecommended.setValue(true);

    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne(
      'http://localhost:8080/bookish/book'
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'The Hunger Games',
      author: 'Suzanne Collins',
      genreId: 1,
      pageCount: 374
    });

    req.flush({
      bookId: 12,
      title: 'The Hunger Games',
      author: 'Suzanne Collins',
      genreId: 1,
      pageCount: 374
    });

    expect(createReview).toHaveBeenCalledWith({
      bookId: 12,
      rating: 5,
      reviewText: 'Great book!',
      isRecommended: true
    });

    expect(router.navigate).toHaveBeenCalledWith(['/review/list']);
  });

  it('should display an error if creating the book fails', () => {
    const form = fixture.componentInstance.reviewForm;

    form.controls.title.setValue('Test Book');
    form.controls.author.setValue('Test Author');
    form.controls.genreId.setValue(1);
    form.controls.pageCount.setValue(200);
    form.controls.rating.setValue(4);
    form.controls.reviewText.setValue('Interesting story');
    form.controls.isRecommended.setValue(false);

    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne(
      'http://localhost:8080/bookish/book'
    );

    req.flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent)
      .toContain('Failed to create book or review');

    expect(createReview).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
