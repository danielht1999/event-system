// src/modules/reservation/application/queries/GetReservationsQuery.ts

import { PaginationOptions } from '@shared/application/query/PaginationOptions';
export interface GetReservationsQuery extends PaginationOptions {
  owner?: string;
  status?: string;
  sortBy?: 'createdAt' | 'eventDate' | 'status';
  sortOrder?: 'asc' | 'desc';
}