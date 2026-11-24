
/**
 * Create review page. Route `/review/create`.
 *
 * Create Book - receive bookId - Create Review.
 */

import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, switchMap} from 'rxjs';

import {
  ReviewService,
  ReviewCreateRequest
} from '../services/review-list.service';
import { LookupService } from '../services/lookup.service';
import { ApiService } from '../services/api.service';

interface Genre {
  genreId: number;
  genreName: string;
}

interface Book {
  bookId: number;
  title: string;
  author: string;
  genreId: number;
  pageCount: number;
}

interface BookCreateRequest {
  title: string;
  author: string;
  genreId: number;
  pageCount: number;
}

interface ReviewFormControls {
  title: FormControl<string>;
  author: FormControl<string>;
  genreId: FormControl<number | null>;
  pageCount: FormControl<number | null>;
  rating: FormControl<number>;
  reviewText: FormControl<string>;
  isRecommended: FormControl<boolean | null>;
}

type FormFieldName = keyof ReviewFormControls;

interface FieldUiState {
  invalid: boolean;
  message: string;
}

const FIELD_LABELS: Record<FormFieldName, string> = {
  title: 'Book Title',
  author: 'Author',
  genreId: 'Genre ID',
  pageCount: 'Page Count',
  rating: 'Rating',
  reviewText: 'Review',
  isRecommended: 'Recommendation'
};

@Component({
  selector: 'app-review-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './review-create.component.html',
  styleUrl: './review-create.component.scss'
})
export class ReviewCreateComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly reviewService = inject(ReviewService);
  private readonly lookupService = inject(LookupService);
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly reviewForm: FormGroup<ReviewFormControls>;

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly genres = signal<Genre[]>([]);

  private readonly formEpoch = signal(0);

  readonly fieldState = computed<
    Record<FormFieldName, FieldUiState>
  >(() => {
    this.formEpoch();

    return {
      title: this.describeField('title'),
      author: this.describeField('author'),
      genreId: this.describeField('genreId'),
      pageCount: this.describeField('pageCount'),
      rating: this.describeField('rating'),
      reviewText: this.describeField('reviewText'),
      isRecommended: this.describeField('isRecommended')
    };
  });

  constructor() {
    this.reviewForm = new FormGroup<ReviewFormControls>({
      title: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(50)
        ]
      }),

      author: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(50)
        ]
      }),

      genreId: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(1)
      ]),

      pageCount: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(1),
        Validators.max(32767)
      ]),

      rating: new FormControl(0, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(5)
        ]
      }),

      reviewText: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(3500)
        ]
      }),

      isRecommended: new FormControl<boolean | null>(
        null,
        Validators.required
      )
    });

    merge(
      this.reviewForm.valueChanges,
      this.reviewForm.statusChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formEpoch.update(n => n + 1));
  }

  ngOnInit(): void {
    this.loadGenres();
  }

  private loadGenres(): void {
    this.lookupService.getGenres()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          console.log('Genres from backend:', response);

          const genres = Array.isArray(response)
            ? response
            : response.data;

          this.genres.set(genres ?? []);
        },
        error: error => {
          console.error('Failed to load genres:', error);
          this.errorMessage.set('Failed to load genres.');
        }
      });
  }

  onSubmit(): void {

    if (this.isSubmitting()) {
      return;
    }

    if (this.reviewForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const raw = this.reviewForm.getRawValue();

    if (!raw.title.trim() || !raw.author.trim() ||
        !raw.reviewText.trim()) {
      this.errorMessage.set('Please complete all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const bookRequest: BookCreateRequest = {
      title: raw.title.trim(),
      author: raw.author.trim(),
      genreId: Number(raw.genreId),
      pageCount: Number(raw.pageCount)
    };

    this.api.post<Book>('book', bookRequest)
      .pipe(
        switchMap(book => {
          const reviewRequest: ReviewCreateRequest = {
            bookId: book.data.bookId,
            rating: raw.rating,
            reviewText: raw.reviewText.trim(),
            isRecommended: raw.isRecommended!
          };

          return this.reviewService.createReview(reviewRequest);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          void this.router.navigate(['/review/list']);
        },
        error: error => {
          console.error('Failed to create review:', error);
          this.errorMessage.set(
            'Failed to create book or review. Please try again.'
          );
          this.isSubmitting.set(false);
        }
      });
  }

  onCancel(): void {
    void this.router.navigate(['/review/list']);
  }

  onReset(): void {
    this.reviewForm.reset({
      title: '',
      author: '',
      genreId: null,
      pageCount: null,
      rating: 0,
      reviewText: '',
      isRecommended: null
    });

    this.errorMessage.set('');
    this.formEpoch.update(n => n + 1);
  }

  private markFormGroupTouched(): void {
    Object.values(this.reviewForm.controls).forEach(control => {
      control.markAsTouched();
    });

    this.formEpoch.update(n => n + 1);
  }

  private describeField(fieldName: FormFieldName): FieldUiState {
    const field = this.reviewForm.controls[fieldName];

    const invalid = !!(
      field.invalid &&
      (field.dirty || field.touched)
    );

    if (!invalid || !field.errors) {
      return {
        invalid: false,
        message: ''
      };
    }

    const label = FIELD_LABELS[fieldName];
    const errors = field.errors;

    if (errors['required'] || errors['min']) {
      return {
        invalid: true,
        message: `${label} is required.`
      };
    }

    if (errors['maxlength']) {
      return {
        invalid: true,
        message:
          `${label} cannot exceed ${errors['maxlength'].requiredLength} characters.`
      };
    }

    if (errors['minlength']) {
      return {
        invalid: true,
        message:
          `${label} must be at least ${errors['minlength'].requiredLength} characters.`
      };
    }

    return {
      invalid: true,
      message: `${label} is invalid.`
    };
  }
}
