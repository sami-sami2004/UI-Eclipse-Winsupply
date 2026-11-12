/**
 * Work order domain service. Syncs with mr-fixit-service.
 *
 * Backend contract today: GET list, GET by id, POST create only (no PUT/PATCH/DELETE).
 * Update/delete/assign/complete throw so the UI cannot pretend mutations persisted.
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import {
  Priority,
  WorkOrder,
  WorkOrderCreateRequest,
  WorkOrderUpdateRequest,
  WorkOrderFilters,
  WorkOrderSummary,
  PaginatedResponse,
  PaginationParams,
  WorkOrderStatusCode
} from '@shared/models';
import { ApiService } from './api.service';

const UNSUPPORTED_MUTATION =
  'mr-fixit-service does not expose update/delete for work orders yet (GET + POST only).';

const OVERDUE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Open or in-progress work requested more than seven days ago.
 * Completed and cancelled orders are never overdue.
 */
export function isWorkOrderOverdue(wo: WorkOrder, now = new Date()): boolean {
  const code = wo.status?.code;
  if (code === WorkOrderStatusCode.COMPLETED || code === WorkOrderStatusCode.CANCELLED) {
    return false;
  }
  const requested = new Date(wo.dateRequested);
  if (Number.isNaN(requested.getTime())) {
    return false;
  }
  return requested.getTime() < now.getTime() - OVERDUE_AFTER_MS;
}

@Injectable({
  providedIn: 'root'
})
export class WorkOrderService {
  private readonly apiService = inject(ApiService);

  private readonly _workOrders = signal<WorkOrder[]>([]);
  private readonly _loadError = signal<string | null>(null);

  readonly workOrders = this._workOrders.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  readonly summary = computed<WorkOrderSummary>(() => {
    const workOrders = this._workOrders();
    const now = new Date();
    const open = workOrders.filter(wo => this.statusCode(wo) === WorkOrderStatusCode.OPEN);
    const overdue = workOrders.filter(wo => isWorkOrderOverdue(wo, now));
    const inProgress = workOrders.filter(
      wo => this.statusCode(wo) === WorkOrderStatusCode.IN_PROGRESS
    ).length;
    const completed = workOrders.filter(
      wo => this.statusCode(wo) === WorkOrderStatusCode.COMPLETED
    ).length;
    const cancelled = workOrders.filter(
      wo => this.statusCode(wo) === WorkOrderStatusCode.CANCELLED
    ).length;
    const highPriority = workOrders.filter(
      wo => wo.priorityCode === Priority.HIGH || wo.priorityCode === Priority.EMERGENCY
    ).length;

    return {
      totalOrders: workOrders.length,
      openOrders: open.length,
      inProgressOrders: inProgress,
      completedOrders: completed,
      cancelledOrders: cancelled,
      highPriorityOrders: highPriority,
      overdueOrders: overdue.length
    };
  });

  /** Reloads the full list from GET /work_order. Errors propagate to callers. */
  reloadWorkOrders(): Observable<WorkOrder[]> {
    this._loadError.set(null);
    return this.apiService.get<WorkOrder[]>('work_order').pipe(
      map(response => {
        const rows = Array.isArray(response.data) ? response.data : [];
        this._workOrders.set(rows);
        return rows;
      }),
      tap({
        error: err => {
          this._workOrders.set([]);
          this._loadError.set(this.toErrorMessage(err, 'Failed to load work orders'));
        }
      })
    );
  }

