/**
 * Reference data for dropdowns and filters (categories, statuses, priorities).
 *
 * Calls GET /work_order/category and GET /work_order/status via ApiService.
 * On API failure, falls back to mock arrays so the UI still works offline in labs.
 *
 * Used by: WorkOrderListComponent (category filter), potentially forms and admin screens.
 */
import { Injectable } from '@angular/core';
import { Observable, of, map, catchError } from 'rxjs';
import {
  WorkOrderCategory,
  WorkOrderStatusDto,
  WorkOrderPriority,
  BackendWorkOrderCategoryDto,
} from '@shared/models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class LookupService {
  constructor(private readonly apiService: ApiService) {}

  /** GET /work_order/category. Populates category filters and forms. */
  getWorkOrderCategories(): Observable<WorkOrderCategory[]> {
    return this.apiService.get<BackendWorkOrderCategoryDto[]>('work_order/category').pipe(
      map(response => response.data),
      catchError(error => {
        console.error('API call failed, using mock data:', error);
        return of(this.getMockCategories());
      })
    );
  }

  /** GET /work_order/status. Canonical status codes: OPN, NPRGRS, CMPLTD, CNCLD. */
  getWorkOrderStatuses(): Observable<WorkOrderStatusDto[]> {
    return this.apiService.get<WorkOrderStatusDto[]>('work_order/status').pipe(
      map(response => response.data),
      catchError(error => {
        console.error('API call failed, using mock data:', error);
        return of(this.getMockStatuses());
      })
    );
  }

  /**
   * Priority dropdown data. Mostly mock today.
   * mr-fixit-service has no dedicated priorities endpoint; catchError returns getMockPriorities().
   */
  getWorkOrderPriorities(): Observable<WorkOrderPriority[]> {
    return this.apiService.get<WorkOrderPriority[]>('/lookups/priorities').pipe(
      map(response => response.data),
      catchError(error => {
        console.error('API call failed, using mock data:', error);
        return of(this.getMockPriorities());
      })
    );
  }

  private getMockCategories(): WorkOrderCategory[] {
    return [
      {
        id: 1,
        code: 'PLMB',
        description: 'Plumbing',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      },
      {
        id: 2,
        code: 'ELCT',
        description: 'Electrical',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      },
      {
        id: 3,
        code: 'HVC',
        description: 'Hvac',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      },
      {
        id: 4,
        code: 'CRPN',
        description: 'Carpentry',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      },
      {
        id: 5,
        code: 'GEN',
        description: 'General Maintenance',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      }
    ];
  }

  private getMockStatuses(): WorkOrderStatusDto[] {
    return [
      {
        code: 'OPN',
        description: 'Open - Work order created and pending assignment',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString()
      },
      {
        code: 'NPRGRS',
        description: 'In Progress - Work order assigned and being worked on',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString()
      },
      {
        code: 'CMPLTD',
        description: 'Completed - Work order finished successfully',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString()
      },
      {
        code: 'CNCLD',
        description: 'Cancelled - Work order cancelled by student or staff',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString()
      }
    ];
  }

  private getMockPriorities(): WorkOrderPriority[] {
    return [
      {
        code: 'LOW',
        description: 'Low - Non-urgent maintenance request',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      },
      {
        code: 'MEDIUM',
        description: 'Medium - Standard maintenance request',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      },
      {
        code: 'HIGH',
        description: 'High - Urgent maintenance request',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      },
      {
        code: 'EMERGENCY',
        description: 'Emergency - Critical issue requiring immediate attention',
        active: true,
        dateAdded: new Date('2023-01-01').toISOString(),
        dateUpdated: new Date('2023-01-01').toISOString(),
      }
    ];
  }
}