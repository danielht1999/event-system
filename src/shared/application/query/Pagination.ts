// src/shared/application/query/Pagination.ts

import { QueryOptions } from './QueryOptions';

export class Pagination {
  static normalize(options?: QueryOptions) {
    
    const page = Math.max(1, options?.page ?? 1 );

    const limit = Math.min(100, Math.max(1, options?.limit ?? 20 ));

    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset
    };
  }
}