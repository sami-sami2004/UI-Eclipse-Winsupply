
/**
 * Create review page. Route `/review/create`.
 *
 * Reactive form → ReviewService.createReview()
 * → POST /bookish/review.
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
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

import {
  ReviewService,
  ReviewCreateRequest
} from '../services/review-list.service';

interface Book {
  bookId: number;
  title: string;
}

interface ReviewFormControls {
  bookId: FormControl<number>;
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
  bookId: 'Book',
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
  private readonly fb = inject(FormBuilder);
  private readonly reviewService = inject(ReviewService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly reviewForm: FormGroup<ReviewFormControls>;

  isSubmitting = signal(false);
  errorMessage = signal('');
  books = signal<Book[]>([]);

  private readonly formEpoch = signal(0);

  readonly fieldState = computed<Record<FormFieldName, FieldUiState>>(() => {
    this.formEpoch();

    return {
      bookId: this.describeField('bookId'),
      rating: this.describeField('rating'),
      reviewText: this.describeField('reviewText'),
      isRecommended: this.describeField('isRecommended')
    };
  });

  constructor() {
    this.reviewForm = new FormGroup<ReviewFormControls>({
      bookId: new FormControl(0, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1)
        ]
      }),

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
    this.loadBooks();
  }

  private loadBooks(): void {
    this.http
      .get<Book[]>('http://localhost:8080/bookish/book')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: books => {
          this.books.set(books);
        },
        error: error => {
          console.error('Failed to load books:', error);
          this.errorMessage.set(
            'Failed to load books. Please check that the API is running.'
          );
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

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const raw = this.reviewForm.getRawValue();

    const request: ReviewCreateRequest = {
      bookId: Number(raw.bookId),
      rating: Number(raw.rating),
      reviewText: raw.reviewText.trim(),
      isRecommended: raw.isRecommended!
    };

    this.reviewService
      .createReview(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: review => {
          this.isSubmitting.set(false);

          void this.router.navigate(['/review/list']);
        },
        error: error => {
          console.error('Failed to create review:', error);
          this.errorMessage.set(
            'Failed to create review. Please try again.'
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
      bookId: 0,
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

    if (errors['minlength']) {
      return {
        invalid: true,
        message:
          `${label} must be at least ${errors['minlength'].requiredLength} characters.`
      };
    }

    if (errors['maxlength']) {
      return {
        invalid: true,
        message:
          `${label} cannot exceed ${errors['maxlength'].requiredLength} characters.`
      };
    }

    return {
      invalid: true,
      message: `${label} is invalid.`
    };
  }
}
