
/**
 * Review list page. Route `/review/list`.
 *
 * Loads reviews from ReviewService, filters client-side
 * via reactive form controls, and paginates results.
 */
import {
  Component,
  OnInit,
  computed,
  signal,
  inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  combineLatest,
  startWith
} from 'rxjs';

import {
  ReviewService,
  Review
} from '../services/review-list.service';

/** import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component'; */

/**
 * Review list. Route: /review/list.
 *
 * Data path:
 * ngOnInit -> ReviewService.reloadReviews()
 * Reactive filters -> applyFilters() -> applyPagination()
 */
@Component({
  selector: 'app-review-list',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    /* LoadingSpinnerComponent */
  ],
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.scss',
})
export class ReviewListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly reviewService = inject(ReviewService);

  readonly reviews = signal<Review[]>([]);
  private readonly filteredAll = signal<Review[]>([]);
  readonly filteredReviews = signal<Review[]>([]);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly filtersCollapsed = signal(false);

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly recommendationFilter = new FormControl('all', {
    nonNullable: true
  });

  readonly ratingFilter = new FormControl('all', {
    nonNullable: true
  });

  readonly sortControl = new FormControl('-datePosted', {
    nonNullable: true
  });

  readonly recommendationOptions = [
    { value: 'all', label: 'All Reviews' },
    { value: 'true', label: 'Recommended' },
    { value: 'false', label: 'Not Recommended' }
  ];

  readonly ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
  ];

  readonly sortOptions = [
    { value: '-datePosted', label: 'Date Posted (Newest)' },
    { value: 'datePosted', label: 'Date Posted (Oldest)' },
    { value: '-rating', label: 'Rating (Highest)' },
    { value: 'rating', label: 'Rating (Lowest)' }
  ];

  readonly totalPages = computed(
    () => Math.ceil(this.totalCount() / this.pageSize()) || 0
  );

  readonly startIndex = computed(
    () => (this.currentPage() - 1) * this.pageSize()
  );

  readonly endIndex = computed(
    () => Math.min(
      this.startIndex() + this.pageSize(),
      this.totalCount()
    )
  );

  ngOnInit(): void {
    this.setupFilters();
    this.loadReviews();
  }

  /**
   * Updates the list when search or filter values change.
   */
  private setupFilters(): void {
    const searchChanges$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(300),
      distinctUntilChanged()
    );

    const filterChanges$ = combineLatest([
      searchChanges$,
      this.recommendationFilter.valueChanges.pipe(
        startWith(this.recommendationFilter.value)
      ),
      this.ratingFilter.valueChanges.pipe(
        startWith(this.ratingFilter.value)
      ),
      this.sortControl.valueChanges.pipe(
        startWith(this.sortControl.value)
      )
    ]);

    filterChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFilters(true);
      });
  }

  /**
   * Loads reviews from Bookish.
   */
  private loadReviews(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reviewService
      .reloadReviews()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: reviews => {
          this.reviews.set(reviews);
          this.applyFilters(true);
          this.isLoading.set(false);
        },
        error: error => {
          console.error('Failed to load reviews:', error);
          this.errorMessage.set(
            'Failed to load reviews. Please try again.'
          );
          this.reviews.set([]);
          this.applyFilters(true);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Client-side filtering and sorting.
   */
  private applyFilters(resetPage: boolean): void {
    let filtered = [...this.reviews()];

    const searchTerm = this.searchControl.value
      .trim()
      .toLowerCase();

    if (searchTerm) {
      filtered = filtered.filter(review =>
        (review.reviewText ?? '')
          .toLowerCase()
          .includes(searchTerm) ||
        String(review.bookId).includes(searchTerm) ||
        String(review.rating).includes(searchTerm)
      );
    }

    const recommendation = this.recommendationFilter.value;

    if (recommendation !== 'all') {
      filtered = filtered.filter(
        review =>
          review.isRecommended === (recommendation === 'true')
      );
    }

    const rating = this.ratingFilter.value;

    if (rating !== 'all') {
      filtered = filtered.filter(
        review => review.rating === Number(rating)
      );
    }

    const sortValue = this.sortControl.value;
    const sortField = sortValue.startsWith('-')
      ? sortValue.slice(1)
      : sortValue;

    const ascending = !sortValue.startsWith('-');

    filtered.sort((a, b) =>
      this.compareReviews(a, b, sortField, ascending)
    );

    this.filteredAll.set(filtered);
    this.totalCount.set(filtered.length);

    if (resetPage) {
      this.currentPage.set(1);
    }

    this.applyPagination();
  }

  /**
   * Displays the selected page.
   */
  private applyPagination(): void {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();

    this.filteredReviews.set(
      this.filteredAll().slice(start, end)
    );
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;

    this.currentPage.set(page);
    this.applyPagination();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.applyPagination();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.recommendationFilter.setValue('all');
    this.ratingFilter.setValue('all');
    this.sortControl.setValue('-datePosted');
  }

  refreshList(): void {
    this.loadReviews();
  }

  trackByReviewId(_index: number, review: Review): number {
    return review.reviewId;
  }

  toggleFiltersCollapse(): void {
    this.filtersCollapsed.set(!this.filtersCollapsed());
  }

  private compareReviews(
    a: Review,
    b: Review,
    sortField: string,
    ascending: boolean
  ): number {
    const comparison = this.compareBySortField(
      a, b, sortField
    );

    return ascending ? comparison : -comparison;
  }

  private compareBySortField(
    a: Review,
    b: Review,
    sortField: string
  ): number {
    switch (sortField) {
      case 'datePosted':
        return this.compareNumbers(
          new Date(a.datePosted).getTime(),
          new Date(b.datePosted).getTime()
        );

      case 'rating':
        return this.compareNumbers(a.rating, b.rating);

      default:
        return 0;
    }
  }

  private compareNumbers(
    left: number,
    right: number
  ): number {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  getPaginationPages(): number[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const maxPagesToShow = 5;

    if (totalPages <= 0) {
      return [];
    }

    if (totalPages <= maxPagesToShow) {
      return Array.from(
        { length: totalPages },
        (_, i) => i + 1
      );
    }

    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(
      totalPages,
      start + maxPagesToShow - 1
    );

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(
        1,
        end - maxPagesToShow + 1
      );
    }

    return Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );
  }
}
