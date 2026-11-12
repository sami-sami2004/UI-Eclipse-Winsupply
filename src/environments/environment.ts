/**
 * Runtime configuration for the Angular app (development build).
 *
 * apiUrl is the base path for ApiService. All REST calls are `${apiUrl}/${endpoint}`.
 * production: when true, use environment.prod.ts (Angular file replacement in angular.json).
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/bookish'
};
