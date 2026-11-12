/**
 * Work order list page. Route `/work-orders/list`.
 *
 * Loads orders from WorkOrderService, filters client-side via reactive form controls,
 * and paginates in the component. Categories come from LookupService.
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
import { debounceTime, distinctUntilChanged, combineLatest, startWith } from 'rxjs';

import { WorkOrderService } from '@app/services/work-order.service';
import { LookupService } from '@app/services/lookup.service';
import { WorkOrder } from '@shared/models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

/**
 * Work order list. Route: /work-orders/list.
 *
 * Data path:
 *   ngOnInit → WorkOrderService.reloadWorkOrders() → local workOrders signal for filters
 *   Reactive form filters → applyFilters() then applyPagination()
 *   LookupService.getWorkOrderCategories() → populates category dropdown
 */
@Component({
  selector: 'app-work-order-list',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './work-order-list.component.html',
  styleUrl: './work-order-list.component.scss',
})
export class WorkOrderListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly workOrderService = inject(WorkOrderService);
  private readonly lookupService = inject(LookupService);

  readonly workOrders = signal<WorkOrder[]>([]);
  /** Full filtered+sorted list (before page slice). */
  private readonly filteredAll = signal<WorkOrder[]>([]);
  readonly filteredWorkOrders = signal<WorkOrder[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly filtersCollapsed = signal(false);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusFilter = new FormControl('all', { nonNullable: true });
  readonly categoryFilter = new FormControl('all', { nonNullable: true });
  readonly sortControl = new FormControl('dateAdded', { nonNullable: true });

  readonly statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'OPN', label: 'Open' },
    { value: 'NPRGRS', label: 'In Progress' },
    { value: 'CMPLTD', label: 'Completed' },
    { value: 'CNCLD', label: 'Cancelled' }
  ];

  readonly categoryOptions = signal<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Categories' }
  ]);

  readonly sortOptions = [
    { value: '-dateAdded', label: 'Date Created (Newest)' },
    { value: 'dateAdded', label: 'Date Created (Oldest)' },
    { value: 'title', label: 'Title (A-Z)' },
    { value: '-title', label: 'Title (Z-A)' },
    { value: 'status', label: 'Status' }
  ];

  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()) || 0);
  readonly startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  readonly endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.totalCount()));

  ngOnInit(): void {
    this.setupFilters();
    this.loadWorkOrders();
    this.loadCategories();
  }

  /** Wires search/status/category/sort controls to re-run applyFilters() (debounced search). */
  private setupFilters(): void {
    const searchChanges$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(300),
      distinctUntilChanged()
    );

    const filterChanges$ = combineLatest([
      searchChanges$,
      this.statusFilter.valueChanges.pipe(startWith(this.statusFilter.value)),
      this.categoryFilter.valueChanges.pipe(startWith(this.categoryFilter.value)),
      this.sortControl.valueChanges.pipe(startWith(this.sortControl.value))
    ]);

    filterChanges$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.applyFilters(true);
    });
  }

  private loadWorkOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.workOrderService
      .reloadWorkOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: orders => {
          this.workOrders.set(orders);
          this.applyFilters(true);
          this.isLoading.set(false);
        },
        error: error => {
          console.error('Failed to load work orders:', error);
          this.errorMessage.set('Failed to load work orders. Please try again.');
          this.workOrders.set([]);
          this.applyFilters(true);
          this.isLoading.set(false);
        }
      });
  }

  private loadCategories(): void {
    this.lookupService
      .getWorkOrderCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: categories => {
          this.categoryOptions.set([
            { value: 'all', label: 'All Categories' },
            ...categories.map(category => ({
              value: category.id.toString(),
              label: category.description
            }))
          ]);
        },
        error: error => {
          console.error('Error loading categories:', error);
        }
      });
  }

  /**
   * Client-side filter + sort. Resets page only when filters/sort change
   * (not when pagination alone changes).
   */
  private applyFilters(resetPage: boolean): void {
    let filtered = [...this.workOrders()];

    const searchTerm = this.searchControl.value?.toLowerCase() ?? '';
    if (searchTerm) {
      filtered = filtered.filter(
        order =>
          (order.title ?? '').toLowerCase().includes(searchTerm) ||
          (order.description ?? '').toLowerCase().includes(searchTerm) ||
          `Building ${order.room?.id?.buildingId ?? ''}`.toLowerCase().includes(searchTerm) ||
          `Room ${order.room?.id?.roomNumber ?? ''}`.toLowerCase().includes(searchTerm)
      );
    }

    const statusFilter = this.statusFilter.value;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status?.code === statusFilter);
    }

    const categoryFilter = this.categoryFilter.value;
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(
        order => order.category?.id === Number.parseInt(categoryFilter, 10)
      );
    }

    const sortValue = this.sortControl.value ?? 'dateAdded';
    const sortField = sortValue.startsWith('-') ? sortValue.slice(1) : sortValue;
    const ascending = !sortValue.startsWith('-');

    filtered.sort((a, b) => this.compareWorkOrders(a, b, sortField, ascending));

    this.filteredAll.set(filtered);
    this.totalCount.set(filtered.length);

    if (resetPage) {
      this.currentPage.set(1);
    }

    this.applyPagination();
  }

  /** Re-slice the current filtered list for the active page. */
  private applyPagination(): void {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    this.filteredWorkOrders.set(this.filteredAll().slice(start, end));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.applyPagination();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.applyPagination();
  }

  /** Resets all filter controls; setupFilters() subscription re-runs applyFilters(). */
  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('all');
    this.categoryFilter.setValue('all');
    this.sortControl.setValue('dateAdded');
  }

  refreshList(): void {
    this.loadWorkOrders();
  }

  trackByWorkOrderId(_index: number, workOrder: WorkOrder): number {
    return workOrder.orderNumber;
  }

  toggleFiltersCollapse(): void {
    this.filtersCollapsed.set(!this.filtersCollapsed());
  }

  private compareWorkOrders(
    a: WorkOrder,
    b: WorkOrder,
    sortField: string,
    ascending: boolean
  ): number {
    const comparison = this.compareBySortField(a, b, sortField);
    return ascending ? comparison : -comparison;
  }

  private compareBySortField(a: WorkOrder, b: WorkOrder, sortField: string): number {
    switch (sortField) {
      case 'dateAdded':
        return this.compareNumbers(
          new Date(a.dateAdded).getTime(),
          new Date(b.dateAdded).getTime()
        );
      case 'title':
        return this.compareStrings(a.title ?? '', b.title ?? '');
      case 'status':
        return this.compareStrings(a.status?.code ?? '', b.status?.code ?? '');
      default:
        return 0;
    }
  }

  private compareNumbers(left: number, right: number): number {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  private compareStrings(left: string, right: string): number {
    const a = left.toLowerCase();
    const b = right.toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
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
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
