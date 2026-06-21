import { PaginationOptions }
from '@shared/application/query/PaginationOptions';

import { SortOptions }
from '@shared/application/query/SortOptions';

import { EventSortField }
from './EventSortField';

export interface GetEventsQuery
  extends PaginationOptions,
          SortOptions<EventSortField> {

  owner?: string;

  status?: string;

}