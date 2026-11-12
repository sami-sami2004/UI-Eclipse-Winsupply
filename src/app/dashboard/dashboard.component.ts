
/**
 * Dashboard landing page. Route `/dashboard`.
 *
 * Loads Bookish reviews and calculates review statistics.
 */
import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReviewService
} from '../services/review-list.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly reviewService = inject(ReviewService);

  readonly reviews = this.reviewService.reviews;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly welcomeMessage = signal(
    DashboardComponent.buildWelcomeMessage()
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private static buildWelcomeMessage(): string {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.reviewService
      .reloadReviews()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          console.error('Error loading dashboard data:', error);
          this.error.set(
            'Failed to load dashboard data. Please try again.'
          );
          this.isLoading.set(false);
        }
      });
  }

  readonly totalReviews = computed(
    () => this.reviews().length
  );

  readonly recommendedReviews = computed(
    () => this.reviews().filter(
      review => review.isRecommended
    ).length
  );

  readonly notRecommendedReviews = computed(
    () => this.reviews().filter(
      review => !review.isRecommended
    ).length
  );

  readonly recommendationRate = computed(() => {
    const total = this.totalReviews();

    if (total === 0) return 0;

    return Math.round(
      (this.recommendedReviews() / total) * 100
    );
  });

  readonly averageRating = computed(() => {
    const reviews = this.reviews();

    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return Number(
      (totalRating / reviews.length).toFixed(1)
    );
  });

  readonly ratingBreakdown = computed(() => {
    const reviews = this.reviews();

    return [5, 4, 3, 2, 1].map(rating => ({
      name: `${rating} Stars`,
      count: reviews.filter(
        review => review.rating === rating
      ).length
    }));
  });

  readonly recentReviews = computed(() => {
    return [...this.reviews()]
      .sort((a, b) =>
        new Date(b.datePosted).getTime() -
        new Date(a.datePosted).getTime()
      )
      .slice(0, 3);
  });

  loadSummary(): void {
    this.loadDashboardData();
  }
}
