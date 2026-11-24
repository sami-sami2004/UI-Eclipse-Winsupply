import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import {CreateReview} from './features/create-review/create-review';

export const routes: Routes = [
    { path: '', component: Dashboard },
    { path: 'reviews/create', component: CreateReview }
];
