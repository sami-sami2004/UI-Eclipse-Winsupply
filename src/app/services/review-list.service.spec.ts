/**
 * Unit tests for WorkOrderService against a mocked ApiService.
 *
 * Assertions focus on observable behavior (filters, pagination, create/reload,
 * unsupported mutations) rather than private helpers.
 */
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { WorkOrderService } from './work-order.service';
import { ApiService } from './api.service';
import {
  WorkOrder,
  WorkOrderCreateRequest,
  WorkOrderFilters,
  Priority
} from '../shared/models';

const STATUS = {
  OPEN: 'OPN',
  IN_PROGRESS: 'NPRGRS',
  COMPLETED: 'CMPLTD',
  CANCELLED: 'CNCLD'
} as const;

function createMockWorkOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  const now = '2024-01-01T00:00:00.000Z';
  const status = overrides.status ?? {
    code: STATUS.OPEN,
    description: 'Open',
    active: true,
    dateAdded: now,
    dateUpdated: now
  };

  return {
    orderNumber: 1001,
    title: 'Test Work Order',
    description: 'Test description',
    priorityCode: Priority.MEDIUM,
    student: {
      id: 1,
      emailAddress: 'test@example.com',
      firstName: 'Test',
      lastName: 'Student',
      phoneNumber: '',
      lastLogin: null,
      active: true,
      dateAdded: now,
      lastUpdated: now
    },
    room: {
      id: { buildingId: 1, roomNumber: '101' },
      type: {
        id: 1,
        code: 'STD',
        description: 'Standard',
        active: true,
        dateAdded: now,
        lastUpdated: now
      },
      floorNumber: 1,
      capacity: 2,
      active: true,
      dateAdded: now,
      lastUpdated: now
    },
    category: {
      id: 1,
      code: 'GEN',
      description: 'General',
      active: true,
      dateAdded: now,
      dateUpdated: now
    },
    status,
    dateRequested: now,
    maintenanceTechnician: null,
    appointmentScheduled: null,
    appointmentCompleted: null,
    completionNotes: null,
    dateAdded: now,
    dateUpdated: now,
    ...overrides
  };
}

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let api: {
    get: jest.Mock;
    post: jest.Mock;
  };

  const mockWorkOrders: WorkOrder[] = [
    createMockWorkOrder(),
    createMockWorkOrder({
      orderNumber: 1002,
      title: 'High Priority Issue',
      priorityCode: Priority.HIGH,
      status: {
        code: STATUS.IN_PROGRESS,
        description: 'In Progress',
        active: true,
        dateAdded: '2024-01-01T00:00:00.000Z',
        dateUpdated: '2024-01-02T00:00:00.000Z'
      },
      maintenanceTechnician: { code: 'TECH001', firstName: 'Tech', lastName: 'One' }
    }),
    createMockWorkOrder({
      orderNumber: 1003,
      title: 'Completed Work',
      status: {
        code: STATUS.COMPLETED,
        description: 'Completed',
        active: true,
        dateAdded: '2024-01-01T00:00:00.000Z',
        dateUpdated: '2024-01-03T00:00:00.000Z'
      },
      appointmentCompleted: '2024-01-03T00:00:00.000Z',
      completionNotes: 'Work completed successfully'
    })
  ];

  beforeEach(async () => {
    api = {
      get: jest.fn().mockReturnValue(of({ success: true, data: mockWorkOrders, timestamp: new Date() })),
      post: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        WorkOrderService,
        { provide: ApiService, useValue: api }
      ]
    });

    service = TestBed.inject(WorkOrderService);
    await firstValueFrom(service.reloadWorkOrders());
  });

  it('should be created and load work orders from the API when asked', () => {
    expect(service).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('work_order');
    expect(service.workOrders()).toHaveLength(3);
  });

  describe('getWorkOrders', () => {
    it('should return all work orders without filters', async () => {
      const response = await firstValueFrom(service.getWorkOrders());
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(3);
      expect(response.pagination.total).toBe(3);
    });

    it('should apply status filters correctly', async () => {
      const filters: WorkOrderFilters = { statusCode: [STATUS.OPEN] };
      const response = await firstValueFrom(service.getWorkOrders(filters));
      expect(response.data).toHaveLength(1);
      expect(response.data[0].status.code).toBe(STATUS.OPEN);
    });

    it('should handle pagination correctly', async () => {
      const response = await firstValueFrom(service.getWorkOrders({}, { page: 1, limit: 2 }));
      expect(response.data).toHaveLength(2);
      expect(response.pagination.totalPages).toBe(2);
      expect(response.pagination.hasNext).toBe(true);
    });

    it('should sort by title ascending', async () => {
      const response = await firstValueFrom(
        service.getWorkOrders({}, { sortBy: 'title', sortOrder: 'asc' })
      );
      const titles = response.data.map(wo => wo.title);
      expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe('getWorkOrderById', () => {
    it('should GET /work_order/{id}', async () => {
      api.get.mockReturnValueOnce(
        of({ success: true, data: mockWorkOrders[0], timestamp: new Date() })
      );
      const workOrder = await firstValueFrom(service.getWorkOrderById(1001));
      expect(api.get).toHaveBeenCalledWith('work_order/1001');
      expect(workOrder.orderNumber).toBe(1001);
    });

    it('should reject invalid ids', async () => {
      await expect(firstValueFrom(service.getWorkOrderById(Number.NaN))).rejects.toThrow(
        'Invalid work order id'
      );
    });
  });

  describe('createWorkOrder', () => {
    it('should POST then GET by id and upsert locally', async () => {
      const created = createMockWorkOrder({
        orderNumber: 2001,
        title: 'New Work Order',
        category: {
          id: 2,
          code: 'PLMB',
          description: 'Plumbing',
          active: true,
          dateAdded: '2024-01-01T00:00:00.000Z',
          dateUpdated: '2024-01-01T00:00:00.000Z'
        }
      });

      api.post.mockReturnValue(
        of({ success: true, data: { orderNumber: 2001 }, timestamp: new Date() })
      );
      api.get.mockReturnValue(
        of({ success: true, data: created, timestamp: new Date() })
      );

      const createRequest: WorkOrderCreateRequest = {
        title: 'New Work Order',
        description: 'New description',
        categoryId: 2,
        room: { buildingId: 1, roomNumber: '101' },
        studentId: 1,
        statusCode: STATUS.OPEN,
        dateRequested: '2024-02-01T10:00',
        maintenanceTechnicianCode: null,
        appointmentScheduled: null,
        completionNotes: null
      };

      const result = await firstValueFrom(service.createWorkOrder(createRequest));
      expect(api.post).toHaveBeenCalledWith(
        'work_order',
        expect.objectContaining({
          title: 'New Work Order',
          dateRequested: '2024-02-01'
        })
      );
      expect(api.get).toHaveBeenCalledWith('work_order/2001');
      expect(result.orderNumber).toBe(2001);
      expect(service.workOrders().some(wo => wo.orderNumber === 2001)).toBe(true);
    });

    it('should propagate POST failures', async () => {
      api.post.mockReturnValue(throwError(() => new Error('Student (99) not found')));

      const createRequest: WorkOrderCreateRequest = {
        title: 'Broken',
        description: 'Will fail',
        categoryId: 1,
        room: { buildingId: 1, roomNumber: '101' },
        studentId: 99,
        statusCode: STATUS.OPEN,
        dateRequested: '2024-02-01',
        maintenanceTechnicianCode: null,
        appointmentScheduled: null,
        completionNotes: null
      };

      await expect(firstValueFrom(service.createWorkOrder(createRequest))).rejects.toThrow(
        'Student (99) not found'
      );
    });
  });

  describe('unsupported mutations', () => {
    it('should error on updateWorkOrder', async () => {
      await expect(
        firstValueFrom(service.updateWorkOrder(1001, { title: 'Nope' }))
      ).rejects.toThrow('does not expose update/delete');
    });

    it('should error on deleteWorkOrder', async () => {
      await expect(firstValueFrom(service.deleteWorkOrder(1001))).rejects.toThrow(
        'does not expose update/delete'
      );
    });

    it('should error on assignWorkOrder', async () => {
      await expect(firstValueFrom(service.assignWorkOrder(1001, 'TECH001'))).rejects.toThrow(
        'does not expose update/delete'
      );
    });
  });

  describe('summary', () => {
    it('should calculate summary statistics from loaded orders', async () => {
      const summary = await firstValueFrom(service.getWorkOrderSummary());
      expect(summary.totalOrders).toBe(3);
      expect(summary.openOrders).toBe(1);
      expect(summary.inProgressOrders).toBe(1);
      expect(summary.completedOrders).toBe(1);
      expect(service.summary().totalOrders).toBe(3);
    });
  });

  describe('reloadWorkOrders', () => {
    it('should replace local state from GET /work_order', async () => {
      api.get.mockReturnValue(
        of({ success: true, data: [mockWorkOrders[0]], timestamp: new Date() })
      );
      const rows = await firstValueFrom(service.reloadWorkOrders());
      expect(rows).toHaveLength(1);
      expect(service.workOrders()).toHaveLength(1);
    });
  });
});