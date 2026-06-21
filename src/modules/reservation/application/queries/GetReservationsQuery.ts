import { PaginationOptions }
from '@shared/application/query/PaginationOptions';

import { SortOptions }
from '@shared/application/query/SortOptions';

import { ReservationSortField }
from './ReservationSortField';

export interface GetReservationsQuery
  extends PaginationOptions,
          SortOptions<ReservationSortField> {

  owner?: string;

  status?: string;

}