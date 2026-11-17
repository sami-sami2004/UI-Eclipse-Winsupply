
/**
 * Bookish application routing table.
 *
 * Uses lazy loading so each component is loaded
 * only when the user navigates to its page.
 *
 * Routes:
 *   /dashboard    → Bookish dashboard
 *   /review/list  → List of book reviews
 *   /review/create → Create a new review
 *   /review/:id   → View review details
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        m => m.DashboardComponent
      )
  },

  {
    path: 'review',
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./review-list/review-list.component').then(
            m => m.ReviewListComponent
          )
      },

      // Create Review
      {
        path: 'create',
        loadComponent: () =>
          import('./review-create/review-create.component').then(
            m => m.ReviewCreateComponent
          )
      },

      // Review Details
      {
        path: ':id',
        loadComponent: () =>
          import('./review-detail/review-detail.component').then(
            m => m.ReviewDetailComponent
          )
      }
    ]
  },

  // Default redirect
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
