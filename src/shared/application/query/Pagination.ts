// src/shared/application/query/Pagination.ts
import { PaginationOptions } from './PaginationOptions';

export class Pagination {
  static normalize(options?: PaginationOptions) {

    const page = Math.max(
      1,
      options?.page ?? 1
    );

    const limit = Math.min(
      100,
      Math.max(1, options?.limit ?? 20)
    );

    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset
    };
  }
}