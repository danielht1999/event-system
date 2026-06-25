// src/shared/application/query/Pagination.ts
import { PaginationOptions } from './PaginationOptions';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export class Pagination {
  static normalize(options?: PaginationOptions) {
    const page = Math.max(
      DEFAULT_PAGE,
      options?.page ?? DEFAULT_PAGE
    );

    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, options?.limit ?? DEFAULT_LIMIT)
    );

    return {
      page,
      limit,
      offset: (page - 1) * limit
    };
  }
}
