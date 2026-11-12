/**
 * Bookish application routing table.
 *
 * Uses lazy loading so each component is loaded
 * only when the user navigates to its page.
 *
 * Routes:
 *   /dashboard    → Bookish dashboard
 *   /review/list  → List of book reviews
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
]