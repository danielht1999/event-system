// src/modules/event/application/queries/GetEventsQuery.ts

import { PaginationOptions } from '@shared/application/query/PaginationOptions';

export interface GetEventsQuery extends PaginationOptions {
  owner?: string;
  search?: string;
  status?: string;
  sortBy?: 'date' | 'title' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}