  /**
   * Returns a filtered, sorted, paginated slice of the in-memory list.
   * Call reloadWorkOrders() first for fresh data.
   */
  getWorkOrders(
    filters?: WorkOrderFilters,
    pagination?: PaginationParams
  ): Observable<PaginatedResponse<WorkOrder>> {
    let result = this.applyFilters(this._workOrders(), filters);

    if (pagination?.sortBy) {
      result = this.applySorting(result, pagination.sortBy, pagination.sortOrder ?? 'asc');
    }

    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.max(1, pagination?.limit ?? 10);
    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginatedData = result.slice((page - 1) * limit, page * limit);

    return new Observable(subscriber => {
      subscriber.next({
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        },
        timestamp: new Date()
      });
      subscriber.complete();
    });
  }

  /** GET /work_order/{id}. Authoritative detail, not only the local cache. */
  getWorkOrderById(orderNumber: number): Observable<WorkOrder> {
    if (!Number.isFinite(orderNumber) || orderNumber <= 0) {
      return throwError(() => new Error(`Invalid work order id: ${orderNumber}`));
    }

    return this.apiService.get<WorkOrder>(`work_order/${orderNumber}`).pipe(
      map(response => {
        if (!response.data) {
          throw new Error(`Work order ${orderNumber} not found`);
        }
        this.upsertLocal(response.data);
        return response.data;
      })
    );
  }

  /**
   * POST /work_order then GET /work_order/{id} so the UI receives WorkOrderDto shape.
   * Failures propagate. Callers must show errors. There is no optimistic local-only success.
   */
  createWorkOrder(request: WorkOrderCreateRequest): Observable<WorkOrder> {
    const payload = this.normalizeCreateRequest(request);

    return this.apiService.post<{ orderNumber?: number } & WorkOrder>('work_order', payload).pipe(
      switchMap(response => {
        const orderNumber = response.data?.orderNumber;
        if (orderNumber == null) {
          throw new Error('Create succeeded but response did not include orderNumber');
        }
        return this.getWorkOrderById(orderNumber);
      }),
      tap(created => this.upsertLocal(created))
    );
  }

  updateWorkOrder(
    _orderNumber: number,
    _request: WorkOrderUpdateRequest
  ): Observable<WorkOrder> {
    return throwError(() => new Error(UNSUPPORTED_MUTATION));
  }

  deleteWorkOrder(_orderNumber: number): Observable<void> {
    return throwError(() => new Error(UNSUPPORTED_MUTATION));
  }

  assignWorkOrder(_orderNumber: number, _technicianCode: string): Observable<WorkOrder> {
    return throwError(() => new Error(UNSUPPORTED_MUTATION));
  }

  completeWorkOrder(_orderNumber: number, _completionNotes: string): Observable<WorkOrder> {
    return throwError(() => new Error(UNSUPPORTED_MUTATION));
  }

  getWorkOrderSummary(): Observable<WorkOrderSummary> {
    return new Observable(subscriber => {
      subscriber.next(this.summary());
      subscriber.complete();
    });
  }

  private normalizeCreateRequest(request: WorkOrderCreateRequest): WorkOrderCreateRequest {
    return {
      ...request,
      title: request.title.trim(),
      description: request.description.trim(),
      studentId: Number(request.studentId),
      categoryId: Number(request.categoryId),
      room: {
        buildingId: Number(request.room.buildingId),
        roomNumber: String(request.room.roomNumber)
      },
      statusCode: request.statusCode || WorkOrderStatusCode.OPEN,
      dateRequested: this.toLocalDateString(request.dateRequested),
      maintenanceTechnicianCode: request.maintenanceTechnicianCode ?? null,
      appointmentScheduled: request.appointmentScheduled
        ? this.toIsoString(request.appointmentScheduled)
        : null,
      completionNotes: request.completionNotes ?? null
    };
  }

  private upsertLocal(workOrder: WorkOrder): void {
    this._workOrders.update(orders => {
      const idx = orders.findIndex(wo => wo.orderNumber === workOrder.orderNumber);
      if (idx === -1) {
        return [...orders, workOrder];
      }
      return orders.map((wo, i) => (i === idx ? workOrder : wo));
    });
  }

  private statusCode(wo: WorkOrder): string {
    return wo.status?.code ?? '';
  }

  private getPriorityWeight(priority: Priority | string | undefined): number {
    switch (priority) {
      case Priority.EMERGENCY:
        return 4;
      case Priority.HIGH:
        return 3;
      case Priority.MEDIUM:
        return 2;
      case Priority.LOW:
        return 1;
      default:
        return 0;
    }
  }

  private applyFilters(workOrders: WorkOrder[], filters?: WorkOrderFilters): WorkOrder[] {
    if (!filters) {
      return workOrders;
    }

    return workOrders.filter(wo => {
      if (filters.statusCode?.length && !filters.statusCode.includes(this.statusCode(wo))) {
        return false;
      }
      if (filters.priorityCode?.length && !filters.priorityCode.includes(wo.priorityCode!)) {
        return false;
      }
      if (filters.categoryId?.length && !filters.categoryId.includes(wo.category?.id ?? 0)) {
        return false;
      }
      if (filters.buildingId !== undefined && wo.room?.id?.buildingId !== filters.buildingId) {
        return false;
      }
      if (filters.dateRequestedAfter) {
        const after = this.toDate(filters.dateRequestedAfter, new Date(0));
        if (this.toDate(wo.dateRequested, new Date(0)) < after) {
          return false;
        }
      }
      if (filters.dateRequestedBefore) {
        const before = this.toDate(filters.dateRequestedBefore, new Date(0));
        if (this.toDate(wo.dateRequested, new Date(0)) > before) {
          return false;
        }
      }
      return true;
    });
  }

  private applySorting(
    workOrders: WorkOrder[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): WorkOrder[] {
    const dir = sortOrder === 'asc' ? 1 : -1;
    const sorted = [...workOrders];

    switch (sortBy) {
      case 'title':
        return sorted.sort((a, b) => dir * (a.title ?? '').localeCompare(b.title ?? ''));
      case 'priorityCode':
        return sorted.sort(
          (a, b) =>
            dir * (this.getPriorityWeight(a.priorityCode) - this.getPriorityWeight(b.priorityCode))
        );
      case 'dateAdded':
        return sorted.sort(
          (a, b) =>
            dir *
            (this.toDate(a.dateAdded, new Date(0)).getTime() -
              this.toDate(b.dateAdded, new Date(0)).getTime())
        );
      default:
        return workOrders;
    }
  }

  private toLocalDateString(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new TypeError(`Invalid dateRequested: ${value}`);
    }
    return parsed.toISOString().slice(0, 10);
  }

  private toIsoString(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new TypeError(`Invalid date: ${value}`);
    }
    return d.toISOString();
  }

  private toDate(value: Date | string | undefined | null, fallback: Date): Date {
    if (value instanceof Date) {
      return value;
    }
    if (value != null) {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? fallback : d;
    }
    return fallback;
  }

  private toErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  }
}