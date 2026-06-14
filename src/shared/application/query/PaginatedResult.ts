// src/shared/application/query/PaginatedResult.ts

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}