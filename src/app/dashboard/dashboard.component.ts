/**
 * Dashboard landing page. Route `/dashboard`.
 *
 * Reloads work orders on the shared WorkOrderService store, then derives stats
 * with computed() (open count, completion rate, overdue, categories, technician efficiency).
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
import { isWorkOrderOverdue, WorkOrderService } from '@app/services/work-order.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { createComponentUiState } from '@shared/utils';

/**
 * Data: reloadWorkOrders() fills WorkOrderService.workOrders. Dashboard reads that
 * readonly signal. Loading/error state is composed via createComponentUiState().
 */
@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly workOrderService = inject(WorkOrderService);
  readonly ui = createComponentUiState();

  readonly workOrders = this.workOrderService.workOrders;

  /** Greeting computed once at construction. Avoid heavy getters in the template. */
  readonly welcomeMessage = signal(DashboardComponent.buildWelcomeMessage());

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
    this.ui.setLoading(true);
    this.ui.clearError();
    this.workOrderService
      .reloadWorkOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.ui.setLoading(false);
        },
        error: error => {
          console.error('Error loading dashboard data:', error);
          this.ui.setError('Failed to load dashboard data. Please try again.');
          this.ui.setLoading(false);
        }
      });
  }

  totalOrders = computed(() => this.workOrders().length);

  openOrders = computed(
    () => this.workOrders().filter(wo => wo.status?.code === 'OPN').length
  );

  inProgressOrders = computed(
    () => this.workOrders().filter(wo => wo.status?.code === 'NPRGRS').length
  );

  completedOrders = computed(
    () => this.workOrders().filter(wo => wo.status?.code === 'CMPLTD').length
  );

  cancelledOrders = computed(
    () => this.workOrders().filter(wo => wo.status?.code === 'CNCLD').length
  );

  totalActiveWorkOrders = computed(() => this.openOrders() + this.inProgressOrders());

  completionRate = computed(() => {
    const total = this.totalOrders();
    if (total === 0) return 0;
    return Math.round((this.completedOrders() / total) * 100);
  });

  overdueOrders = computed(
    () => this.workOrders().filter(wo => isWorkOrderOverdue(wo)).length
  );

  categoryBreakdown = computed(() => {
    const categories = new Map<string, number>();

    this.workOrders().forEach(wo => {
      const categoryName = wo.category?.description ?? 'Unknown';
      categories.set(categoryName, (categories.get(categoryName) || 0) + 1);
    });

    return Array.from(categories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  technicianEfficiency = computed(() => {
    const technicianStats = new Map<
      string,
      { completed: number; total: number; avgTime: number }
    >();

    this.workOrders().forEach(wo => {
      if (wo.maintenanceTechnician?.code) {
        const techCode = wo.maintenanceTechnician.code;
        const stats = technicianStats.get(techCode) || {
          completed: 0,
          total: 0,
          avgTime: 0
        };

        stats.total++;
        if (wo.status?.code === 'CMPLTD' && wo.appointmentCompleted) {
          stats.completed++;
          const requestDate = new Date(wo.dateRequested);
          const completionDate = new Date(wo.appointmentCompleted);
          const diffTime = completionDate.getTime() - requestDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          stats.avgTime += diffDays;
        }

        technicianStats.set(techCode, stats);
      }
    });

    return Array.from(technicianStats.entries())
      .map(([code, stats]) => ({
        code,
        name: `${code}`,
        completed: stats.completed,
        total: stats.total,
        completionRate:
          stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        avgTime: stats.completed > 0 ? Math.round(stats.avgTime / stats.completed) : 0
      }))
      .filter(tech => tech.total >= 2)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);
  });

  loadSummary(): void {
    this.loadDashboardData();
  }
}